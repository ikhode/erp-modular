import {useEffect, useState} from 'react';
import {
    AlertTriangle,
    CheckCircle,
    Monitor,
    RefreshCw,
    Settings,
    Shield,
    ShieldOff,
    Smartphone,
    Tablet,
    XCircle
} from 'lucide-react';
import {storage} from '../lib/storage';
import {Terminal, TerminalSession} from '../lib/db';

interface TerminalsProps {
  className?: string;
}

export default function Terminals({ className }: TerminalsProps) {
  const [terminals, setTerminals] = useState<Terminal[]>([]);
  const [sessions, setSessions] = useState<TerminalSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTerminal, setSelectedTerminal] = useState<Terminal | null>(null);
  const [showRevokeModal, setShowRevokeModal] = useState(false);
  const [revocationReason, setRevocationReason] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [terminalsData, sessionsData] = await Promise.all([
        storage.terminals?.getAll() || [],
        storage.terminalSessions?.getAll() || []
      ]);
      setTerminals(terminalsData);
      setSessions(sessionsData);
    } catch (error) {
      console.error('Error loading terminals data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType) {
      case 'mobile': return Smartphone;
      case 'tablet': return Tablet;
      default: return Monitor;
    }
  };

  const getStatusColor = (terminal: Terminal) => {
    if (!terminal.isActive) return 'text-red-600 bg-red-100';
    if (terminal.revokedAt) return 'text-orange-600 bg-orange-100';
    return 'text-green-600 bg-green-100';
  };

  const getStatusText = (terminal: Terminal) => {
    if (!terminal.isActive) return 'Inactivo';
    if (terminal.revokedAt) return 'Revocado';
    return 'Activo';
  };

  const handleRevokeTerminal = async () => {
    if (!selectedTerminal || !revocationReason.trim()) return;

    try {
      await storage.terminals?.update(selectedTerminal.id!, {
        isActive: false,
        revokedAt: new Date(),
        revocationReason,
        updatedAt: new Date()
      });

      // End any active sessions for this terminal
      const activeSessions = sessions.filter(s =>
        s.terminalId === selectedTerminal.id && !s.endedAt
      );

      for (const session of activeSessions) {
        await storage.terminalSessions?.update(session.id!, {
          endedAt: new Date(),
          updatedAt: new Date()
        });
      }

      setShowRevokeModal(false);
      setSelectedTerminal(null);
      setRevocationReason('');
      await loadData();
    } catch (error) {
      console.error('Error revoking terminal:', error);
    }
  };

  const handleActivateTerminal = async (terminal: Terminal) => {
    try {
      await storage.terminals?.update(terminal.id!, {
        isActive: true,
        revokedAt: undefined,
        revocationReason: undefined,
        updatedAt: new Date()
      });
      await loadData();
    } catch (error) {
      console.error('Error activating terminal:', error);
    }
  };

  const getTerminalSessions = (terminalId: number) => {
    return sessions.filter(s => s.terminalId === terminalId);
  };

  if (loading) {
    return (
      <div className={`p-6 ${className}`}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestión de Terminales</h2>
          <p className="text-gray-600 mt-1">Administra dispositivos y sesiones de autenticación</p>
        </div>
        <button
          onClick={loadData}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Actualizar</span>
        </button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="bg-green-100 p-2 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {terminals.filter(t => t.isActive && !t.revokedAt).length}
              </div>
              <div className="text-sm text-gray-600">Activos</div>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="bg-orange-100 p-2 rounded-lg">
              <ShieldOff className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {terminals.filter(t => t.revokedAt).length}
              </div>
              <div className="text-sm text-gray-600">Revocados</div>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="bg-red-100 p-2 rounded-lg">
              <XCircle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {terminals.filter(t => !t.isActive).length}
              </div>
              <div className="text-sm text-gray-600">Inactivos</div>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <Monitor className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {sessions.filter(s => !s.endedAt).length}
              </div>
              <div className="text-sm text-gray-600">Sesiones Activas</div>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Terminales */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Terminales Registradas</h3>
        </div>

        <div className="divide-y divide-gray-200">
          {terminals.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Monitor className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No hay terminales registradas</p>
            </div>
          ) : (
            terminals.map((terminal) => {
              const DeviceIcon = getDeviceIcon(terminal.deviceType);
              const terminalSessions = getTerminalSessions(terminal.id!);

              return (
                <div key={terminal.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="bg-gray-100 p-3 rounded-lg">
                        <DeviceIcon className="h-6 w-6 text-gray-600" />
                      </div>

                      <div>
                        <h4 className="text-lg font-semibold text-gray-900">{terminal.name}</h4>
                        <div className="flex items-center space-x-4 mt-1">
                          <span className="text-sm text-gray-600">
                            ID: {terminal.deviceId}
                          </span>
                          <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(terminal)}`}>
                            {getStatusText(terminal)}
                          </span>
                        </div>
                        <div className="text-sm text-gray-500 mt-1">
                          Última actividad: {terminal.lastSeen ? new Date(terminal.lastSeen).toLocaleString('es-MX') : 'Nunca'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <div className="text-right text-sm text-gray-600">
                        <div>{terminalSessions.length} sesiones</div>
                        <div>{terminal.allowedModules.length} módulos</div>
                      </div>

                      <div className="flex items-center space-x-2">
                        {terminal.faceAuthEnabled && (
                          <span title="Face Auth habilitado">
                            <Shield className="h-4 w-4 text-green-600" />
                          </span>
                        )}

                        {terminal.isActive && !terminal.revokedAt ? (
                          <button
                            onClick={() => {
                              setSelectedTerminal(terminal);
                              setShowRevokeModal(true);
                            }}
                            className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                            title="Revocar terminal"
                          >
                            Revocar
                          </button>
                        ) : (
                          <button
                            onClick={() => handleActivateTerminal(terminal)}
                            className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                            title="Activar terminal"
                          >
                            Activar
                          </button>
                        )}

                        <button className="p-2 text-gray-400 hover:text-gray-600">
                          <Settings className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Detalles adicionales */}
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Ubicación:</span>
                      <span className="ml-2 text-gray-900">{terminal.location || 'No especificada'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">IP:</span>
                      <span className="ml-2 text-gray-900">{terminal.ipAddress || 'Desconocida'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Módulos permitidos:</span>
                      <span className="ml-2 text-gray-900">{terminal.allowedModules.join(', ') || 'Todos'}</span>
                    </div>
                  </div>

                  {/* Razón de revocación si aplica */}
                  {terminal.revocationReason && (
                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                        <span className="text-sm text-red-800">
                          Razón de revocación: {terminal.revocationReason}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Modal de Revocación */}
      {showRevokeModal && selectedTerminal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <AlertTriangle className="h-6 w-6 text-red-600" />
                <h3 className="text-lg font-semibold text-gray-900">Revocar Terminal</h3>
              </div>

              <p className="text-gray-600 mb-4">
                ¿Estás seguro de que quieres revocar el acceso al terminal <strong>{selectedTerminal.name}</strong>?
                Esto finalizará todas las sesiones activas y bloqueará el acceso futuro.
              </p>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Razón de revocación (requerida)
                </label>
                <textarea
                  value={revocationReason}
                  onChange={(e) => setRevocationReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  rows={3}
                  placeholder="Describe el motivo de la revocación..."
                  required
                />
              </div>

              <div className="flex items-center space-x-3">
                <button
                  onClick={() => {
                    setShowRevokeModal(false);
                    setSelectedTerminal(null);
                    setRevocationReason('');
                  }}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleRevokeTerminal}
                  disabled={!revocationReason.trim()}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed transition-colors"
                >
                  Revocar Terminal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
