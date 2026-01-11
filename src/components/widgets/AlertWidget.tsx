import React from 'react';
import {LucideIcon} from 'lucide-react';

interface AlertWidgetProps {
  title: string;
  message: string;
  icon: LucideIcon;
  type: 'info' | 'warning' | 'error' | 'success';
  action?: {
    label: string;
    onClick: () => void;
  };
}

const AlertWidget: React.FC<AlertWidgetProps> = ({
  title,
  message,
  icon: Icon,
  type,
  action
}) => {
  const typeClasses = {
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      icon: 'text-blue-600',
      title: 'text-blue-800',
      message: 'text-blue-700'
    },
    warning: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      icon: 'text-yellow-600',
      title: 'text-yellow-800',
      message: 'text-yellow-700'
    },
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      icon: 'text-red-600',
      title: 'text-red-800',
      message: 'text-red-700'
    },
    success: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      icon: 'text-green-600',
      title: 'text-green-800',
      message: 'text-green-700'
    }
  };

  const classes = typeClasses[type];

  return (
    <div className={`flex items-center p-3 ${classes.bg} border ${classes.border} rounded-lg`}>
      <Icon className={`h-5 w-5 ${classes.icon} mr-3 flex-shrink-0`} />
      <div className="flex-1">
        <p className={`font-medium ${classes.title}`}>{title}</p>
        <p className={`text-sm ${classes.message}`}>{message}</p>
      </div>
      {action && (
        <button
          onClick={action.onClick}
          className="ml-3 px-3 py-1 text-sm font-medium text-blue-600 hover:text-blue-500 hover:bg-blue-100 rounded-md transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
};

export default AlertWidget;
