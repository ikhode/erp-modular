import React from 'react';
import {Activity, Brain, Cpu, Database, Edit3, RefreshCw, Save} from 'lucide-react';
import {MLStats} from '../lib/mlService';

interface DashboardHeaderProps {
    mlInitialized: boolean;
    mlStats: MLStats | null;
    lastUpdate: Date;
    loading: boolean;
    isEditMode: boolean;
    activeSection: 'overview' | 'predictions' | 'optimization' | 'monitoring';
    loadDashboardData: () => void;
    setIsEditMode: (edit: boolean) => void;
    saveDashboardConfig: () => void;
    setActiveSection: (section: 'overview' | 'predictions' | 'optimization' | 'monitoring') => void;
}

const sections: Array<{ id: 'overview' | 'predictions' | 'optimization' | 'monitoring'; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { id: 'overview', label: 'Vista General', icon: Activity },
    { id: 'predictions', label: 'Predicciones', icon: Brain },
    { id: 'optimization', label: 'Optimización', icon: Database },
    { id: 'monitoring', label: 'Monitoreo', icon: Cpu }
];

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
    mlInitialized,
    mlStats,
    lastUpdate,
    loading,
    isEditMode,
    activeSection,
    loadDashboardData,
    setIsEditMode,
    saveDashboardConfig,
    setActiveSection
}) => {
    return (
        <div className="bg-white shadow-xl border-b border-gray-200 sticky top-0 z-50">
            <div className="max-w-full mx-auto px-6 lg:px-8 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-6">
                        <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 p-4 rounded-2xl shadow-lg">
                            <Brain className="h-10 w-10 text-white" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
                                Dashboard Ejecutivo IA
                            </h1>
                            <p className="text-lg text-gray-600 mt-1 font-medium">
                                Inteligencia Artificial Avanzada para Gestión Empresarial
                            </p>
                            <div className="flex items-center space-x-6 mt-3 text-sm">
                                <div className="flex items-center space-x-2">
                                    <div className={`w-3 h-3 rounded-full ${mlInitialized ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                                    <span className={`font-medium ${mlInitialized ? 'text-green-700' : 'text-red-700'}`}>
                                        IA: {mlInitialized ? 'Activa' : 'Inactiva'}
                                    </span>
                                </div>
                                <div className="flex items-center space-x-2 text-gray-600">
                                    <Cpu className="h-4 w-4" />
                                    <span>Backend: {mlStats?.backend || 'Desconocido'}</span>
                                </div>
                                <div className="flex items-center space-x-2 text-gray-600">
                                    <Database className="h-4 w-4" />
                                    <span>Modelos: {mlStats?.modelsLoaded || 0}</span>
                                </div>
                                <div className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                                    Última actualización: {lastUpdate.toLocaleTimeString('es-MX')}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={loadDashboardData}
                                disabled={loading}
                                className="flex items-center space-x-2 px-4 py-2 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                                <span className="text-sm font-medium">Actualizar</span>
                            </button>

                            <button
                                onClick={() => setIsEditMode(!isEditMode)}
                                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                                    isEditMode
                                        ? 'bg-purple-600 text-white hover:bg-purple-700'
                                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                                }`}
                            >
                                <Edit3 className="h-4 w-4" />
                                <span className="text-sm font-medium">
                                    {isEditMode ? 'Modo Edición' : 'Personalizar'}
                                </span>
                            </button>

                            {isEditMode && (
                                <button
                                    onClick={saveDashboardConfig}
                                    className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                                >
                                    <Save className="h-4 w-4" />
                                    <span className="text-sm font-medium">Guardar</span>
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                <div className="mt-6 flex space-x-2 bg-gray-100 p-2 rounded-2xl">
                    {sections.map((section) => {
                        const Icon = section.icon;
                        return (
                            <button
                                key={section.id}
                                onClick={() => setActiveSection(section.id)}
                                className={`flex-1 flex items-center justify-center space-x-3 py-3 px-6 rounded-xl text-sm font-semibold transition-all duration-300 ${
                                    activeSection === section.id
                                        ? 'bg-white text-purple-600 shadow-lg transform scale-105'
                                        : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                                }`}
                            >
                                <Icon className="h-5 w-5" />
                                <span>{section.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
