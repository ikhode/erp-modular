import {createContext, ReactNode, useContext, useEffect, useState} from 'react';

interface TenantContextType {
  tenantId: string | null;
  setTenantId: (id: string) => void;
  isLoading: boolean;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export const useTenant = () => {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
};

interface TenantProviderProps {
  children: ReactNode;
}

export const TenantProvider: React.FC<TenantProviderProps> = ({ children }) => {
  const [tenantId, setTenantIdState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Try to get tenantId from localStorage or generate a default one
    const storedTenantId = localStorage.getItem('erp_tenant_id');
    if (storedTenantId) {
      setTenantIdState(storedTenantId);
    } else {
      // For demo purposes, generate a default tenant ID
      const defaultTenantId = 'demo-tenant-' + Date.now();
      localStorage.setItem('erp_tenant_id', defaultTenantId);
      setTenantIdState(defaultTenantId);
    }
    setIsLoading(false);
  }, []);

  const setTenantId = (id: string) => {
    setTenantIdState(id);
    localStorage.setItem('erp_tenant_id', id);
  };

  const value: TenantContextType = {
    tenantId,
    setTenantId,
    isLoading,
  };

  return (
    <TenantContext.Provider value={value}>
      {children}
    </TenantContext.Provider>
  );
};
