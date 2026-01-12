import {useEffect, useState} from 'react';
import {useOnlineSync} from './hooks/useOnlineSync';
import {useTenant} from './contexts/TenantContext';
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
import Login from './components/Login';
import Processes from './components/Processes';
import Terminals from './components/Terminals';
import Production from './components/Production';
import Expenses from './components/Expenses';
import Audit from './components/Audit';
import Clients from './components/Clients';
import Providers from './components/Providers';
import AccountsReceivable from './components/AccountsReceivable';
import AccountsPayable from './components/AccountsPayable';
import Transfers from './components/Transfers';
import Permissions from './components/Permissions';
import PeriodClosures from './components/PeriodClosures';
import {safeStorage} from './lib/safeStorage';
import {getCurrentTenant, setTenantGetter, terminalManager} from './lib/storage';

function App() {
  const [activeModule, setActiveModule] = useState(safeStorage.get('activeModule', 'dashboard'));
  const [userRole, setUserRole] = useState(safeStorage.get('userRole', 'admin'));
  const [isAuthenticated, setIsAuthenticated] = useState(safeStorage.get('isAuthenticated', false));

  // Use tenant context
  const { tenantId } = useTenant();

  // Set tenant getter when tenantId changes
  useEffect(() => {
    if (tenantId) {
      setTenantGetter(() => tenantId);
    }
  }, [tenantId]);

  // Hook para sincronización online/offline
  const { isOnline, isSyncing, lastSync } = useOnlineSync();

  // Debug: mostrar estado de sincronización (solo cuando cambia)
  useEffect(() => {
    console.log('Sync status changed:', { isOnline, isSyncing, lastSync });
  }, [isOnline, isSyncing, lastSync]);

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

  const handleSetTenant = (tenantId: string) => {
    setTenantGetter(() => tenantId);
  };

  // Registrar terminal cuando el usuario se autentica
  useEffect(() => {
    const registerTerminal = async () => {
      if (isAuthenticated && getCurrentTenant()) {
        try {
          // Generar un deviceId único basado en el navegador y dispositivo
          const deviceId = await generateDeviceId();
          const deviceType = getDeviceType();

          await terminalManager.registerTerminal({
            deviceId,
            deviceType,
            userAgent: navigator.userAgent,
            location: 'Local Terminal', // Could be enhanced with geolocation
          });
        } catch (error) {
          console.error('Error registering terminal:', error);
        }
      }
    };

    registerTerminal();
  }, [isAuthenticated]);

  // Función para generar un deviceId único
  const generateDeviceId = async (): Promise<string> => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx?.fillText(navigator.userAgent, 10, 10);

    const fingerprint = [
      navigator.userAgent,
      navigator.language,
      screen.width + 'x' + screen.height,
      new Date().getTimezoneOffset(),
      !!window.sessionStorage,
      !!window.localStorage,
      !!window.indexedDB,
      canvas.toDataURL()
    ].join('|');

    // Simple hash function
    let hash = 0;
    for (let i = 0; i < fingerprint.length; i++) {
      const char = fingerprint.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }

    return Math.abs(hash).toString(36);
  };

  // Función para determinar el tipo de dispositivo
  const getDeviceType = (): 'kiosk' | 'mobile' | 'desktop' => {
    const ua = navigator.userAgent;
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)) {
      return 'mobile';
    }
    if (/Tablet|iPad/i.test(ua)) {
      return 'mobile'; // Tablets count as mobile for our purposes
    }
    return 'desktop'; // Default to desktop
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
      case 'providers':
        return <Providers />;
      case 'accounts-receivable':
        return <AccountsReceivable />;
      case 'accounts-payable':
        return <AccountsPayable />;
      case 'transfers':
        return <Transfers />;
      case 'permissions':
        return <Permissions />;
      case 'period-closures':
        return <PeriodClosures />;
      default:
        return <Dashboard />;
    }
  };

  if (!isAuthenticated) {
    return <Login onAuthenticated={() => handleSetAuthenticated(true)} onRoleSet={handleSetUserRole} onTenantSet={handleSetTenant} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar 
        activeModule={activeModule} 
        setActiveModule={handleSetActiveModule}
        userRole={userRole}
        onLogout={handleLogout}
      />
      <main className={`flex-1 ml-64 ${activeModule === 'dashboard' ? 'p-4' : 'p-8'}`}>
        {renderModule()}
      </main>
    </div>
  );
}

export default App;