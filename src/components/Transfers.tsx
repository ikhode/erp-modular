import React, {useEffect, useState} from 'react';
import {supabase} from '../lib/supabase';
import {ArrowRight, Ban, CheckCircle, Clock, MapPin, Package, Play, XCircle} from 'lucide-react';
import TransferForm from './TransferForm';

interface Transfer {
  id: string;
  folio: string;
  quantity: number;
  transfer_date: string;
  status: 'pendiente' | 'en_transito' | 'completado' | 'cancelado';
  notes: string;
  created_at: string;
  products: {
    name: string;
    unit: string;
  };
  from_location: {
    name: string;
    type: string;
  };
  to_location: {
    name: string;
    type: string;
  };
}

export default function Transfers() {
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    loadTransfers();
  }, []);

  const loadTransfers = async () => {
    try {
      const { data, error } = await supabase
        .from('transfers')
        .select(`
          id, folio, quantity, transfer_date, status, notes, created_at,
          products(name, unit),
          from_location:locations!transfers_from_location_id_fkey(name, type),
          to_location:locations!transfers_to_location_id_fkey(name, type)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTransfers(data || []);
    } catch (error) {
      console.error('Error loading transfers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProcessTransfer = async (transferId: string) => {
    if (!confirm('¿Está seguro de procesar este traslado? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('transfers/register', {
        body: {
          action: 'process_transfer',
          transferData: { transferId }
        }
      });

      if (error) throw error;

      if (data.success) {
        alert('Traslado procesado exitosamente');
        loadTransfers();
      } else {
        throw new Error(data.error);
      }
    } catch (error: unknown) {
      console.error('Error processing transfer:', error);
      alert('Error al procesar el traslado: ' + (error as Error).message);
    }
  };

  const handleCancelTransfer = async (transferId: string) => {
    const reason = prompt('Motivo de cancelación:');
    if (!reason) return;

    try {
      const { data, error } = await supabase.functions.invoke('transfers/register', {
        body: {
          action: 'cancel_transfer',
          transferData: { transferId, reason }
        }
      });

      if (error) throw error;

      if (data.success) {
        alert('Traslado cancelado exitosamente');
        loadTransfers();
      } else {
        throw new Error(data.error);
      }
    } catch (error: unknown) {
      console.error('Error canceling transfer:', error);
      alert('Error al cancelar el traslado: ' + (error as Error).message);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completado':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'en_transito':
        return <Clock className="h-5 w-5 text-blue-500" />;
      case 'cancelado':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completado':
        return 'bg-green-100 text-green-800';
      case 'en_transito':
        return 'bg-blue-100 text-blue-800';
      case 'cancelado':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
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
          <h1 className="text-2xl font-bold text-gray-900">Traslados</h1>
          <p className="text-gray-600">Movimiento de productos entre ubicaciones</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <ArrowRight className="h-5 w-5 mr-2" />
          Nuevo Traslado
        </button>
      </div>

      {/* Resumen General */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <Package className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Traslados</p>
              <p className="text-2xl font-bold text-gray-900">{transfers.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <CheckCircle className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Completados</p>
              <p className="text-2xl font-bold text-gray-900">
                {transfers.filter(t => t.status === 'completado').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-yellow-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pendientes</p>
              <p className="text-2xl font-bold text-gray-900">
                {transfers.filter(t => t.status === 'pendiente').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <XCircle className="h-8 w-8 text-red-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Cancelados</p>
              <p className="text-2xl font-bold text-gray-900">
                {transfers.filter(t => t.status === 'cancelado').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Traslados */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Traslados Registrados
          </h3>

          <div className="space-y-4">
            {transfers.map((transfer) => (
              <div key={transfer.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(transfer.status)}
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">
                        {transfer.folio}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {transfer.products.name}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Cantidad</p>
                      <p className="text-lg font-semibold">
                        {transfer.quantity} {transfer.products.unit}
                      </p>
                    </div>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(transfer.status)}`}>
                      {transfer.status}
                    </span>
                  </div>
                </div>

                {/* Ruta del traslado */}
                <div className="mt-3 flex items-center justify-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium">{transfer.from_location.name}</span>
                    <span className="text-xs text-gray-500">({transfer.from_location.type})</span>
                  </div>

                  <ArrowRight className="h-4 w-4 text-gray-400" />

                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium">{transfer.to_location.name}</span>
                    <span className="text-xs text-gray-500">({transfer.to_location.type})</span>
                  </div>
                </div>

                {transfer.notes && (
                  <p className="mt-2 text-sm text-gray-600">{transfer.notes}</p>
                )}

                <div className="mt-3 flex items-center justify-between">
                  <p className="text-xs text-gray-500">
                    Fecha: {formatDate(transfer.transfer_date)} | Creado: {formatDate(transfer.created_at)}
                  </p>
                  <div className="flex space-x-2">
                    {transfer.status === 'pendiente' && (
                      <>
                        <button
                          onClick={() => handleProcessTransfer(transfer.id)}
                          className="text-xs bg-green-100 hover:bg-green-200 text-green-700 px-2 py-1 rounded flex items-center"
                        >
                          <Play className="h-3 w-3 mr-1" />
                          Procesar
                        </button>
                        <button
                          onClick={() => handleCancelTransfer(transfer.id)}
                          className="text-xs bg-red-100 hover:bg-red-200 text-red-700 px-2 py-1 rounded flex items-center"
                        >
                          <Ban className="h-3 w-3 mr-1" />
                          Cancelar
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {transfers.length === 0 && (
              <div className="text-center py-12">
                <ArrowRight className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No hay traslados registrados</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Crea tu primer traslado para mover productos entre ubicaciones.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {showForm && (
        <TransferForm
          onClose={() => setShowForm(false)}
          onSuccess={() => {
            loadTransfers();
            setShowForm(false);
          }}
        />
      )}
    </div>
  );
}
