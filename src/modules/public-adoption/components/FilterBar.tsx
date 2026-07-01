import { ANIMAL_SPECIES, ANIMAL_SIZES, SPECIES_LABELS, SIZE_LABELS } from '../../../lib/constants';
import type { AnimalFilters } from '../../../hooks/useAnimals';

interface FilterBarProps {
  filters: AnimalFilters;
  onChange: (filters: AnimalFilters) => void;
}

export function FilterBar({ filters, onChange }: FilterBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        value={filters.species ?? ''}
        onChange={(e) => onChange({ ...filters, species: (e.target.value || undefined) as AnimalFilters['species'] })}
        className="input-field w-auto text-sm"
      >
        <option value="">Toda especie</option>
        {ANIMAL_SPECIES.map((s) => (
          <option key={s} value={s}>{SPECIES_LABELS[s]}</option>
        ))}
      </select>

      <select
        value={filters.size ?? ''}
        onChange={(e) => onChange({ ...filters, size: (e.target.value || undefined) as AnimalFilters['size'] })}
        className="input-field w-auto text-sm"
      >
        <option value="">Todo tamaño</option>
        {ANIMAL_SIZES.map((s) => (
          <option key={s} value={s}>{SIZE_LABELS[s]}</option>
        ))}
      </select>

      <button
        onClick={() => onChange({ ...filters, onlyUrgent: !filters.onlyUrgent })}
        className={`rounded-full border px-3 py-2 text-sm font-medium transition-colors ${
          filters.onlyUrgent
            ? 'border-rescue bg-rescue text-paper'
            : 'border-rescue/40 text-rescue hover:bg-rescue/5'
        }`}
      >
        Solo urgentes
      </button>

      {(filters.species || filters.size || filters.onlyUrgent) && (
        <button onClick={() => onChange({})} className="text-sm text-mist hover:text-forest hover:underline">
          Limpiar filtros
        </button>
      )}
    </div>
  );
}
