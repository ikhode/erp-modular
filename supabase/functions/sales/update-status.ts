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

    const { saleId, newStatus, signatureData, notes } = await req.json()

    // Get current sale status
    const { data: currentSale, error: fetchError } = await supabaseClient
      .from('sales')
      .select('*')
      .eq('id', saleId)
      .single()

    if (fetchError) throw fetchError

    // Validate status transition logic
    const validTransitions = {
      'pendiente': ['en_preparacion'],
      'en_preparacion': ['en_transito'],
      'en_transito': ['entregado']
    }

    if (!validTransitions[currentSale.estado]?.includes(newStatus)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `Transición inválida: ${currentSale.estado} → ${newStatus}`
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        },
      )
    }

    // Prepare update data
    const updateData: Record<string, unknown> = {
      estado: newStatus,
      updated_at: new Date().toISOString()
    }

    // Add timestamps and signatures based on new status
    if (newStatus === 'en_preparacion') {
      updateData.preparation_time = new Date().toISOString()
    } else if (newStatus === 'en_transito') {
      updateData.transit_time = new Date().toISOString()
      if (signatureData?.firmaConductor) {
        updateData.firma_conductor_base64 = signatureData.firmaConductor
      }
    } else if (newStatus === 'entregado') {
      updateData.delivery_time = new Date().toISOString()
      if (signatureData?.firmaCliente) {
        updateData.firma_cliente_base64 = signatureData.firmaCliente
      }
    }

    // Add notes if provided
    if (notes) {
      updateData.notes = currentSale.notes
        ? `${currentSale.notes}\n[${new Date().toISOString()}] ${notes}`
        : `[${new Date().toISOString()}] ${notes}`
    }

    // Update sale
    const { data: updatedSale, error: updateError } = await supabaseClient
      .from('sales')
      .update(updateData)
      .eq('id', saleId)
      .select(`
        *,
        clients:client_id(name),
        products:product_id(name, unidad),
        employees_conductor:conductor(name)
      `)
      .single()

    if (updateError) throw updateError

    // If completing sale, trigger inventory update and cash flow
    if (newStatus === 'entregado') {
      // This will be handled by database triggers automatically
      // The inventory will be reduced and cash flow will be recorded
    }

    return new Response(
      JSON.stringify({
        success: true,
        sale: updatedSale,
        message: `Venta actualizada a estado: ${newStatus}`
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Error in sales update-status function:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})
