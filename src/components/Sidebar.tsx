import React from 'react';
import {
    Building2,
    Clock,
    Cog,
    DollarSign,
    Factory,
    FileText,
    Home,
    Layers,
    LogOut,
    MapPin,
    Monitor,
    Package,
    Search,
    Settings,
    ShoppingBag,
    ShoppingCart,
    Users
} from 'lucide-react';

interface SidebarProps {
  activeModule: string;
  setActiveModule: (module: string) => void;
  userRole: string;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeModule, setActiveModule, userRole, onLogout }) => {
  const getMenuItems = () => {
    const baseItems = [
      { id: 'dashboard', label: 'Dashboard', icon: Home, roles: ['owner', 'admin', 'supervisor', 'cashier'] },
    ];

    const configItems = [
      { id: 'configuration', label: 'Configuración', icon: Settings, roles: ['owner', 'admin'] },
      { id: 'location-types', label: 'Tipos de Lugar', icon: Layers, roles: ['owner', 'admin'] },
      { id: 'locations', label: 'Lugares', icon: MapPin, roles: ['owner', 'admin', 'supervisor'] },
      { id: 'products', label: 'Productos', icon: Package, roles: ['owner', 'admin', 'supervisor'] },
      { id: 'processes', label: 'Procesos', icon: Cog, roles: ['owner', 'admin'] },
      { id: 'employees', label: 'Empleados', icon: Users, roles: ['owner', 'admin', 'supervisor'] },
      { id: 'clients', label: 'Clientes', icon: Users, roles: ['owner', 'admin', 'supervisor', 'cashier'] },
      { id: 'providers', label: 'Proveedores', icon: Building2, roles: ['owner', 'admin', 'supervisor'] },
      { id: 'terminals', label: 'Terminales', icon: Monitor, roles: ['owner', 'admin'] },
    ];

    const operationItems = [
      { id: 'purchases', label: 'Compras', icon: ShoppingBag, roles: ['owner', 'admin', 'supervisor'] },
      { id: 'sales', label: 'Ventas', icon: ShoppingCart, roles: ['owner', 'admin', 'supervisor', 'cashier'] },
      { id: 'production', label: 'Producción', icon: Factory, roles: ['owner', 'admin', 'supervisor'] },
      { id: 'timetracker', label: 'Control de Tiempo', icon: Clock, roles: ['owner', 'admin', 'supervisor', 'employee'] },
      { id: 'expenses', label: 'Gastos', icon: DollarSign, roles: ['owner', 'admin', 'supervisor'] },
    ];

    const reportItems = [
      { id: 'inventory', label: 'Inventario', icon: Package, roles: ['owner', 'admin', 'supervisor'] },
      { id: 'reports', label: 'Reportes', icon: FileText, roles: ['owner', 'admin', 'supervisor'] },
      { id: 'audit', label: 'Auditoría', icon: Search, roles: ['owner', 'admin'] },
    ];

    return [...baseItems, ...configItems, ...operationItems, ...reportItems]
      .filter(item => item.roles.includes(userRole));
  };

  const menuItems = getMenuItems();

  const dashboardItem = menuItems.find(item => item.id === 'dashboard');
  const configItems = menuItems.filter(item => 
    ['configuration', 'location-types', 'locations', 'products', 'processes', 'employees', 'clients', 'providers', 'terminals'].includes(item.id)
  );
  const operationItems = menuItems.filter(item => 
    ['purchases', 'sales', 'production', 'timetracker', 'expenses'].includes(item.id)
  );
  const reportItems = menuItems.filter(item => 
    ['inventory', 'reports', 'audit'].includes(item.id)
  );

  return (
    <div className="fixed left-0 top-0 h-full w-64 bg-blue-900 text-white shadow-lg">
      <div className="p-6">
        <div className="flex items-center space-x-3">
          <Building2 className="h-8 w-8 text-orange-400" />
          <div>
            <h1 className="text-xl font-bold">PyME ERP</h1>
            <p className="text-blue-300 text-sm capitalize">{userRole}</p>
          </div>
        </div>
      </div>

      <nav className="mt-8">
        {/* Dashboard */}
        {dashboardItem && (
          <div className="mb-6">
            <button
              onClick={() => setActiveModule(dashboardItem.id)}
              className={`w-full flex items-center space-x-3 px-6 py-3 text-left transition-colors hover:bg-blue-800 ${
                activeModule === dashboardItem.id ? 'bg-blue-800 border-r-4 border-orange-400' : ''
              }`}
            >
              <dashboardItem.icon className="h-5 w-5" />
              <span>{dashboardItem.label}</span>
            </button>
          </div>
        )}

        {/* Configuration Section */}
        {configItems.length > 0 && (
          <div className="mb-6">
            <div className="px-6 py-2">
              <h3 className="text-xs font-semibold text-blue-300 uppercase tracking-wider">
                Configuración
              </h3>
            </div>
            {configItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveModule(item.id)}
                  className={`w-full flex items-center space-x-3 px-6 py-3 text-left transition-colors hover:bg-blue-800 ${
                    activeModule === item.id ? 'bg-blue-800 border-r-4 border-orange-400' : ''
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Operations Section */}
        {operationItems.length > 0 && (
          <div className="mb-6">
            <div className="px-6 py-2">
              <h3 className="text-xs font-semibold text-blue-300 uppercase tracking-wider">
                Operaciones
              </h3>
            </div>
            {operationItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveModule(item.id)}
                  className={`w-full flex items-center space-x-3 px-6 py-3 text-left transition-colors hover:bg-blue-800 ${
                    activeModule === item.id ? 'bg-blue-800 border-r-4 border-orange-400' : ''
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Reports Section */}
        {reportItems.length > 0 && (
          <div className="mb-6">
            <div className="px-6 py-2">
              <h3 className="text-xs font-semibold text-blue-300 uppercase tracking-wider">
                Reportes
              </h3>
            </div>
            {reportItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveModule(item.id)}
                  className={`w-full flex items-center space-x-3 px-6 py-3 text-left transition-colors hover:bg-blue-800 ${
                    activeModule === item.id ? 'bg-blue-800 border-r-4 border-orange-400' : ''
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </nav>

      <div className="absolute bottom-6 left-6 right-6">
        <button 
          onClick={onLogout}
          className="w-full flex items-center space-x-3 px-4 py-2 text-left text-blue-300 hover:text-white hover:bg-blue-800 rounded-md transition-colors"
        >
          <LogOut className="h-5 w-5" />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;