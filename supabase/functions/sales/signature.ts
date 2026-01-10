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

    const { saleId, signerType, signatureBase64, faceAuthData, location } = await req.json()

    // Validate signer type
    const validSignerTypes = ['cliente', 'conductor']
    if (!validSignerTypes.includes(signerType)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Tipo de firmante inválido' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        },
      )
    }

    // Get current sale
    const { data: sale, error: fetchError } = await supabaseClient
      .from('sales')
      .select('*')
      .eq('id', saleId)
      .single()

    if (fetchError) throw fetchError

    // Validate signature hasn't been captured before
    const signatureField = `firma_${signerType}_base64`
    if (sale[signatureField]) {
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

    // Update sale with signature
    const { data: updatedSale, error: updateError } = await supabaseClient
      .from('sales')
      .update(signatureData)
      .eq('id', saleId)
      .select(`
        *,
        clients:client_id(name, rfc),
        products:product_id(name),
        employees_conductor:conductor(name)
      `)
      .single()

    if (updateError) throw updateError

    // Log signature event in audit
    await supabaseClient
      .from('audit_logs')
      .insert({
        table_name: 'sales',
        record_id: saleId,
        operation: 'SIGNATURE_ADDED',
        old_values: null,
        new_values: { signer_type: signerType, signed_at: new Date().toISOString() },
        changed_at: new Date().toISOString(),
        ip_address: null,
        user_agent: `Sale signature: ${signerType}`
      })

    // If this is the client signature, automatically complete the sale
    if (signerType === 'cliente') {
      const { error: completeError } = await supabaseClient
        .from('sales')
        .update({
          estado: 'entregado',
          delivery_time: new Date().toISOString()
        })
        .eq('id', saleId)

      if (completeError) {
        console.error('Error completing sale after client signature:', completeError)
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        sale: updatedSale,
        message: `Firma del ${signerType} registrada exitosamente`
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Error in sales signature function:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})
