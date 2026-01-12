import {useState} from 'react';
import {supabase} from '../lib/supabase';
import {setCurrentTenant} from '../lib/storage';
import FaceAuth from './FaceAuth';

interface LoginProps {
  onAuthenticated: () => void;
  onRoleSet: (role: string) => void;
  onTenantSet?: (tenantId: string) => void;
}

export default function Login({ onAuthenticated, onRoleSet, onTenantSet }: LoginProps) {
  const [credentials, setCredentials] = useState<{email: string; password: string}>({
    email: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<null | { id: string; email: string }>(null);
  const [step, setStep] = useState<'login' | 'register' | 'face-auth'>('login');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (error) throw error;

      if (data.user) {
        // Set default tenant for now (user ID as tenant)
        const tenantId = data.user.id;
        setCurrentTenant(tenantId);

        setUser(data.user);

        // Notify parent component about tenant
        if (onTenantSet) {
          onTenantSet(tenantId);
        }

        // For now, skip face auth and proceed directly
        onAuthenticated();
        onRoleSet('admin'); // Default role

        // TODO: Later implement profile fetching when Supabase is properly set up
        // const { data: profile, error: profileError } = await supabase
        //   .from('profiles')
        //   .select('id, tenant_id, face_data')
        //   .eq('id', data.user.id)
        //   .single();
        //
        // if (profileError) {
        //   throw new Error('Error al obtener perfil de usuario');
        // }
        //
        // setCurrentTenant(profile.tenant_id || data.user.id);
        //
        // if (profile.face_data) {
        //   setStep('face-auth');
        // } else {
        //   onAuthenticated();
        //   onRoleSet('admin');
        // }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: credentials.email,
        password: credentials.password,
      });

      if (error) throw error;

      if (data.user) {
        // Create tenant for new user (each user gets their own tenant)
        const tenantId = data.user.id;

        // Create profile with tenant
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            email: data.user.email,
            tenant_id: tenantId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });

        if (profileError) {
          console.error('Error creating profile:', profileError);
          // Don't throw here, user is created but profile creation failed
        }

        // Set tenant context
        setCurrentTenant(tenantId);

        setError('Usuario registrado exitosamente. Revisa tu email para confirmar tu cuenta.');
        setStep('login'); // Go back to login
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  if (step === 'face-auth' && user) {
    return (
      <FaceAuth
        onAuthenticated={onAuthenticated}
        onRoleSet={onRoleSet}
        userId={user.id}
        mode="auth"
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Forzapp ERP</h1>
          <p className="text-gray-600">Sistema de Gestión Empresarial</p>
        </div>

        {step === 'login' ? (
          <>
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Correo electrónico
                </label>
                <input
                  id="email"
                  type="email"
                  value={credentials.email}
                  onChange={(e) => setCredentials({...credentials, email: e.target.value})}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="tu@email.com"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Contraseña
                </label>
                <input
                  id="password"
                  type="password"
                  value={credentials.password}
                  onChange={(e) => setCredentials({...credentials, password: e.target.value})}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="••••••••"
                />
              </div>

              {error && (
                <div className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-lg">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Iniciando sesión...
                  </div>
                ) : (
                  'Iniciar Sesión'
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                ¿No tienes cuenta?{' '}
                <button
                  onClick={() => setStep('register')}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  Regístrate aquí
                </button>
              </p>
            </div>
          </>
        ) : (
          <>
            <form onSubmit={handleRegister} className="space-y-6">
              <div>
                <label htmlFor="register-email" className="block text-sm font-medium text-gray-700 mb-2">
                  Correo electrónico
                </label>
                <input
                  id="register-email"
                  type="email"
                  value={credentials.email}
                  onChange={(e) => setCredentials({...credentials, email: e.target.value})}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="tu@email.com"
                />
              </div>

              <div>
                <label htmlFor="register-password" className="block text-sm font-medium text-gray-700 mb-2">
                  Contraseña
                </label>
                <input
                  id="register-password"
                  type="password"
                  value={credentials.password}
                  onChange={(e) => setCredentials({...credentials, password: e.target.value})}
                  required
                  minLength={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="••••••••"
                />
                <p className="text-xs text-gray-500 mt-1">Mínimo 6 caracteres</p>
              </div>

              {error && (
                <div className={`text-sm text-center p-3 rounded-lg ${
                  error.includes('exitosamente') ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'
                }`}>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Creando cuenta...
                  </div>
                ) : (
                  'Crear Cuenta'
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                ¿Ya tienes cuenta?{' '}
                <button
                  onClick={() => setStep('login')}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  Inicia sesión
                </button>
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
