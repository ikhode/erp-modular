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

    const { action, purchaseData } = await req.json()

    if (action === 'create_purchase') {
      // Generate folio
      const { data: folioData, error: folioError } = await supabaseClient
        .rpc('generate_folio', { prefix: 'COMP' })

      if (folioError) throw folioError

      // Create purchase record
      const { data: purchase, error: purchaseError } = await supabaseClient
        .from('purchases')
        .insert({
          folio: folioData,
          provider_id: purchaseData.providerId,
          product_id: purchaseData.productId,
          quantity: purchaseData.quantity,
          precio_unitario: purchaseData.precioUnitario,
          tipo: purchaseData.tipo,
          vehiculo: purchaseData.vehiculo,
          conductor: purchaseData.conductor,
          notes: purchaseData.notes,
          estado: 'salida'
        })
        .select()
        .single()

      if (purchaseError) throw purchaseError

      return new Response(
        JSON.stringify({ success: true, purchase }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      )
    }

    if (action === 'update_status') {
      const { purchaseId, newStatus, additionalData = {} } = purchaseData

      // Validate status transition
      const validTransitions = {
        'salida': ['carga'],
        'carga': ['regreso'],
        'regreso': ['completado']
      }

      const { data: currentPurchase, error: fetchError } = await supabaseClient
        .from('purchases')
        .select('estado')
        .eq('id', purchaseId)
        .single()

      if (fetchError) throw fetchError

      if (!validTransitions[currentPurchase.estado]?.includes(newStatus)) {
        return new Response(
          JSON.stringify({
            success: false,
            error: `Transición de estado inválida: ${currentPurchase.estado} -> ${newStatus}`
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
          },
        )
      }

      // Prepare update data based on status
      const updateData: Record<string, unknown> = { estado: newStatus }

      if (newStatus === 'carga') {
        updateData.loading_time = new Date().toISOString()
        updateData.firma_conductor_base64 = additionalData.firmaConductor
      } else if (newStatus === 'regreso') {
        updateData.return_time = new Date().toISOString()
        updateData.firma_encargado_base64 = additionalData.firmaEncargado
      } else if (newStatus === 'completado') {
        updateData.completion_time = new Date().toISOString()
        updateData.firma_proveedor_base64 = additionalData.firmaProveedor
      }

      const { data: purchase, error: updateError } = await supabaseClient
        .from('purchases')
        .update(updateData)
        .eq('id', purchaseId)
        .select()
        .single()

      if (updateError) throw updateError

      return new Response(
        JSON.stringify({ success: true, purchase }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      )
    }

    if (action === 'add_signature') {
      const { purchaseId, signatureType, signatureBase64 } = purchaseData

      // Validate signature type
      const validTypes = ['conductor', 'encargado', 'proveedor']
      if (!validTypes.includes(signatureType)) {
        return new Response(
          JSON.stringify({ success: false, error: 'Tipo de firma inválido' }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
          },
        )
      }

      // Check if signature already exists
      const signatureField = `firma_${signatureType}_base64`
      const { data: existingPurchase, error: checkError } = await supabaseClient
        .from('purchases')
        .select(signatureField)
        .eq('id', purchaseId)
        .single()

      if (checkError) throw checkError

      if (existingPurchase[signatureField]) {
        return new Response(
          JSON.stringify({ success: false, error: `La firma del ${signatureType} ya fue registrada` }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
          },
        )
      }

      // Add signature
      const { data: purchase, error: signatureError } = await supabaseClient
        .from('purchases')
        .update({ [signatureField]: signatureBase64 })
        .eq('id', purchaseId)
        .select()
        .single()

      if (signatureError) throw signatureError

      return new Response(
        JSON.stringify({ success: true, purchase }),
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
    console.error('Error in purchases register function:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})
