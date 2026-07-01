import type { ApplicationWithAnimal } from '../../../hooks/useApplications';
import { APPLICATION_STATUS_LABELS, HOUSE_TYPE_LABELS } from '../../../lib/constants';
import type { ApplicationStatusEnum } from '../../../types/database.types';

interface ApplicationCardProps {
  application: ApplicationWithAnimal;
  onStatusChange: (id: string, status: ApplicationStatusEnum) => void;
}

const statusStyles: Record<ApplicationStatusEnum, string> = {
  pending: 'bg-gold/10 text-gold',
  reviewed: 'bg-mist/10 text-mist',
  approved: 'bg-forest/10 text-forest',
  rejected: 'bg-rescue/10 text-rescue',
};

export function ApplicationCard({ application, onStatusChange }: ApplicationCardProps) {
  return (
    <div className="kennel-card p-5 pt-7">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <img
            src={application.animals?.main_image_url ?? '/icons/icon-192.png'}
            alt={application.animals?.name ?? 'Animal'}
            className="h-12 w-12 rounded-full object-cover"
          />
          <div>
            <p className="text-sm text-mist">Solicitud para</p>
            <p className="font-display text-lg text-forest">{application.animals?.name ?? 'Animal eliminado'}</p>
          </div>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyles[application.status]}`}>
          {APPLICATION_STATUS_LABELS[application.status]}
        </span>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        <div>
          <dt className="text-xs uppercase tracking-wide text-mist">Solicitante</dt>
          <dd className="text-ink">{application.applicant_name}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-mist">Contacto</dt>
          <dd className="text-ink">{application.applicant_email}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-mist">Tipo de vivienda</dt>
          <dd className="text-ink">{application.house_type ? HOUSE_TYPE_LABELS[application.house_type] : '—'}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-mist">Otras mascotas</dt>
          <dd className="text-ink">{application.has_other_pets ? 'Sí' : 'No'}</dd>
        </div>
      </dl>

      {Object.keys(application.answers_json ?? {}).length > 0 && (
        <details className="mt-3 text-sm">
          <summary className="cursor-pointer text-forest">Ver respuestas del formulario</summary>
          <ul className="mt-2 space-y-1 text-mist">
            {Object.entries(application.answers_json).map(([question, answer]) => (
              <li key={question}>
                <span className="font-medium text-ink">{question}:</span> {String(answer)}
              </li>
            ))}
          </ul>
        </details>
      )}

      <div className="mt-4 flex gap-2 border-t border-ink/5 pt-4">
        <button
          onClick={() => onStatusChange(application.id, 'reviewed')}
          className="btn-secondary flex-1 !py-1.5 text-xs"
          disabled={application.status === 'reviewed'}
        >
          Marcar revisada
        </button>
        <button
          onClick={() => onStatusChange(application.id, 'approved')}
          className="flex-1 rounded-md bg-forest px-3 py-1.5 text-xs font-semibold text-paper hover:bg-forest-light"
          disabled={application.status === 'approved'}
        >
          Aprobar
        </button>
        <button
          onClick={() => onStatusChange(application.id, 'rejected')}
          className="flex-1 rounded-md border border-rescue/40 px-3 py-1.5 text-xs font-semibold text-rescue hover:bg-rescue/5"
          disabled={application.status === 'rejected'}
        >
          Rechazar
        </button>
      </div>
    </div>
  );
}
