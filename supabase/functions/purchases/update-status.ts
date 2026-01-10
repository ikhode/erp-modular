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

    const { purchaseId, newStatus, signatureData, notes } = await req.json()

    // Get current purchase status
    const { data: currentPurchase, error: fetchError } = await supabaseClient
      .from('purchases')
      .select('*')
      .eq('id', purchaseId)
      .single()

    if (fetchError) throw fetchError

    // Validate status transition logic
    const validTransitions = {
      'salida': ['carga'],
      'carga': ['regreso'],
      'regreso': ['completado']
    }

    if (!validTransitions[currentPurchase.estado]?.includes(newStatus)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `Transición inválida: ${currentPurchase.estado} → ${newStatus}`
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
    if (newStatus === 'carga') {
      updateData.loading_time = new Date().toISOString()
      if (signatureData?.firmaConductor) {
        updateData.firma_conductor_base64 = signatureData.firmaConductor
      }
    } else if (newStatus === 'regreso') {
      updateData.return_time = new Date().toISOString()
      if (signatureData?.firmaEncargado) {
        updateData.firma_encargado_base64 = signatureData.firmaEncargado
      }
    } else if (newStatus === 'completado') {
      updateData.completion_time = new Date().toISOString()
      if (signatureData?.firmaProveedor) {
        updateData.firma_proveedor_base64 = signatureData.firmaProveedor
      }
    }

    // Add notes if provided
    if (notes) {
      updateData.notes = currentPurchase.notes
        ? `${currentPurchase.notes}\n[${new Date().toISOString()}] ${notes}`
        : `[${new Date().toISOString()}] ${notes}`
    }

    // Update purchase
    const { data: updatedPurchase, error: updateError } = await supabaseClient
      .from('purchases')
      .update(updateData)
      .eq('id', purchaseId)
      .select(`
        *,
        providers:provider_id(name),
        products:product_id(name, unidad),
        employees_conductor:conductor(name)
      `)
      .single()

    if (updateError) throw updateError

    // If completing purchase, trigger inventory update
    if (newStatus === 'completado') {
      // This will be handled by database triggers automatically
      // The inventory will be updated and cash flow recorded
    }

    return new Response(
      JSON.stringify({
        success: true,
        purchase: updatedPurchase,
        message: `Compra actualizada a estado: ${newStatus}`
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Error in purchases update-status function:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})
