import {useState} from 'react';
import {useOnlineSync} from './hooks/useOnlineSync';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Configuration from './components/Configuration';
import LocationTypes from './components/LocationTypes';
import Locations from './components/Locations';
import Products from './components/Products';
import Purchases from './components/Purchases';
import Sales from './components/Sales';
import Employees from './components/Employees';
import TimeTracker from './components/TimeTracker';
import Inventory from './components/Inventory';
import Reports from './components/Reports';
import FaceAuth from './components/FaceAuth';
import Processes from './components/Processes';
import Terminals from './components/Terminals';
import Production from './components/Production';
import Expenses from './components/Expenses';
import Audit from './components/Audit';
import Clients from './components/Clients';
import {safeStorage} from './lib/safeStorage';

function App() {
  const [activeModule, setActiveModule] = useState(safeStorage.get('activeModule', 'dashboard'));
  const [userRole, setUserRole] = useState(safeStorage.get('userRole', 'admin'));
  const [isAuthenticated, setIsAuthenticated] = useState(safeStorage.get('isAuthenticated', false));

  // Hook para sincronización online/offline
  const { isOnline, isSyncing, lastSync } = useOnlineSync();

  // Debug: mostrar estado de sincronización
  console.log('Sync status:', { isOnline, isSyncing, lastSync });

  // Persistir cambios en localStorage de forma segura
  const handleSetActiveModule = (module: string) => {
    setActiveModule(module);
    safeStorage.set('activeModule', module);
  };

  const handleSetUserRole = (role: string) => {
    setUserRole(role);
    safeStorage.set('userRole', role);
  };

  const handleSetAuthenticated = (authenticated: boolean) => {
    setIsAuthenticated(authenticated);
    safeStorage.set('isAuthenticated', authenticated);
  };

  const handleLogout = () => {
    handleSetAuthenticated(false);
    handleSetActiveModule('dashboard');
    safeStorage.remove('userRole');
  };

  const renderModule = () => {
    switch (activeModule) {
      case 'dashboard':
        return <Dashboard />;
      case 'configuration':
        return <Configuration />;
      case 'location-types':
        return <LocationTypes />;
      case 'locations':
        return <Locations />;
      case 'products':
        return <Products />;
      case 'processes':
        return <Processes />;
      case 'production':
        return <Production />;
      case 'purchases':
        return <Purchases />;
      case 'sales':
        return <Sales />;
      case 'employees':
        return <Employees />;
      case 'terminals':
        return <Terminals />;
      case 'timetracker':
        return <TimeTracker />;
      case 'inventory':
        return <Inventory />;
      case 'expenses':
        return <Expenses />;
      case 'reports':
        return <Reports />;
      case 'audit':
        return <Audit />;
      case 'clients':
        return <Clients />;
      default:
        return <Dashboard />;
    }
  };

  if (!isAuthenticated) {
    return <FaceAuth onAuthenticated={() => handleSetAuthenticated(true)} onRoleSet={handleSetUserRole} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar 
        activeModule={activeModule} 
        setActiveModule={handleSetActiveModule}
        userRole={userRole}
        onLogout={handleLogout}
      />
      <main className="flex-1 ml-64 p-8">
        {renderModule()}
      </main>
    </div>
  );
}

export default App;