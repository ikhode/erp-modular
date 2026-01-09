import React, {useEffect, useState} from 'react';

interface DevError {
  message: string;
  stack?: string;
  time: string;
  type?: string;
}

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100vw',
  zIndex: 9999,
  background: 'rgba(200,0,0,0.95)',
  color: '#fff',
  fontFamily: 'monospace',
  fontSize: 14,
  padding: '16px',
  maxHeight: '50vh',
  overflowY: 'auto',
  boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
};

export const DevErrorOverlay: React.FC = () => {
  const [errors, setErrors] = useState<DevError[]>([]);

  useEffect(() => {
    if (!import.meta.env.DEV) return;
    // Captura errores JS globales
    const onError = (event: ErrorEvent) => {
      setErrors((prev) => [
        {
          message: event.message,
          stack: event.error?.stack,
          time: new Date().toLocaleTimeString(),
          type: 'JS'
        },
        ...prev
      ]);
    };
    // Captura promesas no manejadas
    const onRejection = (event: PromiseRejectionEvent) => {
      setErrors((prev) => [
        {
          message: event.reason?.message || String(event.reason),
          stack: event.reason?.stack,
          time: new Date().toLocaleTimeString(),
          type: 'Promise'
        },
        ...prev
      ]);
    };
    // Captura errores de red (fetch)
    const origFetch = window.fetch;
    window.fetch = async (...args) => {
      try {
        const res = await origFetch(...args);
        if (!res.ok) {
          setErrors((prev) => [
            {
              message: `Network error: ${res.status} ${res.statusText} (${args[0]})`,
              time: new Date().toLocaleTimeString(),
              type: 'Network'
            },
            ...prev
          ]);
        }
        return res;
      } catch (err: any) {
        setErrors((prev) => [
          {
            message: `Fetch failed: ${err?.message || err}`,
            stack: err?.stack,
            time: new Date().toLocaleTimeString(),
            type: 'Network'
          },
          ...prev
        ]);
        throw err;
      }
    };
    // Captura errores de XHR
    const origXHROpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function (...args) {
      this.addEventListener('error', function () {
        setErrors((prev) => [
          {
            message: `XHR error: ${args[1]}`,
            time: new Date().toLocaleTimeString(),
            type: 'XHR'
          },
          ...prev
        ]);
      });
      origXHROpen.apply(this, args);
    };
    // Limpieza
    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onRejection);
    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onRejection);
      window.fetch = origFetch;
      XMLHttpRequest.prototype.open = origXHROpen;
    };
  }, []);

  if (!import.meta.env.DEV || errors.length === 0) return null;

  return (
    <div style={overlayStyle}>
      <strong>Errores detectados en desarrollo:</strong>
      <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
        {errors.map((err, i) => (
          <li key={i} style={{ marginBottom: 12 }}>
            <div><b>[{err.time}] [{err.type}]</b> {err.message}</div>
            {err.stack && <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{err.stack}</pre>}
          </li>
        ))}
      </ul>
      <div style={{ fontSize: 12, marginTop: 8, opacity: 0.7 }}>
        Este overlay solo aparece en desarrollo. Revisa la consola para más detalles.
      </div>
    </div>
  );
};
