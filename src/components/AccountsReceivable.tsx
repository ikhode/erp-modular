import {useEffect, useState} from 'react';
import {supabase} from '../lib/supabase';
import {AlertTriangle, CheckCircle, Clock, CreditCard, DollarSign, Plus, XCircle} from 'lucide-react';
import ARForm from './ARForm';

interface AccountReceivable {
  id: string;
  folio: string;
  amount: number;
  paid_amount: number;
  balance: number;
  due_date: string;
  status: 'pendiente' | 'parcial' | 'pagado' | 'vencido';
  description: string;
  terms: string;
  created_at: string;
  clients: {
    name: string;
    rfc: string;
  };
}

interface Statement {
  client_id: string;
  client_name: string;
  client_rfc: string;
  total_cuentas: number;
  total_credito: number;
  total_pagado: number;
  saldo_pendiente: number;
  cuentas_vencidas: number;
  cuentas_pendientes: number;
  proxima_fecha_vencimiento: string;
}

export default function AccountsReceivable() {
  const [accounts, setAccounts] = useState<AccountReceivable[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [statement, setStatement] = useState<Statement | null>(null);

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      // Mock accounts receivable data for local development
      const mockAccounts: AccountReceivable[] = [
        {
          id: '1',
          folio: 'CXC-001',
          amount: 15000,
          paid_amount: 5000,
          balance: 10000,
          due_date: '2026-02-15',
          status: 'pendiente',
          description: 'Venta de productos a cliente mayorista',
          terms: '30 días',
          created_at: '2026-01-15',
          clients: { name: 'Cliente Mayorista S.A.', rfc: 'CMA123456789' }
        },
        {
          id: '2',
          folio: 'CXC-002',
          amount: 8500,
          paid_amount: 8500,
          balance: 0,
          due_date: '2026-01-30',
          status: 'pagado',
          description: 'Venta de copra procesada',
          terms: '15 días',
          created_at: '2026-01-10',
          clients: { name: 'Distribuidora del Sur', rfc: 'DDS987654321' }
        }
      ];

      setAccounts(mockAccounts);
    } catch (error) {
      console.error('Error loading accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadClientStatement = async (clientId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('ar/apply-payment', {
        body: {
          action: 'get_account_statement',
          paymentData: { clientId }
        }
      });

      if (error) throw error;

      if (data.success) {
        setStatement(data.statement);
      }
    } catch (error) {
      console.error('Error loading statement:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pagado':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'parcial':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'vencido':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pagado':
        return 'bg-green-100 text-green-800';
      case 'parcial':
        return 'bg-yellow-100 text-yellow-800';
      case 'vencido':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-MX');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cuentas por Cobrar</h1>
          <p className="text-gray-600">Gestión de créditos y cobros pendientes</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Plus className="h-5 w-5 mr-2" />
          Nuevo Crédito
        </button>
      </div>

      {/* Resumen General */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <CreditCard className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Cuentas</p>
              <p className="text-2xl font-bold text-gray-900">{accounts.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <DollarSign className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Crédito</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(accounts.reduce((sum, acc) => sum + acc.amount, 0))}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <CheckCircle className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Cobrado</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(accounts.reduce((sum, acc) => sum + acc.paid_amount, 0))}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <AlertTriangle className="h-8 w-8 text-red-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Saldo Pendiente</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(accounts.reduce((sum, acc) => sum + acc.balance, 0))}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Estado de Cuenta por Cliente */}
      {statement && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Estado de Cuenta - {statement.client_name}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-600">Total Crédito</p>
              <p className="text-lg font-semibold">{formatCurrency(statement.total_credito)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Pagado</p>
              <p className="text-lg font-semibold">{formatCurrency(statement.total_pagado)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Saldo Pendiente</p>
              <p className="text-lg font-semibold">{formatCurrency(statement.saldo_pendiente)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Cuentas Vencidas</p>
              <p className="text-lg font-semibold text-red-600">{statement.cuentas_vencidas}</p>
            </div>
          </div>
        </div>
      )}

      {/* Lista de Cuentas */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Cuentas por Cobrar
          </h3>

          <div className="space-y-4">
            {accounts.map((account) => (
              <div key={account.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(account.status)}
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">
                        {account.folio}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {account.clients.name} - {account.clients.rfc}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Monto</p>
                      <p className="text-lg font-semibold">{formatCurrency(account.amount)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Pendiente</p>
                      <p className="text-lg font-semibold text-red-600">
                        {formatCurrency(account.balance)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Vence</p>
                      <p className="text-sm font-medium">{formatDate(account.due_date)}</p>
                    </div>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(account.status)}`}>
                      {account.status}
                    </span>
                  </div>
                </div>

                {account.description && (
                  <p className="mt-2 text-sm text-gray-600">{account.description}</p>
                )}

                <div className="mt-3 flex items-center justify-between">
                  <p className="text-xs text-gray-500">
                    Términos: {account.terms} | Creado: {formatDate(account.created_at)}
                  </p>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => loadClientStatement(account.clients ? '' : account.id)}
                      className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded"
                    >
                      Ver Estado
                    </button>
                    <button className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 px-2 py-1 rounded">
                      Registrar Pago
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {accounts.length === 0 && (
              <div className="text-center py-12">
                <CreditCard className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No hay cuentas por cobrar</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Crea tu primera cuenta por cobrar para comenzar a gestionar créditos.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {showForm && (
        <ARForm
          onClose={() => setShowForm(false)}
          onSuccess={() => {
            loadAccounts();
            setShowForm(false);
          }}
        />
      )}
    </div>
  );
}
