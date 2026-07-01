import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const navItems = [
  { to: '/albergue', label: 'Inventario', end: true },
  { to: '/albergue/solicitudes', label: 'Solicitudes', end: false },
];

export function DashboardLayout() {
  const { signOut, user } = useAuth();

  return (
    <div className="min-h-screen bg-paper">
      <header className="border-b border-ink/10 bg-forest text-paper">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <span className="font-display text-lg font-semibold">RescueLink · Panel del albergue</span>
          <div className="flex items-center gap-4 text-sm">
            <span className="hidden text-paper/70 sm:inline">{user?.email}</span>
            <button onClick={signOut} className="rounded-md border border-paper/30 px-3 py-1.5 hover:bg-paper/10">
              Cerrar sesión
            </button>
          </div>
        </div>
        <nav className="mx-auto flex max-w-6xl gap-1 px-4">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `rounded-t-md px-4 py-2 text-sm font-medium transition-colors ${
                  isActive ? 'bg-paper text-forest' : 'text-paper/70 hover:text-paper'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
