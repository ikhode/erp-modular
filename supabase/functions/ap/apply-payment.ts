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

    const { action, paymentData } = await req.json()

    if (action === 'apply_payment') {
      const { apId, amount, paymentMethod, reference, notes } = paymentData

      // Validar que la cuenta existe y está pendiente
      const { data: ap, error: apError } = await supabaseClient
        .from('accounts_payable')
        .select('balance, status, provider_id, providers(name)')
        .eq('id', apId)
        .single()

      if (apError) throw apError

      if (ap.status === 'pagado') {
        return new Response(
          JSON.stringify({ success: false, error: 'Esta cuenta ya está completamente pagada' }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
          },
        )
      }

      if (amount > ap.balance) {
        return new Response(
          JSON.stringify({
            success: false,
            error: `El monto del pago (${amount}) no puede ser mayor al saldo pendiente (${ap.balance})`
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
          },
        )
      }

      // Registrar el pago
      const { data: payment, error: paymentError } = await supabaseClient
        .from('ap_payments')
        .insert({
          ap_id: apId,
          amount: amount,
          payment_method: paymentMethod,
          reference: reference,
          notes: notes
        })
        .select()
        .single()

      if (paymentError) throw paymentError

      // El trigger update_ap_status() se ejecutará automáticamente y actualizará el estado

      // Registrar movimiento en caja (egreso por pago a proveedor)
      const { error: cashError } = await supabaseClient
        .from('cash_flow')
        .insert({
          amount: -amount, // Negativo para egreso
          movement_type: 'egreso',
          source_type: 'pago_cxp',
          reference_type: 'ap_payment',
          reference_id: payment.id,
          description: `Pago CxP - ${ap.providers.name} - ${reference || 'Sin referencia'}`,
          payment_method: paymentMethod
        })

      if (cashError) {
        console.error('Error registering cash movement:', cashError)
        // No lanzamos error aquí para no fallar la operación completa
      }

      // Obtener estado actualizado de la cuenta
      const { data: updatedAp, error: updatedApError } = await supabaseClient
        .from('accounts_payable')
        .select(`
          *,
          providers(name, rfc),
          ap_payments(amount, payment_date, payment_method, reference, notes, created_at)
        `)
        .eq('id', apId)
        .single()

      if (updatedApError) throw updatedApError

      return new Response(
        JSON.stringify({
          success: true,
          payment: payment,
          account: updatedAp,
          message: `Pago de $${amount} aplicado exitosamente`
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      )
    }

    if (action === 'get_account_statement') {
      const { providerId } = paymentData

      // Obtener estado de cuenta del proveedor
      const { data: statement, error: statementError } = await supabaseClient
        .from('vw_cxp_estado_cuenta')
        .select('*')
        .eq('provider_id', providerId)
        .single()

      if (statementError) throw statementError

      // Obtener detalle de cuentas
      const { data: accounts, error: accountsError } = await supabaseClient
        .from('accounts_payable')
        .select(`
          id, folio, amount, paid_amount, balance, due_date, status, description, terms,
          created_at,
          ap_payments(amount, payment_date, payment_method, reference, notes, created_at)
        `)
        .eq('provider_id', providerId)
        .order('created_at', { ascending: false })

      if (accountsError) throw accountsError

      return new Response(
        JSON.stringify({
          success: true,
          statement: statement,
          accounts: accounts
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      )
    }

    if (action === 'create_credit') {
      const { providerId, amount, dueDate, description, terms } = paymentData

      // Generar folio
      const { data: folioData, error: folioError } = await supabaseClient
        .rpc('generate_folio', { prefix: 'CXP' })

      if (folioError) throw folioError

      // Crear cuenta por pagar
      const { data: credit, error: creditError } = await supabaseClient
        .from('accounts_payable')
        .insert({
          provider_id: providerId,
          folio: folioData,
          amount: amount,
          due_date: dueDate,
          description: description,
          terms: terms
        })
        .select(`
          *,
          providers(name, rfc)
        `)
        .single()

      if (creditError) throw creditError

      return new Response(
        JSON.stringify({
          success: true,
          credit: credit,
          message: `Crédito por $${amount} creado exitosamente`
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
    console.error('Error in AP apply-payment function:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})
