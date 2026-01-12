import React from 'react';
import {Eye, EyeOff} from 'lucide-react';

interface DashboardWidget {
    id: string;
    title: string;
    component: React.ComponentType<unknown>;
    visible: boolean;
    size: 'small' | 'medium' | 'large' | 'full';
    position: { x: number; y: number };
    category: 'stats' | 'predictions' | 'optimization' | 'monitoring' | 'management' | 'ai';
}

interface DashboardWidgetsProps {
    widgets: DashboardWidget[];
    isEditMode: boolean;
    toggleWidgetVisibility: (widgetId: string) => void;
    changeWidgetSize: (widgetId: string, size: 'small' | 'medium' | 'large' | 'full') => void;
}

const getWidgetSizeClasses = (size: string) => {
    switch (size) {
        case 'small': return 'col-span-1';
        case 'medium': return 'col-span-1 xl:col-span-1 2xl:col-span-1';
        case 'large': return 'col-span-1 xl:col-span-2 2xl:col-span-2';
        case 'full': return 'col-span-1 xl:col-span-2 2xl:col-span-3';
        default: return 'col-span-1';
    }
};

export const DashboardWidgets: React.FC<DashboardWidgetsProps> = ({
    widgets,
    isEditMode,
    toggleWidgetVisibility,
    changeWidgetSize
}) => {
    const visibleWidgets = widgets.filter(w => w.visible);

    return (
        <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-8">
            {visibleWidgets.map((widget) => {
                const Component = widget.component;
                return (
                    <div key={widget.id} className={`relative ${getWidgetSizeClasses(widget.size)}`}>
                        {isEditMode && (
                            <div className="absolute -top-3 -right-3 z-10 bg-white rounded-lg shadow-lg border border-gray-200 p-2 flex items-center space-x-1">
                                <button
                                    onClick={() => toggleWidgetVisibility(widget.id)}
                                    className={`p-1 rounded ${widget.visible ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-50'}`}
                                >
                                    {widget.visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                                </button>
                                <div className="w-px h-4 bg-gray-300"></div>
                                <button
                                    onClick={() => changeWidgetSize(widget.id, 'small')}
                                    className={`px-2 py-1 text-xs rounded ${widget.size === 'small' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                                >
                                    S
                                </button>
                                <button
                                    onClick={() => changeWidgetSize(widget.id, 'medium')}
                                    className={`px-2 py-1 text-xs rounded ${widget.size === 'medium' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                                >
                                    M
                                </button>
                                <button
                                    onClick={() => changeWidgetSize(widget.id, 'large')}
                                    className={`px-2 py-1 text-xs rounded ${widget.size === 'large' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                                >
                                    L
                                </button>
                                <button
                                    onClick={() => changeWidgetSize(widget.id, 'full')}
                                    className={`px-2 py-1 text-xs rounded ${widget.size === 'full' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                                >
                                    XL
                                </button>
                            </div>
                        )}
                        <div className={`bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden ${
                            isEditMode ? 'ring-2 ring-blue-200 ring-opacity-50' : ''
                        }`}>
                            <Component />
                        </div>
                    </div>
                );
            })}
        </div>
    );
};
