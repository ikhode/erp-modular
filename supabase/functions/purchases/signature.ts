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

    const { purchaseId, signerType, signatureBase64, faceAuthData, location } = await req.json()

    // Validate signer type
    const validSignerTypes = ['conductor', 'encargado', 'proveedor']
    if (!validSignerTypes.includes(signerType)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Tipo de firmante inválido' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        },
      )
    }

    // Get current purchase
    const { data: purchase, error: fetchError } = await supabaseClient
      .from('purchases')
      .select('*')
      .eq('id', purchaseId)
      .single()

    if (fetchError) throw fetchError

    // Validate signature hasn't been captured before
    const signatureField = `firma_${signerType}_base64`
    if (purchase[signatureField]) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `La firma del ${signerType} ya fue capturada anteriormente`
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        },
      )
    }

    // Validate signature format (base64 image)
    if (!signatureBase64 || !signatureBase64.startsWith('data:image/')) {
      return new Response(
        JSON.stringify({ success: false, error: 'Formato de firma inválido' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        },
      )
    }

    // Prepare signature data
    const signatureData: Record<string, unknown> = {
      [signatureField]: signatureBase64,
      updated_at: new Date().toISOString()
    }

    // Add face auth data if provided
    if (faceAuthData) {
      signatureData.face_auth_data = faceAuthData
    }

    // Add location data if provided (for GPS tracking)
    if (location) {
      signatureData[`${signerType}_location`] = location
    }

    // Update purchase with signature
    const { data: updatedPurchase, error: updateError } = await supabaseClient
      .from('purchases')
      .update(signatureData)
      .eq('id', purchaseId)
      .select(`
        *,
        providers:provider_id(name, rfc),
        products:product_id(name),
        employees_conductor:conductor(name)
      `)
      .single()

    if (updateError) throw updateError

    // Log signature event in audit
    await supabaseClient
      .from('audit_logs')
      .insert({
        table_name: 'purchases',
        record_id: purchaseId,
        operation: 'SIGNATURE_ADDED',
        old_values: null,
        new_values: { signer_type: signerType, signed_at: new Date().toISOString() },
        changed_at: new Date().toISOString(),
        ip_address: null,
        user_agent: `Purchase signature: ${signerType}`
      })

    // If this is the final signature (proveedor), automatically complete the purchase
    if (signerType === 'proveedor') {
      const { error: completeError } = await supabaseClient
        .from('purchases')
        .update({
          estado: 'completado',
          completion_time: new Date().toISOString()
        })
        .eq('id', purchaseId)

      if (completeError) {
        console.error('Error completing purchase after provider signature:', completeError)
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        purchase: updatedPurchase,
        message: `Firma del ${signerType} registrada exitosamente`
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Error in purchases signature function:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})
