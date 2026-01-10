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
      const { arId, amount, paymentMethod, reference, notes } = paymentData

      // Validar que la cuenta existe y está pendiente
      const { data: ar, error: arError } = await supabaseClient
        .from('accounts_receivable')
        .select('balance, status, client_id, clients(name)')
        .eq('id', arId)
        .single()

      if (arError) throw arError

      if (ar.status === 'pagado') {
        return new Response(
          JSON.stringify({ success: false, error: 'Esta cuenta ya está completamente pagada' }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
          },
        )
      }

      if (amount > ar.balance) {
        return new Response(
          JSON.stringify({
            success: false,
            error: `El monto del pago (${amount}) no puede ser mayor al saldo pendiente (${ar.balance})`
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
          },
        )
      }

      // Registrar el pago
      const { data: payment, error: paymentError } = await supabaseClient
        .from('ar_payments')
        .insert({
          ar_id: arId,
          amount: amount,
          payment_method: paymentMethod,
          reference: reference,
          notes: notes
        })
        .select()
        .single()

      if (paymentError) throw paymentError

      // El trigger update_ar_status() se ejecutará automáticamente y actualizará el estado

      // Registrar movimiento en caja (ingreso por cobro)
      const { error: cashError } = await supabaseClient
        .from('cash_flow')
        .insert({
          amount: amount,
          movement_type: 'ingreso',
          source_type: 'cobro_cxc',
          reference_type: 'ar_payment',
          reference_id: payment.id,
          description: `Cobro CxC - ${ar.clients.name} - ${reference || 'Sin referencia'}`,
          payment_method: paymentMethod
        })

      if (cashError) {
        console.error('Error registering cash movement:', cashError)
        // No lanzamos error aquí para no fallar la operación completa
      }

      // Obtener estado actualizado de la cuenta
      const { data: updatedAr, error: updatedArError } = await supabaseClient
        .from('accounts_receivable')
        .select(`
          *,
          clients(name, rfc),
          ar_payments(amount, payment_date, payment_method, reference)
        `)
        .eq('id', arId)
        .single()

      if (updatedArError) throw updatedArError

      return new Response(
        JSON.stringify({
          success: true,
          payment: payment,
          account: updatedAr,
          message: `Pago de $${amount} aplicado exitosamente`
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      )
    }

    if (action === 'get_account_statement') {
      const { clientId } = paymentData

      // Obtener estado de cuenta del cliente
      const { data: statement, error: statementError } = await supabaseClient
        .from('vw_cxc_estado_cuenta')
        .select('*')
        .eq('client_id', clientId)
        .single()

      if (statementError) throw statementError

      // Obtener detalle de cuentas
      const { data: accounts, error: accountsError } = await supabaseClient
        .from('accounts_receivable')
        .select(`
          id, folio, amount, paid_amount, balance, due_date, status, description, terms,
          created_at,
          ar_payments(amount, payment_date, payment_method, reference, notes, created_at)
        `)
        .eq('client_id', clientId)
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
      const { clientId, amount, dueDate, description, terms } = paymentData

      // Generar folio
      const { data: folioData, error: folioError } = await supabaseClient
        .rpc('generate_folio', { prefix: 'CXC' })

      if (folioError) throw folioError

      // Crear cuenta por cobrar
      const { data: credit, error: creditError } = await supabaseClient
        .from('accounts_receivable')
        .insert({
          client_id: clientId,
          folio: folioData,
          amount: amount,
          due_date: dueDate,
          description: description,
          terms: terms
        })
        .select(`
          *,
          clients(name, rfc)
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
    console.error('Error in AR apply-payment function:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})
