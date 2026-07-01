import { Link, Outlet } from 'react-router-dom';

export function PublicLayout() {
  return (
    <div className="min-h-screen bg-paper">
      <header className="border-b border-ink/10 bg-paper/95 backdrop-blur sticky top-0 z-30">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <Link to="/" className="font-display text-xl font-semibold text-forest">
            RescueLink
          </Link>
          <Link to="/albergue/login" className="text-sm font-medium text-mist hover:text-forest">
            Soy un albergue →
          </Link>
        </div>
      </header>
      <main>
        <Outlet />
      </main>
      <footer className="mx-auto max-w-5xl px-4 py-10 text-center text-xs text-mist">
        RescueLink — conectando albergues con familias, sin costo de infraestructura.
      </footer>
    </div>
  );
}
