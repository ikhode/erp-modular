import React, { useState } from 'react';
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

function App() {
  const [activeModule, setActiveModule] = useState('dashboard');
  const [userRole, setUserRole] = useState('admin'); // owner, admin, supervisor, cashier, employee
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [companyConfig, setCompanyConfig] = useState({
    name: 'Mi Empresa',
    industry: 'general',
    modules: {
      inventory: true,
      production: true,
      sales: true,
      purchases: true,
      employees: true,
      expenses: true,
      reports: true
    }
  });

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
      default:
        return <Dashboard />;
    }
  };

  if (!isAuthenticated) {
    return <FaceAuth onAuthenticated={() => setIsAuthenticated(true)} onRoleSet={setUserRole} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar 
        activeModule={activeModule} 
        setActiveModule={setActiveModule}
        userRole={userRole} 
      />
      <main className="flex-1 ml-64 p-8">
        {renderModule()}
      </main>
    </div>
  );
}

export default App;