import { useState } from 'react';
import { useShelterApplications } from '../../../hooks/useApplications';
import { ApplicationCard } from '../components/ApplicationCard';
import { Spinner } from '../../../components/ui/Spinner';
import { APPLICATION_STATUSES, APPLICATION_STATUS_LABELS } from '../../../lib/constants';
import type { ApplicationStatusEnum } from '../../../types/database.types';

export function ApplicationsInboxPage() {
  const { applications, loading, error, updateStatus } = useShelterApplications();
  const [filter, setFilter] = useState<ApplicationStatusEnum | 'all'>('all');

  const visible = filter === 'all' ? applications : applications.filter((a) => a.status === filter);

  return (
    <div>
      <h1 className="text-2xl">Solicitudes de adopción</h1>
      <p className="mt-1 text-sm text-mist">
        {applications.filter((a) => a.status === 'pending').length} pendientes de revisar
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`rounded-full px-3 py-1 text-xs font-medium ${filter === 'all' ? 'bg-forest text-paper' : 'bg-mist/10 text-mist'}`}
        >
          Todas
        </button>
        {APPLICATION_STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`rounded-full px-3 py-1 text-xs font-medium ${filter === s ? 'bg-forest text-paper' : 'bg-mist/10 text-mist'}`}
          >
            {APPLICATION_STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      {error && <p className="mt-4 rounded-md bg-rescue/10 px-3 py-2 text-sm text-rescue">{error}</p>}

      {loading ? (
        <Spinner label="Cargando solicitudes…" />
      ) : visible.length === 0 ? (
        <div className="kennel-card mt-6 p-10 text-center text-mist">
          <p className="font-display text-lg text-forest">No hay solicitudes en esta categoría</p>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {visible.map((app) => (
            <ApplicationCard key={app.id} application={app} onStatusChange={updateStatus} />
          ))}
        </div>
      )}
    </div>
  );
}
