import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import {folioGenerator} from './lib/storage';

// Inicializar secuencias de folios al inicio
folioGenerator.initializeSequences().catch(console.error);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
