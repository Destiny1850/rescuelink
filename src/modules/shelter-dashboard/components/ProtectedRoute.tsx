import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { Spinner } from '../../../components/ui/Spinner';

export function ProtectedRoute() {
  const { session, loading } = useAuth();

  if (loading) return <Spinner label="Verificando sesión…" />;
  if (!session) return <Navigate to="/albergue/login" replace />;

  return <Outlet />;
}
