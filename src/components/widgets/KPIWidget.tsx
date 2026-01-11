import React from 'react';
import {LucideIcon} from 'lucide-react';

interface KPIWidgetProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  color: 'green' | 'red' | 'blue' | 'purple' | 'orange' | 'yellow';
  trend?: {
    value: number;
    label: string;
    direction: 'up' | 'down';
  };
}

const KPIWidget: React.FC<KPIWidgetProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
  trend
}) => {
  const colorClasses = {
    green: {
      border: 'border-l-4 border-green-500',
      icon: 'text-green-500',
      value: 'text-green-600'
    },
    red: {
      border: 'border-l-4 border-red-500',
      icon: 'text-red-500',
      value: 'text-red-600'
    },
    blue: {
      border: 'border-l-4 border-blue-500',
      icon: 'text-blue-500',
      value: 'text-blue-600'
    },
    purple: {
      border: 'border-l-4 border-purple-500',
      icon: 'text-purple-500',
      value: 'text-purple-600'
    },
    orange: {
      border: 'border-l-4 border-orange-500',
      icon: 'text-orange-500',
      value: 'text-orange-600'
    },
    yellow: {
      border: 'border-l-4 border-yellow-500',
      icon: 'text-yellow-500',
      value: 'text-yellow-600'
    }
  };

  const classes = colorClasses[color];

  return (
    <div className={`bg-white p-6 rounded-lg shadow-md ${classes.border}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className={`text-2xl font-bold ${classes.value}`}>{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
          )}
          {trend && (
            <p className="text-xs text-gray-500 mt-1">
              <span className={`inline-flex items-center ${
                trend.direction === 'up' ? 'text-green-600' : 'text-red-600'
              }`}>
                {trend.direction === 'up' ? '↗' : '↘'} {trend.value}% {trend.label}
              </span>
            </p>
          )}
        </div>
        <Icon className={`h-8 w-8 ${classes.icon}`} />
      </div>
    </div>
  );
};

export default KPIWidget;
