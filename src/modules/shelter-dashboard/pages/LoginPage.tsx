import { useState, type FormEvent } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';

export function LoginPage() {
  const { signIn, session } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (session) return <Navigate to="/albergue" replace />;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error: signInError } = await signIn(email, password);
    setLoading(false);
    if (signInError) setError('Correo o contraseña incorrectos.');
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <div className="kennel-card w-full max-w-sm p-8 pt-10">
        <h1 className="text-2xl">Panel del albergue</h1>
        <p className="mt-1 text-sm text-mist">Ingresa con la cuenta de tu organización.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="email" className="label-field">Correo institucional</label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              placeholder="contacto@turefugio.org"
            />
          </div>
          <div>
            <label htmlFor="password" className="label-field">Contraseña</label>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p role="alert" className="rounded-md bg-rescue/10 px-3 py-2 text-sm text-rescue">
              {error}
            </p>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Ingresando…' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  );
}
