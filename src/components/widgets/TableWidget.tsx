import React from 'react';
import {Download} from 'lucide-react';

interface TableColumn {
  key: string;
  header: string;
  render?: (value: any, row: any) => React.ReactNode;
  className?: string;
}

interface TableWidgetProps {
  title: string;
  columns: TableColumn[];
  data: any[];
  maxRows?: number;
  exportable?: boolean;
  exportFilename?: string;
  onExport?: (data: any[], filename: string) => void;
}

const TableWidget: React.FC<TableWidgetProps> = ({
  title,
  columns,
  data,
  maxRows = 10,
  exportable = false,
  exportFilename = 'export',
  onExport
}) => {
  const displayData = data.slice(0, maxRows);

  const handleExport = () => {
    if (onExport) {
      onExport(data, exportFilename);
    }
  };

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-md">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-semibold text-gray-900">{title}</h4>
          {exportable && (
            <button
              onClick={handleExport}
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </button>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${column.className || ''}`}
                  >
                    {column.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {displayData.map((row, index) => (
                <tr key={index}>
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={`px-6 py-4 whitespace-nowrap text-sm text-gray-900 ${column.className || ''}`}
                    >
                      {column.render
                        ? column.render(row[column.key], row)
                        : row[column.key]
                      }
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {data.length > maxRows && (
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-500">
              Mostrando {maxRows} de {data.length} registros
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TableWidget;
