import type { Animal, AnimalStatusEnum } from '../../../types/database.types';
import { SPECIES_LABELS, STATUS_LABELS, ANIMAL_STATUSES } from '../../../lib/constants';

interface AnimalTableProps {
  animals: Animal[];
  onEdit: (animal: Animal) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: AnimalStatusEnum) => void;
}

const statusPillStyles: Record<AnimalStatusEnum, string> = {
  available: 'bg-forest/10 text-forest',
  foster: 'bg-gold/10 text-gold',
  adopted: 'bg-mist/10 text-mist',
  urgent: 'bg-rescue/10 text-rescue',
};

export function AnimalTable({ animals, onEdit, onDelete, onStatusChange }: AnimalTableProps) {
  if (animals.length === 0) {
    return (
      <div className="kennel-card mt-6 p-10 text-center text-mist">
        <p className="font-display text-lg text-forest">Aún no hay animales registrados</p>
        <p className="mt-1 text-sm">Usa el botón "Agregar animal" para crear la primera ficha.</p>
      </div>
    );
  }

  return (
    <div className="mt-6 overflow-hidden rounded-lg border border-ink/10">
      <table className="w-full text-left text-sm">
        <thead className="bg-forest/5 text-xs uppercase tracking-wide text-mist">
          <tr>
            <th className="px-4 py-3">Animal</th>
            <th className="px-4 py-3">Especie</th>
            <th className="px-4 py-3">Edad</th>
            <th className="px-4 py-3">Estado</th>
            <th className="px-4 py-3 text-right">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-ink/5 bg-white">
          {animals.map((animal) => (
            <tr key={animal.id}>
              <td className="flex items-center gap-3 px-4 py-3">
                <img
                  src={animal.main_image_url ?? '/icons/icon-192.png'}
                  alt={animal.name}
                  className="h-10 w-10 rounded-full object-cover"
                />
                <span className="font-medium text-ink">{animal.name}</span>
              </td>
              <td className="px-4 py-3 text-mist">{SPECIES_LABELS[animal.species]}</td>
              <td className="px-4 py-3 font-mono text-xs text-mist">
                {animal.age_months != null ? `${animal.age_months} meses` : '—'}
              </td>
              <td className="px-4 py-3">
                <select
                  value={animal.status}
                  onChange={(e) => onStatusChange(animal.id, e.target.value as AnimalStatusEnum)}
                  className={`rounded-full border-0 px-2.5 py-1 text-xs font-semibold ${statusPillStyles[animal.status]}`}
                >
                  {ANIMAL_STATUSES.map((s) => (
                    <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                  ))}
                </select>
              </td>
              <td className="px-4 py-3 text-right">
                <button onClick={() => onEdit(animal)} className="mr-3 text-sm font-medium text-forest hover:underline">
                  Editar
                </button>
                <button
                  onClick={() => {
                    if (confirm(`¿Eliminar la ficha de ${animal.name}? Esta acción no se puede deshacer.`)) {
                      onDelete(animal.id);
                    }
                  }}
                  className="text-sm font-medium text-rescue hover:underline"
                >
                  Eliminar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
