import React, {useState} from 'react';
import {Download, Eye, Loader, Printer} from 'lucide-react';
import {printService, TicketData} from '../lib/printService';

interface PrintButtonProps {
  data: TicketData;
  type: 'thermal' | 'letter';
  filename?: string;
  className?: string;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  showOptions?: boolean;
}

const PrintButton: React.FC<PrintButtonProps> = ({
  data,
  type,
  filename,
  className = '',
  variant = 'primary',
  size = 'md',
  disabled = false,
  showOptions = true
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const generateFilename = () => {
    if (filename) return filename;
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    return `${data.type}_${data.folio}_${timestamp}.pdf`;
  };

  const handlePrint = async () => {
    setIsLoading(true);
    try {
      const doc = type === 'thermal'
        ? printService.generateThermalTicket(data)
        : printService.generateLetterReceipt(data);

      printService.printPDF(doc);
    } catch (error) {
      console.error('Error generating print:', error);
      alert('Error al generar el documento para impresión');
    } finally {
      setIsLoading(false);
      setShowDropdown(false);
    }
  };

  const handleDownload = async () => {
    setIsLoading(true);
    try {
      const doc = type === 'thermal'
        ? printService.generateThermalTicket(data)
        : printService.generateLetterReceipt(data);

      const fileName = generateFilename();
      printService.downloadPDF(doc, fileName);
    } catch (error) {
      console.error('Error generating download:', error);
      alert('Error al generar el documento para descarga');
    } finally {
      setIsLoading(false);
      setShowDropdown(false);
    }
  };

  const handlePreview = async () => {
    setIsLoading(true);
    try {
      const doc = type === 'thermal'
        ? printService.generateThermalTicket(data)
        : printService.generateLetterReceipt(data);

      // Open in new tab for preview
      const pdfBlob = doc.output('blob');
      const url = URL.createObjectURL(pdfBlob);
      window.open(url, '_blank');
    } catch (error) {
      console.error('Error generating preview:', error);
      alert('Error al generar la vista previa');
    } finally {
      setIsLoading(false);
      setShowDropdown(false);
    }
  };

  const getButtonClasses = () => {
    const baseClasses = 'inline-flex items-center justify-center font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

    const sizeClasses = {
      sm: 'px-2 py-1 text-xs',
      md: 'px-3 py-2 text-sm',
      lg: 'px-4 py-2 text-base'
    };

    const variantClasses = {
      primary: 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500',
      secondary: 'bg-gray-600 hover:bg-gray-700 text-white focus:ring-gray-500',
      outline: 'border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 focus:ring-blue-500'
    };

    return `${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`;
  };

  const getIconSize = () => {
    return size === 'sm' ? 'h-3 w-3' : size === 'md' ? 'h-4 w-4' : 'h-5 w-5';
  };

  if (!showOptions) {
    return (
      <button
        onClick={handlePrint}
        disabled={disabled || isLoading}
        className={getButtonClasses()}
        title={`Imprimir ${type === 'thermal' ? 'ticket térmico' : 'recibo carta'}`}
      >
        {isLoading ? (
          <Loader className={`${getIconSize()} animate-spin mr-1`} />
        ) : (
          <Printer className={`${getIconSize()} mr-1`} />
        )}
        {size !== 'sm' && 'Imprimir'}
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        disabled={disabled || isLoading}
        className={getButtonClasses()}
        title="Opciones de impresión"
      >
        {isLoading ? (
          <Loader className={`${getIconSize()} animate-spin mr-1`} />
        ) : (
          <Printer className={`${getIconSize()} mr-1`} />
        )}
        {size !== 'sm' && 'Imprimir'}
        {!isLoading && (
          <svg
            className={`${getIconSize()} ml-1 transition-transform ${showDropdown ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </button>

      {showDropdown && (
        <>
          {/* Overlay para cerrar dropdown al hacer click fuera */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowDropdown(false)}
          />

          {/* Dropdown menu */}
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-20 border border-gray-200">
            <div className="py-1">
              <button
                onClick={handlePrint}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
              >
                <Printer className="h-4 w-4 mr-3" />
                Imprimir directamente
              </button>

              <button
                onClick={handleDownload}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
              >
                <Download className="h-4 w-4 mr-3" />
                Descargar PDF
              </button>

              <button
                onClick={handlePreview}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
              >
                <Eye className="h-4 w-4 mr-3" />
                Vista previa
              </button>
            </div>

            <div className="border-t border-gray-100">
              <div className="px-4 py-2 text-xs text-gray-500 bg-gray-50">
                Formato: {type === 'thermal' ? '58mm térmico' : 'Carta A4'}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default PrintButton;
