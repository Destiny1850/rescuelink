import { useState } from 'react';
import { useAnimalsCatalog, type AnimalFilters } from '../../../hooks/useAnimals';
import { AnimalCard } from '../components/AnimalCard';
import { FilterBar } from '../components/FilterBar';
import { Spinner } from '../../../components/ui/Spinner';

export function CatalogPage() {
  const [filters, setFilters] = useState<AnimalFilters>({});
  const { animals, loading, error } = useAnimalsCatalog(filters);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="text-center">
        <h1 className="text-3xl sm:text-4xl">Tu próximo compañero te está esperando</h1>
        <p className="mx-auto mt-2 max-w-md text-mist">
          Animales reales, de albergues locales, listos para un hogar.
        </p>
      </div>

      <div className="mt-6 flex justify-center">
        <FilterBar filters={filters} onChange={setFilters} />
      </div>

      {error && <p className="mt-6 text-center text-rescue">{error}</p>}

      {loading ? (
        <Spinner label="Buscando animales…" />
      ) : animals.length === 0 ? (
        <div className="mt-12 text-center text-mist">
          <p className="font-display text-lg text-forest">No encontramos animales con esos filtros</p>
          <p className="mt-1 text-sm">Prueba quitando alguno de los filtros activos.</p>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {animals.map((animal) => (
            <AnimalCard key={animal.id} animal={animal} />
          ))}
        </div>
      )}
    </div>
  );
}
