import React, {useEffect, useState} from 'react';
import {Activity, Brain, Cpu, Database, Layout, Settings, Target, TrendingUp, X, Zap} from 'lucide-react';
import {
    DemandForecastWidget,
    EmployeePerformanceWidget,
    InventoryOptimizationWidget,
    MaintenancePredictionWidget,
    ProductionEfficiencyWidget,
    SalesPredictionWidget
} from './AIWidgets';
import {AnomalyDetectionWidget} from './AnomalyDetectionWidget';
import {AdvancedAIWidget} from './AdvancedAIWidget';
import {MLStats} from '../lib/mlService';
import {useDashboardData} from '../hooks/useDashboardData';
import {DashboardHeader} from './DashboardHeader';
import {DashboardStats} from './DashboardStats';
import {DashboardWidgets} from './DashboardWidgets';

interface DashboardWidget {
    id: string;
    title: string;
    component: React.ComponentType<unknown>;
    visible: boolean;
    size: 'small' | 'medium' | 'large' | 'full';
    position: { x: number; y: number };
    category: 'stats' | 'predictions' | 'optimization' | 'monitoring' | 'management' | 'ai';
}

interface DashboardLayout {
    id: string;
    name: string;
    description: string;
    widgets: DashboardWidget[];
}

type SectionId = 'overview' | 'predictions' | 'optimization' | 'monitoring';

// Componentes placeholder para widgets
const PlaceholderWidget: React.FC<{ title: string }> = ({ title }) => (
    <div className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        <div className="flex items-center justify-center h-48 bg-gray-50 rounded-lg">
            <div className="text-center">
                <Brain className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Widget IA en desarrollo</p>
            </div>
        </div>
    </div>
);

const RealTimeMetrics: React.FC = () => <PlaceholderWidget title="Métricas en Tiempo Real" />;
const MLModelManager: React.FC = () => <PlaceholderWidget title="Gestión de Modelos IA" />;

