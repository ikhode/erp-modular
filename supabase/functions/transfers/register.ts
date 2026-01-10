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

    const { action, transferData } = await req.json()

    if (action === 'create_transfer') {
      const { productId, quantity, fromLocationId, toLocationId, notes } = transferData

      // Validar que las ubicaciones sean diferentes
      if (fromLocationId === toLocationId) {
        return new Response(
          JSON.stringify({ success: false, error: 'Las ubicaciones de origen y destino deben ser diferentes' }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
          },
        )
      }

      // Generar folio
      const { data: folioData, error: folioError } = await supabaseClient
        .rpc('generate_folio', { prefix: 'TRAS' })

      if (folioError) throw folioError

      // Crear traslado
      const { data: transfer, error: transferError } = await supabaseClient
        .from('transfers')
        .insert({
          folio: folioData,
          product_id: productId,
          quantity: quantity,
          from_location_id: fromLocationId,
          to_location_id: toLocationId,
          notes: notes,
          status: 'pendiente'
        })
        .select(`
          *,
          products(name),
          from_location:locations!transfers_from_location_id_fkey(name),
          to_location:locations!transfers_to_location_id_fkey(name)
        `)
        .single()

      if (transferError) throw transferError

      return new Response(
        JSON.stringify({
          success: true,
          transfer: transfer,
          message: `Traslado ${folioData} creado exitosamente`
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      )
    }

    if (action === 'process_transfer') {
      const { transferId } = transferData

      // Ejecutar función de procesamiento
      const { error: processError } = await supabaseClient
        .rpc('process_transfer', { transfer_id: transferId })

      if (processError) throw processError

      // Obtener traslado actualizado
      const { data: transfer, error: transferError } = await supabaseClient
        .from('transfers')
        .select(`
          *,
          products(name),
          from_location:locations!transfers_from_location_id_fkey(name),
          to_location:locations!transfers_to_location_id_fkey(name),
          transfer_movements(*)
        `)
        .eq('id', transferId)
        .single()

      if (transferError) throw transferError

      return new Response(
        JSON.stringify({
          success: true,
          transfer: transfer,
          message: 'Traslado procesado exitosamente'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      )
    }

    if (action === 'cancel_transfer') {
      const { transferId, reason } = transferData

      // Ejecutar función de cancelación
      const { error: cancelError } = await supabaseClient
        .rpc('cancel_transfer', {
          transfer_id: transferId,
          cancel_reason: reason || 'Cancelado por usuario'
        })

      if (cancelError) throw cancelError

      // Obtener traslado actualizado
      const { data: transfer, error: transferError } = await supabaseClient
        .from('transfers')
        .select(`
          *,
          products(name),
          from_location:locations!transfers_from_location_id_fkey(name),
          to_location:locations!transfers_to_location_id_fkey(name)
        `)
        .eq('id', transferId)
        .single()

      if (transferError) throw transferError

      return new Response(
        JSON.stringify({
          success: true,
          transfer: transfer,
          message: 'Traslado cancelado exitosamente'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      )
    }

    if (action === 'get_inventory_by_location') {
      const { productId } = transferData

      // Obtener inventario por ubicación para un producto
      const { data: inventory, error: inventoryError } = await supabaseClient
        .from('inventory')
        .select(`
          quantity,
          locations(id, name, type)
        `)
        .eq('product_id', productId)
        .gt('quantity', 0)
        .order('quantity', { ascending: false })

      if (inventoryError) throw inventoryError

      return new Response(
        JSON.stringify({
          success: true,
          inventory: inventory
        }),
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
    console.error('Error in transfers function:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})
