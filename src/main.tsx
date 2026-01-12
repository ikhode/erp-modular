import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import {folioGenerator} from './lib/storage';
import {TenantProvider} from './contexts/TenantContext';

// Inicializar secuencias de folios al inicio
folioGenerator.initializeSequences().catch(console.error);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <TenantProvider>
      <App />
    </TenantProvider>
  </StrictMode>
);
