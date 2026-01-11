import React from 'react';

interface ChartData {
  label: string;
  value: number;
  color?: string;
}

interface ChartWidgetProps {
  title: string;
  data: ChartData[];
  type: 'bar' | 'line' | 'progress';
  height?: string;
  showValues?: boolean;
  maxValue?: number;
}

const ChartWidget: React.FC<ChartWidgetProps> = ({
  title,
  data,
  type,
  height = 'h-64',
  showValues = true,
  maxValue
}) => {
  const maxDataValue = maxValue || Math.max(...data.map(d => d.value));

  const renderBarChart = () => (
    <div className="space-y-3">
      {data.map((item, index) => (
        <div key={index} className="flex items-center justify-between">
          <span className="text-sm text-gray-600 w-16 truncate">{item.label}</span>
          <div className="flex-1 mx-4">
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all duration-300 ${
                  item.color || 'bg-blue-500'
                }`}
                style={{ width: `${Math.min((item.value / maxDataValue) * 100, 100)}%` }}
              ></div>
            </div>
          </div>
          {showValues && (
            <span className="text-sm font-medium text-gray-900 w-16 text-right">
              {item.value}
            </span>
          )}
        </div>
      ))}
    </div>
  );

  const renderLineChart = () => (
    <div className="relative">
      <div className="flex items-end justify-between h-32">
        {data.map((item, index) => (
          <div key={index} className="flex flex-col items-center flex-1">
            <div
              className={`w-2 ${item.color || 'bg-blue-500'} rounded-t transition-all duration-300`}
              style={{ height: `${(item.value / maxDataValue) * 100}%` }}
            ></div>
            <span className="text-xs text-gray-600 mt-2">{item.label}</span>
            {showValues && (
              <span className="text-xs font-medium text-gray-900">{item.value}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const renderProgressChart = () => (
    <div className="space-y-2">
      {data.map((item, index) => (
        <div key={index} className="flex items-center justify-between">
          <span className="text-sm text-gray-600">{item.label}</span>
          <div className="flex items-center space-x-2 flex-1 ml-4">
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div
                className={`${item.color || 'bg-green-500'} h-2 rounded-full`}
                style={{ width: `${Math.min((item.value / maxDataValue) * 100, 100)}%` }}
              ></div>
            </div>
            {showValues && (
              <span className="text-sm font-medium ml-2">{item.value}</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );

  const renderChart = () => {
    switch (type) {
      case 'bar':
        return renderBarChart();
      case 'line':
        return renderLineChart();
      case 'progress':
        return renderProgressChart();
      default:
        return renderBarChart();
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h4 className="text-lg font-semibold text-gray-900 mb-4">{title}</h4>
      <div className={height}>
        {renderChart()}
      </div>
    </div>
  );
};

export default ChartWidget;
