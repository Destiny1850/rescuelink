import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../../../lib/supabaseClient';
import type { Animal, Shelter } from '../../../types/database.types';
import { AnimalCard } from '../../public-adoption/components/AnimalCard';
import { Spinner } from '../../../components/ui/Spinner';

export function ShelterProfilePage() {
  const { slug } = useParams<{ slug: string }>();
  const [shelter, setShelter] = useState<Shelter | null>(null);
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);

    supabase
      .from('shelters')
      .select('*')
      .eq('slug', slug)
      .single()
      .then(async ({ data: shelterData, error }) => {
        if (error || !shelterData) { setNotFound(true); setLoading(false); return; }
        setShelter(shelterData);

        const { data: animalsData } = await supabase
          .from('animals')
          .select('*')
          .eq('shelter_id', shelterData.id)
          .neq('status', 'adopted')
          .order('status', { ascending: false }) // urgentes primero
          .order('created_at', { ascending: false });

        setAnimals(animalsData ?? []);
        setLoading(false);
      });
  }, [slug]);

  if (loading) return <Spinner label="Cargando perfil del albergue…" />;

  if (notFound || !shelter) {
    return (
      <div className="py-20 text-center text-mist">
        <p className="font-display text-xl text-forest">Albergue no encontrado</p>
        <Link to="/" className="mt-3 inline-block text-forest underline">Ver todos los animales</Link>
      </div>
    );
  }

  const urgentCount = animals.filter(a => a.status === 'urgent').length;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">

      {/* Hero del albergue */}
      <div className="kennel-card overflow-hidden pt-6">
        {/* Banner de color */}
        <div className="h-32 bg-gradient-to-r from-forest to-moss" />

        <div className="relative px-6 pb-6">
          {/* Logo */}
          <div className="-mt-12 mb-4">
            {shelter.logo_url ? (
              <img
                src={shelter.logo_url}
                alt={shelter.name}
                className="h-24 w-24 rounded-full border-4 border-white object-cover shadow-card"
              />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-white bg-forest shadow-card text-3xl">
                🐾
              </div>
            )}
          </div>

          <div className="sm:flex sm:items-start sm:justify-between">
            <div>
              <h1 className="text-2xl">{shelter.name}</h1>
              {shelter.location && (
                <p className="mt-1 flex items-center gap-1 text-sm text-mist">
                  📍 {shelter.location}
                </p>
              )}
            </div>

            {/* Redes sociales */}
            <div className="mt-3 flex gap-3 sm:mt-0">
              {shelter.instagram && (
                <a
                  href={`https://instagram.com/${shelter.instagram.replace('@','')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary !py-1.5 text-xs"
                >
                  Instagram
                </a>
              )}
              {shelter.facebook && (
                <a
                  href={shelter.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary !py-1.5 text-xs"
                >
                  Facebook
                </a>
              )}
              {shelter.website && (
                <a
                  href={shelter.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary !py-1.5 text-xs"
                >
                  Sitio web
                </a>
              )}
            </div>
          </div>

          {shelter.bio && (
            <p className="mt-4 text-sm leading-relaxed text-mist">{shelter.bio}</p>
          )}

          {/* Stats rápidos */}
          <div className="mt-4 flex gap-6 border-t border-ink/5 pt-4">
            <div className="text-center">
              <p className="font-display text-xl font-bold text-forest">{animals.length}</p>
              <p className="text-xs text-mist">en adopción</p>
            </div>
            {urgentCount > 0 && (
              <div className="text-center">
                <p className="font-display text-xl font-bold text-rescue">{urgentCount}</p>
                <p className="text-xs text-mist">urgentes</p>
              </div>
            )}
            {shelter.phone && (
  <div className="ml-auto text-right">
    <a
      href={`tel:${shelter.phone}`}
      className="btn-primary !py-1.5 text-xs"
    >
      📞 Contactar
    </a>
    <p className="mt-1 font-mono text-xs text-mist">{shelter.phone}</p>
  </div>
)}
          </div>
        </div>
      </div>

      {/* Catálogo de animales */}
      <div className="mt-8">
        <h2 className="font-display text-xl text-forest">
          Animales en adopción
        </h2>

        {animals.length === 0 ? (
          <div className="kennel-card mt-4 p-10 text-center text-mist">
            <p className="font-display text-lg text-forest">No hay animales disponibles en este momento</p>
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {animals.map(animal => (
              <AnimalCard key={animal.id} animal={animal} />
            ))}
          </div>
        )}
      </div>

      <div className="mt-8 text-center">
        <Link to="/" className="text-sm text-mist hover:text-forest">
          ← Ver todos los animales en adopción
        </Link>
      </div>
    </div>
  );
}
