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

    if (action === 'complete_production') {
      const { ticketId, supervisorNotes, qualityCheck, qualityNotes } = ticketData

      // Update ticket to completed with quality control
      const { data: ticket, error: ticketError } = await supabaseClient
        .from('production_tickets')
        .update({
          status: 'completado',
          supervisor_notes: supervisorNotes,
          quality_check: qualityCheck,
          quality_notes: qualityNotes
        })
        .eq('id', ticketId)
        .select()
        .single()

      if (ticketError) throw ticketError

      // The inventory movements and cash flow will be handled automatically by database triggers

      return new Response(
        JSON.stringify({ success: true, ticket }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      )
    }

    if (action === 'register_payment') {
      const { ticketId, paymentAmount, paymentMethod } = ticketData

      // Register payment for production
      const { data: ticket, error: ticketError } = await supabaseClient
        .from('production_tickets')
        .update({
          payment_amount: paymentAmount,
          payment_method: paymentMethod || 'efectivo'
        })
        .eq('id', ticketId)
        .select()
        .single()

      if (ticketError) throw ticketError

      // Cash flow movement will be handled automatically by database trigger

      return new Response(
        JSON.stringify({ success: true, ticket }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      )
    }

    if (action === 'generate_receipt') {
      const { ticketId } = ticketData

      // Get ticket data for receipt generation
      const { data: ticket, error: ticketError } = await supabaseClient
        .from('production_tickets')
        .select(`
          *,
          processes:process_id(name),
          employees:employee_id(name),
          products:output_product_id(name)
        `)
        .eq('id', ticketId)
        .single()

      if (ticketError) throw ticketError

      // Generate PDF receipt (simplified - in real implementation use a PDF library)
      const receiptData = {
        folio: ticket.folio,
        employee: ticket.employees?.name,
        process: ticket.processes?.name,
        product: ticket.products?.name,
        quantity: ticket.output_quantity,
        paymentAmount: ticket.payment_amount,
        paymentMethod: ticket.payment_method,
        completedAt: ticket.completed_at,
        paidAt: ticket.paid_at
      }

      // In a real implementation, you would generate a PDF here
      // For now, return the receipt data
      return new Response(
        JSON.stringify({ success: true, receipt: receiptData }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      )
    }

    if (action === 'cancel_ticket') {
      const { ticketId, reason } = ticketData

      // Only allow cancellation if not completed
      const { data: existingTicket, error: checkError } = await supabaseClient
        .from('production_tickets')
        .select('status')
        .eq('id', ticketId)
        .single()

      if (checkError) throw checkError

      if (existingTicket.status === 'completado') {
        return new Response(
          JSON.stringify({ success: false, error: 'No se puede cancelar un ticket completado' }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
          },
        )
      }

      const { data: ticket, error: ticketError } = await supabaseClient
        .from('production_tickets')
        .update({
          status: 'cancelado',
          notes: reason ? `Cancelado: ${reason}` : 'Cancelado por usuario'
        })
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
    console.error('Error in production complete function:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})
