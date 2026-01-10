import {serve} from "https://deno.land/std@0.168.0/http/server.ts"
import {createClient} from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const { action, ticketData } = await req.json()

    if (action === 'create_ticket') {
      // Generate folio
      const { data: folioData, error: folioError } = await supabaseClient
        .rpc('generate_folio', { prefix: 'PROD' })

      if (folioError) throw folioError

      // Create production ticket
      const { data: ticket, error: ticketError } = await supabaseClient
        .from('production_tickets')
        .insert({
          folio: folioData,
          process_id: ticketData.processId,
          employee_id: ticketData.employeeId,
          input_items: ticketData.inputItems,
          output_product_id: ticketData.outputProductId,
          output_quantity: ticketData.outputQuantity,
          output_location_id: ticketData.outputLocationId,
          notes: ticketData.notes,
          status: 'pendiente'
        })
        .select()
        .single()

      if (ticketError) throw ticketError

      return new Response(
        JSON.stringify({ success: true, ticket }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      )
    }

    if (action === 'start_production') {
      const { ticketId } = ticketData

      // Update ticket status to 'en_proceso'
      const { data: ticket, error: ticketError } = await supabaseClient
        .from('production_tickets')
        .update({ status: 'en_proceso' })
        .eq('id', ticketId)
        .select()
        .single()

      if (ticketError) throw ticketError

      return new Response(
        JSON.stringify({ success: true, ticket }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      )
    }

    if (action === 'add_employee_signature') {
      const { ticketId, signatureBase64, faceAuthData } = ticketData

      // Validate that signature doesn't already exist
      const { data: existingTicket, error: checkError } = await supabaseClient
        .from('production_tickets')
        .select('employee_signature_base64')
        .eq('id', ticketId)
        .single()

      if (checkError) throw checkError

      if (existingTicket.employee_signature_base64) {
        return new Response(
          JSON.stringify({ success: false, error: 'La firma digital ya fue registrada para este ticket' }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
          },
        )
      }

      // Add signature and face auth data
      const updateData: Record<string, unknown> = { employee_signature_base64: signatureBase64 }
      if (faceAuthData) {
        updateData.face_auth_data = faceAuthData
      }

      const { data: ticket, error: ticketError } = await supabaseClient
        .from('production_tickets')
        .update(updateData)
        .eq('id', ticketId)
        .select()
        .single()

      if (ticketError) throw ticketError

      return new Response(
        JSON.stringify({ success: true, ticket }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      )
    }

    return new Response(
      JSON.stringify({ success: false, error: 'Acción no válida' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )

  } catch (error) {
    console.error('Error in production register function:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})
