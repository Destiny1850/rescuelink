import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../../../lib/supabaseClient';
import type { Animal } from '../../../types/database.types';
import { SPECIES_LABELS, SIZE_LABELS } from '../../../lib/constants';
import { Badge } from '../../../components/ui/Badge';
import { Spinner } from '../../../components/ui/Spinner';

export function AnimalDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [animal, setAnimal] = useState<Animal | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    supabase
      .from('animals')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data, error }) => {
        if (error || !data) setNotFound(true);
        else setAnimal(data);
        setLoading(false);
      });
  }, [id]);

  if (loading) return <Spinner label="Cargando ficha…" />;
  if (notFound || !animal) {
    return (
      <div className="py-20 text-center text-mist">
        <p className="font-display text-xl text-forest">No encontramos esta ficha</p>
        <Link to="/" className="mt-3 inline-block text-forest underline">Volver al catálogo</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link to="/" className="text-sm text-mist hover:text-forest">← Volver al catálogo</Link>

      <div className="kennel-card mt-4 overflow-hidden pt-6 sm:flex">
        {animal.status === 'urgent' && <span className="status-stamp status-stamp--urgent">Urgente</span>}

        <img
          src={animal.main_image_url ?? '/icons/icon-512.png'}
          alt={animal.name}
          className="aspect-square w-full object-cover sm:w-64"
        />

        <div className="p-6">
          <h1 className="text-3xl">{animal.name}</h1>
          <p className="mt-1 text-mist">
            {SPECIES_LABELS[animal.species]}
            {animal.breed ? ` · ${animal.breed}` : ''}
            {animal.size ? ` · ${SIZE_LABELS[animal.size]}` : ''}
          </p>

          {animal.age_months != null && (
            <p className="mt-1 font-mono text-sm text-mist">
              {animal.age_months < 12 ? `${animal.age_months} meses` : `${Math.floor(animal.age_months / 12)} años`}
            </p>
          )}

          {animal.personality_tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {animal.personality_tags.map((tag) => (
                <Badge key={tag} variant="forest">{tag}</Badge>
              ))}
            </div>
          )}

          {animal.health_status && (
            <p className="mt-4 text-sm">
              <span className="font-semibold text-ink">Salud: </span>
              <span className="text-mist">{animal.health_status}</span>
            </p>
          )}

          {animal.bio && <p className="mt-4 text-sm leading-relaxed text-ink">{animal.bio}</p>}

          <Link to={`/animal/${animal.id}/postular`} className="btn-primary mt-6 w-full sm:w-auto">
            Quiero adoptar a {animal.name}
          </Link>
        </div>
      </div>
    </div>
  );
}
