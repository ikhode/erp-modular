import React, {useEffect, useState} from 'react';
import {supabase} from '../lib/supabase';
import {Calendar, CreditCard, DollarSign, FileText, User} from 'lucide-react';

interface Provider {
  id: string;
  name: string;
  rfc: string;
}

interface APFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function APForm({ onClose, onSuccess }: APFormProps) {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    providerId: '',
    amount: '',
    dueDate: '',
    description: '',
    terms: '30 días'
  });

  useEffect(() => {
    loadProviders();
  }, []);

  const loadProviders = async () => {
    try {
      const { data, error } = await supabase
        .from('providers')
        .select('id, name, rfc')
        .order('name');

      if (error) throw error;
      setProviders(data || []);
    } catch (error) {
      console.error('Error loading providers:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('ap/apply-payment', {
        body: {
          action: 'create_credit',
          paymentData: {
            providerId: formData.providerId,
            amount: parseFloat(formData.amount),
            dueDate: formData.dueDate,
            description: formData.description,
            terms: formData.terms
          }
        }
      });

      if (error) throw error;

      if (data.success) {
        onSuccess();
        onClose();
      } else {
        throw new Error(data.error);
      }
    } catch (error: unknown) {
      console.error('Error creating credit:', error);
      alert('Error al crear el crédito: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const calculateDueDate = (terms: string) => {
    const today = new Date();
    let days = 30; // default

    if (terms.includes('15')) days = 15;
    else if (terms.includes('30')) days = 30;
    else if (terms.includes('45')) days = 45;
    else if (terms.includes('60')) days = 60;

    today.setDate(today.getDate() + days);
    return today.toISOString().split('T')[0];
  };

  const handleTermsChange = (terms: string) => {
    setFormData(prev => ({
      ...prev,
      terms,
      dueDate: calculateDueDate(terms)
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-2">
            <CreditCard className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Crear Cuenta por Pagar</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <span className="sr-only">Cerrar</span>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Proveedor */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="h-4 w-4 inline mr-1" />
                Proveedor
              </label>
              <select
                value={formData.providerId}
                onChange={(e) => setFormData(prev => ({ ...prev, providerId: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Seleccionar proveedor...</option>
                {providers.map(provider => (
                  <option key={provider.id} value={provider.id}>
                    {provider.name} - {provider.rfc}
                  </option>
                ))}
              </select>
            </div>

            {/* Monto */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <DollarSign className="h-4 w-4 inline mr-1" />
                Monto
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
                required
              />
            </div>

            {/* Términos */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Términos de Pago
              </label>
              <select
                value={formData.terms}
                onChange={(e) => handleTermsChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="15 días">15 días</option>
                <option value="30 días">30 días</option>
                <option value="45 días">45 días</option>
                <option value="60 días">60 días</option>
                <option value="contra entrega">Contra entrega</option>
              </select>
            </div>

            {/* Fecha de Vencimiento */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="h-4 w-4 inline mr-1" />
                Fecha de Vencimiento
              </label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FileText className="h-4 w-4 inline mr-1" />
              Descripción
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Descripción del crédito..."
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creando...' : 'Crear Crédito'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
