import { Link } from 'react-router-dom';
import type { Animal } from '../../../types/database.types';
import { SPECIES_LABELS, SIZE_LABELS } from '../../../lib/constants';
import { Badge } from '../../../components/ui/Badge';

export function AnimalCard({ animal }: { animal: Animal }) {
  const ageLabel =
    animal.age_months != null
      ? animal.age_months < 12
        ? `${animal.age_months} meses`
        : `${Math.floor(animal.age_months / 12)} años`
      : 'Edad desconocida';

  return (
    <Link to={`/animal/${animal.id}`} className="kennel-card group block pt-6 transition-transform hover:-translate-y-0.5">
      {animal.status === 'urgent' && <span className="status-stamp status-stamp--urgent">Urgente</span>}
      {animal.status === 'foster' && <span className="status-stamp status-stamp--foster">Hogar temporal</span>}

      <div className="aspect-square overflow-hidden bg-mist/10">
        <img
          src={animal.main_image_url ?? '/icons/icon-512.png'}
          alt={animal.name}
          className="h-full w-full object-cover transition-transform group-hover:scale-105"
          loading="lazy"
        />
      </div>

      <div className="p-4">
        <div className="flex items-baseline justify-between">
          <h3 className="font-display text-lg text-forest">{animal.name}</h3>
          <span className="font-mono text-xs text-mist">{ageLabel}</span>
        </div>
        <p className="text-sm text-mist">
          {SPECIES_LABELS[animal.species]}
          {animal.breed ? ` · ${animal.breed}` : ''}
          {animal.size ? ` · ${SIZE_LABELS[animal.size]}` : ''}
        </p>

        {animal.personality_tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {animal.personality_tags.slice(0, 3).map((tag) => (
              <Badge key={tag}>{tag}</Badge>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