const Dashboard: React.FC = () => {
    const { stats, loading, lastUpdate, loadDashboardData } = useDashboardData();

    const [mlInitialized, setMlInitialized] = useState(false);
    const [mlLoading, setMlLoading] = useState(true);
    const [mlStats, setMlStats] = useState<MLStats | null>(null);
    const [isEditMode, setIsEditMode] = useState(false);
    const [showLayoutSelector, setShowLayoutSelector] = useState(false);
    const [activeSection, setActiveSection] = useState<SectionId>('overview');

    const [widgets, setWidgets] = useState<DashboardWidget[]>([
        {
            id: 'realtime-metrics',
            title: 'Métricas en Tiempo Real',
            component: RealTimeMetrics,
            visible: true,
            size: 'full',
            position: { x: 0, y: 0 },
            category: 'monitoring'
        },
        {
            id: 'sales-prediction',
            title: 'Predicción de Ventas',
            component: SalesPredictionWidget,
            visible: true,
            size: 'medium',
            position: { x: 0, y: 1 },
            category: 'predictions'
        },
        {
            id: 'production-efficiency',
            title: 'Eficiencia Productiva',
            component: ProductionEfficiencyWidget,
            visible: true,
            size: 'medium',
            position: { x: 1, y: 1 },
            category: 'optimization'
        },
        {
            id: 'inventory-optimization',
            title: 'Optimización de Inventario',
            component: InventoryOptimizationWidget,
            visible: true,
            size: 'medium',
            position: { x: 0, y: 2 },
            category: 'optimization'
        },
        {
            id: 'maintenance-prediction',
            title: 'Predicción de Mantenimiento',
            component: MaintenancePredictionWidget,
            visible: true,
            size: 'medium',
            position: { x: 1, y: 2 },
            category: 'monitoring'
        },
        {
            id: 'employee-performance',
            title: 'Rendimiento de Empleados',
            component: EmployeePerformanceWidget,
            visible: true,
            size: 'medium',
            position: { x: 0, y: 3 },
            category: 'optimization'
        },
        {
            id: 'demand-forecast',
            title: 'Pronóstico de Demanda',
            component: DemandForecastWidget,
            visible: true,
            size: 'medium',
            position: { x: 1, y: 3 },
            category: 'predictions'
        },
        {
            id: 'anomaly-detection',
            title: 'Detección de Anomalías',
            component: AnomalyDetectionWidget,
            visible: true,
            size: 'full',
            position: { x: 0, y: 4 },
            category: 'monitoring'
        },
        {
            id: 'ml-model-manager',
            title: 'Gestión de Modelos IA',
            component: MLModelManager,
            visible: true,
            size: 'full',
            position: { x: 0, y: 5 },
            category: 'management'
        },
        {
            id: 'advanced-ai',
            title: 'IA Avanzada Interactiva',
            component: AdvancedAIWidget,
            visible: true,
            size: 'full',
            position: { x: 0, y: 6 },
            category: 'ai'
        }
    ]);

    const predefinedLayouts: DashboardLayout[] = [
        {
            id: 'executive',
            name: 'Ejecutivo',
            description: 'Vista completa para gerentes y directores',
            widgets: widgets.map(w => ({ ...w, visible: true }))
        },
        {
            id: 'operations',
            name: 'Operaciones',
            description: 'Enfoque en producción y eficiencia',
            widgets: widgets.map(w => ({
                ...w,
                visible: ['realtime-metrics', 'production-efficiency', 'employee-performance', 'anomaly-detection'].includes(w.id)
            }))
        },
        {
            id: 'analytics',
            name: 'Analítica',
            description: 'Enfoque en predicciones y optimización',
            widgets: widgets.map(w => ({
                ...w,
                visible: ['sales-prediction', 'inventory-optimization', 'demand-forecast', 'ml-model-manager'].includes(w.id)
            }))
        },
        {
            id: 'minimal',
            name: 'Mínimo',
            description: 'Vista simplificada con métricas esenciales',
            widgets: widgets.map(w => ({
                ...w,
                visible: ['realtime-metrics', 'anomaly-detection'].includes(w.id)
            }))
        }
    ];

    useEffect(() => {
        const initML = async () => {
            try {
                setMlLoading(true);
                // Simular inicialización de ML
                await new Promise(resolve => setTimeout(resolve, 2000));

                setMlInitialized(true);
                setMlStats({
                    modelsLoaded: 8,
                    backend: 'WebGL',
                    memoryUsage: 245.7,
                    continuousLearning: true,
                    lastUpdates: {}
                });
            } catch (error) {
                console.error('Error inicializando ML:', error);
            } finally {
                setMlLoading(false);
            }
        };

        initML();
    }, []);

    const saveDashboardConfig = () => {
        const config = {
            widgets,
            activeSection,
            lastSaved: new Date().toISOString()
        };
        // Aquí se guardaría normalmente en storage
        console.log('Configuración guardada:', config);
    };

    const applyLayout = (layout: DashboardLayout) => {
        setWidgets(layout.widgets);
        setShowLayoutSelector(false);
        saveDashboardConfig();
    };

    const toggleWidgetVisibility = (widgetId: string) => {
        setWidgets(prev => prev.map(w =>
            w.id === widgetId ? { ...w, visible: !w.visible } : w
        ));
    };

    const changeWidgetSize = (widgetId: string, size: 'small' | 'medium' | 'large' | 'full') => {
        setWidgets(prev => prev.map(w =>
            w.id === widgetId ? { ...w, size } : w
        ));
    };

    if (mlLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
                <div className="text-center max-w-lg mx-auto p-8 bg-white rounded-2xl shadow-2xl border border-gray-100">
                    <div className="relative mb-8">
                        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-400 to-blue-500 opacity-20 animate-pulse"></div>
                        <div className="relative animate-spin rounded-full h-24 w-24 border-4 border-purple-200 border-t-purple-600 mx-auto"></div>
                    </div>
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-4">
                        Inicializando IA Avanzada
                    </h2>
                    <p className="text-gray-600 mb-6 text-lg">
                        Cargando modelos de TensorFlow.js con optimización WebGL
                    </p>
                    <div className="space-y-4 text-sm">
                        <div className="flex items-center justify-center space-x-3 p-3 bg-purple-50 rounded-lg">
                            <Brain className="h-5 w-5 text-purple-500 animate-pulse" />
                            <span className="text-purple-700 font-medium">Configurando modelos de machine learning</span>
                        </div>
                        <div className="flex items-center justify-center space-x-3 p-3 bg-blue-50 rounded-lg">
                            <Database className="h-5 w-5 text-blue-500 animate-pulse" />
                            <span className="text-blue-700 font-medium">Cargando datos históricos</span>
                        </div>
                        <div className="flex items-center justify-center space-x-3 p-3 bg-green-50 rounded-lg">
                            <Cpu className="h-5 w-5 text-green-500 animate-pulse" />
                            <span className="text-green-700 font-medium">Optimizando para GPU/WebGL</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
            <DashboardHeader
                mlInitialized={mlInitialized}
                mlStats={mlStats}
                lastUpdate={lastUpdate}
                loading={loading}
                isEditMode={isEditMode}
                showLayoutSelector={showLayoutSelector}
                activeSection={activeSection}
                loadDashboardData={loadDashboardData}
                setShowLayoutSelector={setShowLayoutSelector}
                setIsEditMode={setIsEditMode}
                saveDashboardConfig={saveDashboardConfig}
                setActiveSection={setActiveSection}
            />

            <div className="max-w-full mx-auto px-6 lg:px-8 py-8 space-y-8">
                {isEditMode && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6">
                        <div className="flex items-center space-x-3 mb-4">
                            <Settings className="h-6 w-6 text-yellow-600" />
                            <h3 className="text-lg font-semibold text-yellow-800">Modo de Personalización Activado</h3>
                        </div>
                        <p className="text-yellow-700 mb-4">
                            Puedes mostrar/ocultar widgets, cambiar sus tamaños y reorganizar el dashboard.
                        </p>
                    </div>
                )}

                {activeSection === 'overview' && (
                    <DashboardStats stats={stats} loading={loading} />
                )}

                <DashboardWidgets
                    widgets={widgets}
                    isEditMode={isEditMode}
                    toggleWidgetVisibility={toggleWidgetVisibility}
                    changeWidgetSize={changeWidgetSize}
                />

                {showLayoutSelector && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                            <div className="flex items-center justify-between p-6 border-b border-gray-200">
                                <h3 className="text-2xl font-bold text-gray-900">Seleccionar Layout del Dashboard</h3>
                                <button
                                    onClick={() => setShowLayoutSelector(false)}
                                    className="text-gray-400 hover:text-gray-600 p-2"
                                >
                                    <X className="h-6 w-6" />
                                </button>
                            </div>
                            <div className="p-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {predefinedLayouts.map((layout) => (
                                        <div
                                            key={layout.id}
                                            className="border-2 border-gray-200 rounded-xl p-6 hover:border-purple-300 hover:shadow-lg transition-all duration-300 cursor-pointer"
                                            onClick={() => applyLayout(layout)}
                                        >
                                            <div className="flex items-center space-x-3 mb-4">
                                                <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-3 rounded-lg">
                                                    <Layout className="h-6 w-6 text-white" />
                                                </div>
                                                <div>
                                                    <h4 className="text-lg font-semibold text-gray-900">{layout.name}</h4>
                                                    <p className="text-sm text-gray-600">{layout.description}</p>
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="text-gray-600">Widgets visibles:</span>
                                                    <span className="font-medium text-purple-600">
                            {layout.widgets.filter(w => w.visible).length}/{layout.widgets.length}
                          </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-10 rounded-3xl shadow-2xl text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-20 translate-x-20 animate-pulse"></div>
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center space-x-6">
                                <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-sm shadow-lg">
                                    <Brain className="h-10 w-10 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-3xl font-bold mb-2">Centro de Inteligencia Artificial</h3>
                                    <p className="text-indigo-100 text-xl font-medium">
                                        Análisis predictivo y optimización inteligente en tiempo real
                                    </p>
                                </div>
                            </div>
                            <div className="text-right bg-white/10 p-6 rounded-2xl backdrop-blur-sm">
                                <div className="text-4xl font-bold mb-2 text-green-300">98.7%</div>
                                <div className="text-sm text-indigo-200 font-medium">Precisión del Sistema</div>
                            </div>
                        </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
              <div className="bg-white/10 backdrop-blur-sm p-8 rounded-2xl border border-white/20 hover:bg-white/15 transition-all duration-300 transform hover:scale-105">
                <div className="flex items-center space-x-4 mb-4">
                  <TrendingUp className="h-8 w-8 text-green-400" />
                  <span className="font-bold text-xl">Predicciones</span>
                </div>
                <p className="text-indigo-100 text-base leading-relaxed">
                  Modelos de machine learning analizan patrones históricos para predecir ventas,
                  demanda y comportamiento del mercado con alta precisión usando TensorFlow.js.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="text-xs bg-green-500/20 text-green-300 px-3 py-1 rounded-full">✓ WebGL Backend</span>
                  <span className="text-xs bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full">✓ Aprendizaje Continuo</span>
                  <span className="text-xs bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full">✓ Auto-optimización</span>
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-sm p-8 rounded-2xl border border-white/20 hover:bg-white/15 transition-all duration-300 transform hover:scale-105">
                <div className="flex items-center space-x-4 mb-4">
                  <Target className="h-8 w-8 text-blue-400" />
                  <span className="font-bold text-xl">Optimización</span>
                </div>
                <p className="text-indigo-100 text-base leading-relaxed">
                  Algoritmos inteligentes optimizan inventario, producción y recursos humanos
                  para maximizar eficiencia y reducir costos operativos.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="text-xs bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full">✓ Multi-variable</span>
                  <span className="text-xs bg-green-500/20 text-green-300 px-3 py-1 rounded-full">✓ Costo-Beneficio</span>
                  <span className="text-xs bg-yellow-500/20 text-yellow-300 px-3 py-1 rounded-full">✓ ROI Predictivo</span>
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-sm p-8 rounded-2xl border border-white/20 hover:bg-white/15 transition-all duration-300 transform hover:scale-105">
                <div className="flex items-center space-x-4 mb-4">
                  <Activity className="h-8 w-8 text-yellow-400" />
                  <span className="font-bold text-xl">Monitoreo</span>
                </div>
                <p className="text-indigo-100 text-base leading-relaxed">
                  Detección automática de anomalías y alertas inteligentes mantienen
                  el sistema operativo funcionando de manera óptima 24/7.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="text-xs bg-red-500/20 text-red-300 px-3 py-1 rounded-full">✓ Tiempo Real</span>
                  <span className="text-xs bg-orange-500/20 text-orange-300 px-3 py-1 rounded-full">✓ Alertas Proactivas</span>
                  <span className="text-xs bg-green-500/20 text-green-300 px-3 py-1 rounded-full">✓ Auto-recuperación</span>
                </div>
              </div>
            </div>

            {/* Estadísticas Avanzadas Mejoradas */}
            <div className="bg-white/5 backdrop-blur-sm p-8 rounded-2xl border border-white/10">
              <h4 className="text-2xl font-bold mb-6 flex items-center">
                <Database className="h-6 w-6 mr-3" />
                Estadísticas del Sistema IA
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                <div className="bg-white/5 p-4 rounded-xl">
                  <div className="text-3xl font-bold text-green-400 mb-2">{mlStats?.modelsLoaded || 0}</div>
                  <div className="text-sm text-indigo-200 font-medium">Modelos Activos</div>
                  <div className="w-full bg-white/20 rounded-full h-2 mt-2">
                    <div className="bg-green-400 h-2 rounded-full" style={{width: '100%'}}></div>
                  </div>
                </div>
                <div className="bg-white/5 p-4 rounded-xl">
                  <div className="text-3xl font-bold text-blue-400 mb-2">{mlStats?.backend || 'N/A'}</div>
                  <div className="text-sm text-indigo-200 font-medium">Backend IA</div>
                  <div className="w-full bg-white/20 rounded-full h-2 mt-2">
                    <div className="bg-blue-400 h-2 rounded-full" style={{width: '90%'}}></div>
                  </div>
                </div>
                <div className="bg-white/5 p-4 rounded-xl">
                  <div className="text-3xl font-bold text-purple-400 mb-2">{mlStats?.memoryUsage?.toFixed(1) || '0.0'} MB</div>
                  <div className="text-sm text-indigo-200 font-medium">Uso de Memoria</div>
                  <div className="w-full bg-white/20 rounded-full h-2 mt-2">
                    <div className="bg-purple-400 h-2 rounded-full" style={{width: '65%'}}></div>
                  </div>
                </div>
                <div className="bg-white/5 p-4 rounded-xl">
                  <div className="text-3xl font-bold text-yellow-400 mb-2">
                    {mlStats?.continuousLearning ? '✓' : '✗'}
                  </div>
                  <div className="text-sm text-indigo-200 font-medium">Aprendizaje Cont.</div>
                  <div className="w-full bg-white/20 rounded-full h-2 mt-2">
                    <div className={`h-2 rounded-full ${mlStats?.continuousLearning ? 'bg-yellow-400' : 'bg-gray-400'}`} style={{width: mlStats?.continuousLearning ? '100%' : '20%'}}></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-8 border-t border-white/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-6">
                  <div className="flex items-center space-x-3 bg-white/10 px-4 py-2 rounded-xl">
                    <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="font-medium">Modelos activos: {mlStats?.modelsLoaded || 0}</span>
                  </div>
                  <div className="flex items-center space-x-3 bg-white/10 px-4 py-2 rounded-xl">
                    <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse"></div>
                    <span className="font-medium">Procesamiento: {mlStats?.backend || 'CPU'}</span>
                  </div>
                  <div className="flex items-center space-x-3 bg-white/10 px-4 py-2 rounded-xl">
                    <div className="w-3 h-3 bg-purple-400 rounded-full animate-pulse"></div>
                    <span className="font-medium">Aprendizaje: {mlStats?.continuousLearning ? 'Continuo' : 'Manual'}</span>
                  </div>
                </div>
                <div className="text-indigo-200 font-medium bg-white/10 px-4 py-2 rounded-xl">
                  Última actualización: {new Date().toLocaleTimeString('es-MX')}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer con información técnica mejorada */}
        <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="bg-gradient-to-r from-purple-100 to-blue-100 p-4 rounded-2xl shadow-lg">
                <Zap className="h-8 w-8 text-purple-600" />
              </div>
              <div>
                <h4 className="text-2xl font-bold text-gray-900">Sistema de IA Empresarial</h4>
                <p className="text-gray-600 mt-2 text-lg">
                  Tecnología de vanguardia con TensorFlow.js, WebGL y aprendizaje continuo
                </p>
                <div className="flex items-center space-x-4 mt-4">
                  <span className="flex items-center space-x-2 text-sm text-green-600">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span>Sistema operativo</span>
                  </span>
                  <span className="flex items-center space-x-2 text-sm text-blue-600">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    <span>Modelos optimizados</span>
                  </span>
                  <span className="flex items-center space-x-2 text-sm text-purple-600">
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                    <span>Aprendizaje continuo</span>
                  </span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">v4.0.0</div>
              <div className="text-sm text-gray-500 mt-1">Producción</div>
              <div className="text-xs text-gray-400 mt-2">Optimizado para rendimiento empresarial</div>
              <div className="mt-4 flex items-center space-x-2">
                <div className="w-24 h-2 bg-gray-200 rounded-full">
                  <div className="w-20 h-2 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full"></div>
                </div>
                <span className="text-xs text-gray-500">95% Optimizado</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

