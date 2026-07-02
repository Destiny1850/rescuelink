import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../../../lib/supabaseClient';
import type { Animal, Shelter } from '../../../types/database.types';
import { SPECIES_LABELS, SIZE_LABELS } from '../../../lib/constants';
import { Badge } from '../../../components/ui/Badge';
import { Spinner } from '../../../components/ui/Spinner';
import { PhotoGallery } from '../../../components/ui/PhotoGallery';

export function AnimalDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [animal, setAnimal] = useState<Animal | null>(null);
  const [shelter, setShelter] = useState<Shelter | null>(null);
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
      .then(async ({ data, error }) => {
        if (error || !data) { setNotFound(true); setLoading(false); return; }
        setAnimal(data);

        // Cargar datos del albergue
        const { data: shelterData } = await supabase
          .from('shelters')
          .select('*')
          .eq('id', data.shelter_id)
          .single();
        if (shelterData) setShelter(shelterData);
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

  const ageLabel = animal.age_months != null
    ? animal.age_months < 12 ? `${animal.age_months} meses` : `${Math.floor(animal.age_months / 12)} años`
    : 'Edad desconocida';

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link to="/" className="text-sm text-mist hover:text-forest">← Volver al catálogo</Link>

      <div className="kennel-card mt-4 overflow-hidden pt-6">
        {animal.status === 'urgent' && <span className="status-stamp status-stamp--urgent">Urgente</span>}

        <div className="sm:flex">
          {/* Galería */}
          <div className="w-full sm:w-72 flex-shrink-0 p-4">
            <PhotoGallery
              animalId={animal.id}
              mainImageUrl={animal.main_image_url}
              editable={false}
            />
          </div>

          <div className="p-6">
            <h1 className="text-3xl">{animal.name}</h1>
            <p className="mt-1 text-mist">
              {SPECIES_LABELS[animal.species]}
              {animal.breed ? ` · ${animal.breed}` : ''}
              {animal.size ? ` · ${SIZE_LABELS[animal.size]}` : ''}
            </p>
            <p className="mt-1 font-mono text-sm text-mist">{ageLabel}</p>

            {animal.personality_tags.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {animal.personality_tags.map(tag => (
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

            {animal.bio && (
              <p className="mt-4 text-sm leading-relaxed text-ink">{animal.bio}</p>
            )}

            {/* Albergue */}
            {shelter && (
              <div className="mt-4 flex items-center gap-3 rounded-lg bg-forest/5 px-3 py-2 border border-forest/10">
                {shelter.logo_url ? (
                  <img src={shelter.logo_url} alt={shelter.name} className="h-8 w-8 rounded-full object-cover" />
                ) : (
                  <span className="text-lg">🏠</span>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-mist">Publicado por</p>
                  {shelter.slug ? (
                    <Link to={`/refugio/${shelter.slug}`} className="text-sm font-semibold text-forest hover:underline truncate block">
                      {shelter.name}
                    </Link>
                  ) : (
                    <p className="text-sm font-semibold text-forest truncate">{shelter.name}</p>
                  )}
                </div>
              </div>
            )}

            <Link to={`/animal/${animal.id}/postular`} className="btn-primary mt-6 w-full sm:w-auto inline-flex justify-center">
              Quiero adoptar a {animal.name}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
