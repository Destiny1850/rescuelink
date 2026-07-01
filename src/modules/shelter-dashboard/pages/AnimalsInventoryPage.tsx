import { useState } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { useShelterAnimals } from '../../../hooks/useAnimals';
import { AnimalTable } from '../components/AnimalTable';
import { AnimalFormModal } from '../components/AnimalFormModal';
import { Spinner } from '../../../components/ui/Spinner';
import type { Animal } from '../../../types/database.types';

export function AnimalsInventoryPage() {
  const { user } = useAuth();
  const { animals, loading, error, createAnimal, updateAnimal, setAnimalStatus, deleteAnimal } =
    useShelterAnimals(user?.id);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingAnimal, setEditingAnimal] = useState<Animal | null>(null);

  const openCreateModal = () => {
    setEditingAnimal(null);
    setModalOpen(true);
  };

  const openEditModal = (animal: Animal) => {
    setEditingAnimal(animal);
    setModalOpen(true);
  };

  const handleSubmit = (payload: Partial<Animal>) => {
    if (editingAnimal) {
      return updateAnimal(editingAnimal.id, payload);
    }
    return createAnimal(payload as Omit<Animal, 'id' | 'created_at' | 'updated_at'>);
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl">Inventario de animales</h1>
          <p className="mt-1 text-sm text-mist">
            {animals.length} {animals.length === 1 ? 'animal registrado' : 'animales registrados'}
          </p>
        </div>
        <button onClick={openCreateModal} className="btn-primary">
          + Agregar animal
        </button>
      </div>

      {error && <p className="mt-4 rounded-md bg-rescue/10 px-3 py-2 text-sm text-rescue">{error}</p>}

      {loading ? (
        <Spinner label="Cargando inventario…" />
      ) : (
        <AnimalTable
          animals={animals}
          onEdit={openEditModal}
          onDelete={deleteAnimal}
          onStatusChange={setAnimalStatus}
        />
      )}

      {modalOpen && user && (
        <AnimalFormModal
          shelterId={user.id}
          animal={editingAnimal}
          onClose={() => setModalOpen(false)}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}
