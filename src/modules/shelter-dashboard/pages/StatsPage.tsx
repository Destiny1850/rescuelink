import { useEffect, useState } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { supabase } from '../../../lib/supabaseClient';
import { Spinner } from '../../../components/ui/Spinner';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell
} from 'recharts';

interface Stats {
  totalAnimals: number;
  adopted: number;
  urgent: number;
  available: number;
  totalApplications: number;
  approved: number;
  pending: number;
  conversionRate: number;
  topAnimal: { name: string; count: number } | null;
  monthlyData: { month: string; registrados: number; adoptados: number }[];
}

const MONTHS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

export function StatsPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    loadStats();
  }, [user?.id]);

  const loadStats = async () => {
    setLoading(true);

    // Animales del albergue
    const { data: animals } = await supabase
      .from('animals')
      .select('id, name, status, created_at')
      .eq('shelter_id', user!.id);

    // Solicitudes
    const { data: applications } = await supabase
      .from('adoption_applications')
      .select('id, status, animal_id, created_at')
      .in('animal_id', (animals ?? []).map(a => a.id));

    const total = animals?.length ?? 0;
    const adopted = animals?.filter(a => a.status === 'adopted').length ?? 0;
    const urgent = animals?.filter(a => a.status === 'urgent').length ?? 0;
    const available = animals?.filter(a => a.status === 'available').length ?? 0;

    const totalApps = applications?.length ?? 0;
    const approvedApps = applications?.filter(a => a.status === 'approved').length ?? 0;
    const pendingApps = applications?.filter(a => a.status === 'pending').length ?? 0;
    const conversionRate = totalApps > 0 ? Math.round((approvedApps / totalApps) * 100) : 0;

    // Animal más solicitado
    const appsByAnimal: Record<string, number> = {};
    applications?.forEach(app => {
      appsByAnimal[app.animal_id] = (appsByAnimal[app.animal_id] ?? 0) + 1;
    });
    const topAnimalId = Object.entries(appsByAnimal).sort((a, b) => b[1] - a[1])[0];
    const topAnimal = topAnimalId
      ? { name: animals?.find(a => a.id === topAnimalId[0])?.name ?? '—', count: topAnimalId[1] }
      : null;

    // Datos mensuales (últimos 6 meses)
    const now = new Date();
    const monthlyData = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      const label = MONTHS[d.getMonth()];
      const registrados = animals?.filter(a => {
        const created = new Date(a.created_at);
        return created.getMonth() === d.getMonth() && created.getFullYear() === d.getFullYear();
      }).length ?? 0;
      const adoptados = animals?.filter(a => {
        const created = new Date(a.created_at);
        return a.status === 'adopted' &&
          created.getMonth() === d.getMonth() && created.getFullYear() === d.getFullYear();
      }).length ?? 0;
      return { month: label, registrados, adoptados };
    });

    setStats({
      totalAnimals: total, adopted, urgent, available,
      totalApplications: totalApps, approved: approvedApps,
      pending: pendingApps, conversionRate, topAnimal, monthlyData,
    });
    setLoading(false);
  };

  if (loading) return <Spinner label="Calculando estadísticas…" />;
  if (!stats) return null;

  return (
    <div>
      <h1 className="text-2xl">Estadísticas</h1>
      <p className="mt-1 text-sm text-mist">Resumen de actividad de tu albergue</p>

      {/* KPIs */}
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: 'Total animales', value: stats.totalAnimals, color: 'text-forest' },
          { label: 'Adoptados', value: stats.adopted, color: 'text-moss' },
          { label: 'Urgentes', value: stats.urgent, color: 'text-rescue' },
          { label: 'Tasa de adopción', value: `${stats.conversionRate}%`, color: 'text-gold' },
        ].map((kpi) => (
          <div key={kpi.label} className="kennel-card p-5 pt-7 text-center">
            <p className={`font-display text-3xl font-bold ${kpi.color}`}>{kpi.value}</p>
            <p className="mt-1 text-xs text-mist">{kpi.label}</p>
          </div>
        ))}
      </div>

      {/* Gráfica de barras */}
      <div className="kennel-card mt-6 p-6 pt-8">
        <h2 className="font-display text-base text-forest mb-4">Actividad últimos 6 meses</h2>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={stats.monthlyData} barGap={4}>
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#7C8B85' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#7C8B85' }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip
              contentStyle={{ background: '#fff', border: '1px solid #E8DFCE', borderRadius: 8, fontSize: 12 }}
            />
            <Bar dataKey="registrados" name="Registrados" radius={[4,4,0,0]}>
              {stats.monthlyData.map((_, i) => <Cell key={i} fill="#2F4538" />)}
            </Bar>
            <Bar dataKey="adoptados" name="Adoptados" radius={[4,4,0,0]}>
              {stats.monthlyData.map((_, i) => <Cell key={i} fill="#C99A3D" />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-2 flex gap-4 justify-center">
          <span className="flex items-center gap-1 text-xs text-mist"><span className="inline-block w-3 h-3 rounded-sm bg-forest"></span>Registrados</span>
          <span className="flex items-center gap-1 text-xs text-mist"><span className="inline-block w-3 h-3 rounded-sm bg-gold"></span>Adoptados</span>
        </div>
      </div>

      {/* Solicitudes + animal estrella */}
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="kennel-card p-6 pt-8">
          <h2 className="font-display text-base text-forest mb-4">Solicitudes de adopción</h2>
          <div className="space-y-3">
            {[
              { label: 'Total recibidas', value: stats.totalApplications, bg: 'bg-forest/10', color: 'text-forest' },
              { label: 'Aprobadas', value: stats.approved, bg: 'bg-moss/10', color: 'text-moss' },
              { label: 'Pendientes', value: stats.pending, bg: 'bg-gold/10', color: 'text-gold' },
            ].map(item => (
              <div key={item.label} className={`flex items-center justify-between rounded-lg px-4 py-3 ${item.bg}`}>
                <span className="text-sm text-ink">{item.label}</span>
                <span className={`font-display text-xl font-bold ${item.color}`}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="kennel-card p-6 pt-8">
          <h2 className="font-display text-base text-forest mb-4">Animal más solicitado</h2>
          {stats.topAnimal ? (
            <div className="text-center py-4">
              <p className="text-5xl">🏆</p>
              <p className="font-display text-2xl text-forest mt-3">{stats.topAnimal.name}</p>
              <p className="text-sm text-mist mt-1">{stats.topAnimal.count} solicitudes recibidas</p>
            </div>
          ) : (
            <p className="text-center text-mist py-8 text-sm">Aún no hay solicitudes registradas</p>
          )}
        </div>
      </div>
    </div>
  );
}
