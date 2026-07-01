export function Spinner({ label = 'Cargando…' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-mist" role="status">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-mist/30 border-t-forest" />
      <span className="text-sm">{label}</span>
    </div>
  );
}
