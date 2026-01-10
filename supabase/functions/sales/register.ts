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

    const { action, saleData } = await req.json()

    if (action === 'create_sale') {
      // Generate folio
      const { data: folioData, error: folioError } = await supabaseClient
        .rpc('generate_folio', { prefix: 'VENT' })

      if (folioError) throw folioError

      // Check inventory availability
      const { data: inventory, error: inventoryError } = await supabaseClient
        .from('inventory')
        .select('quantity')
        .eq('product_id', saleData.productId)
        .eq('location_id', saleData.locationId || 1) // Default location if not specified
        .single()

      if (inventoryError || !inventory) {
        return new Response(
          JSON.stringify({ success: false, error: 'Producto no disponible en inventario' }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
          },
        )
      }

      if (inventory.quantity < saleData.quantity) {
        return new Response(
          JSON.stringify({
            success: false,
            error: `Inventario insuficiente. Disponible: ${inventory.quantity}, solicitado: ${saleData.quantity}`
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
          },
        )
      }

      // Calculate total amount
      const totalAmount = saleData.quantity * saleData.precioUnitario

      // Create sale record
      const { data: sale, error: saleError } = await supabaseClient
        .from('sales')
        .insert({
          folio: folioData,
          client_id: saleData.clientId,
          product_id: saleData.productId,
          quantity: saleData.quantity,
          precio_unitario: saleData.precioUnitario,
          total_amount: totalAmount,
          tipo_entrega: saleData.tipoEntrega,
          vehiculo: saleData.vehiculo,
          conductor: saleData.conductor,
          notes: saleData.notes,
          estado: 'pendiente'
        })
        .select()
        .single()

      if (saleError) throw saleError

      return new Response(
        JSON.stringify({ success: true, sale }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      )
    }

    if (action === 'update_status') {
      const { saleId, newStatus, additionalData = {} } = saleData

      // Validate status transition
      const validTransitions = {
        'pendiente': ['en_preparacion'],
        'en_preparacion': ['en_transito'],
        'en_transito': ['entregado']
      }

      const { data: currentSale, error: fetchError } = await supabaseClient
        .from('sales')
        .select('estado')
        .eq('id', saleId)
        .single()

      if (fetchError) throw fetchError

      if (!validTransitions[currentSale.estado]?.includes(newStatus)) {
        return new Response(
          JSON.stringify({
            success: false,
            error: `Transición de estado inválida: ${currentSale.estado} -> ${newStatus}`
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
          },
        )
      }

      // Prepare update data based on status
      const updateData: Record<string, unknown> = { estado: newStatus }

      if (newStatus === 'en_preparacion') {
        updateData.preparation_time = new Date().toISOString()
      } else if (newStatus === 'en_transito') {
        updateData.transit_time = new Date().toISOString()
        if (additionalData.firmaConductor) {
          updateData.firma_conductor_base64 = additionalData.firmaConductor
        }
      } else if (newStatus === 'entregado') {
        updateData.delivery_time = new Date().toISOString()
        if (additionalData.firmaCliente) {
          updateData.firma_cliente_base64 = additionalData.firmaCliente
        }
      }

      const { data: sale, error: updateError } = await supabaseClient
        .from('sales')
        .update(updateData)
        .eq('id', saleId)
        .select()
        .single()

      if (updateError) throw updateError

      return new Response(
        JSON.stringify({ success: true, sale }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      )
    }

    if (action === 'add_signature') {
      const { saleId, signatureType, signatureBase64 } = saleData

      // Validate signature type
      const validTypes = ['cliente', 'conductor']
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
      const { data: existingSale, error: checkError } = await supabaseClient
        .from('sales')
        .select(signatureField)
        .eq('id', saleId)
        .single()

      if (checkError) throw checkError

      if (existingSale[signatureField]) {
        return new Response(
          JSON.stringify({ success: false, error: `La firma del ${signatureType} ya fue registrada` }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
          },
        )
      }

      // Add signature
      const { data: sale, error: signatureError } = await supabaseClient
        .from('sales')
        .update({ [signatureField]: signatureBase64 })
        .eq('id', saleId)
        .select()
        .single()

      if (signatureError) throw signatureError

      return new Response(
        JSON.stringify({ success: true, sale }),
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
    console.error('Error in sales register function:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})
