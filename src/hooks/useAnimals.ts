import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { Animal, AnimalStatusEnum, Database } from '../types/database.types';
import type { AnimalSpecies, AnimalSize } from '../lib/constants';

type AnimalUpdate = Database['public']['Tables']['animals']['Update'];

export interface AnimalFilters {
  species?: AnimalSpecies;
  size?: AnimalSize;
  status?: AnimalStatusEnum;
  onlyUrgent?: boolean;
}

/**
 * Catálogo público de animales (usado por el Módulo B).
 * No requiere sesión: RLS permite SELECT a `anon`.
 */
export function useAnimalsCatalog(filters: AnimalFilters = {}) {
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnimals = useCallback(async () => {
    setLoading(true);
    setError(null);

    let query = supabase.from('animals').select('*').order('created_at', { ascending: false });

    if (filters.species) query = query.eq('species', filters.species);
    if (filters.size) query = query.eq('size', filters.size);
    if (filters.onlyUrgent) {
      query = query.eq('status', 'urgent');
    } else if (filters.status) {
      query = query.eq('status', filters.status);
    } else {
      // Por defecto el catálogo público no muestra animales ya adoptados
      query = query.neq('status', 'adopted');
    }

    const { data, error: fetchError } = await query;

    if (fetchError) setError(fetchError.message);
    setAnimals(data ?? []);
    setLoading(false);
  }, [filters.species, filters.size, filters.status, filters.onlyUrgent]);

  useEffect(() => {
    fetchAnimals();
  }, [fetchAnimals]);

  return { animals, loading, error, refetch: fetchAnimals };
}

/**
 * CRUD del dashboard del albergue (Módulo A).
 * Requiere sesión: RLS solo permite insert/update/delete si shelter_id = auth.uid().
 */
export function useShelterAnimals(shelterId: string | undefined) {
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnimals = useCallback(async () => {
    if (!shelterId) return;
    setLoading(true);
    const { data, error: fetchError } = await supabase
      .from('animals')
      .select('*')
      .eq('shelter_id', shelterId)
      .order('created_at', { ascending: false });

    if (fetchError) setError(fetchError.message);
    setAnimals(data ?? []);
    setLoading(false);
  }, [shelterId]);

  useEffect(() => {
    fetchAnimals();
  }, [fetchAnimals]);

  const createAnimal = async (payload: Omit<Animal, 'id' | 'created_at' | 'updated_at'>) => {
    const { error: insertError } = await supabase.from('animals').insert(payload);
    if (insertError) return { error: insertError.message };
    await fetchAnimals();
    return { error: null };
  };

  const updateAnimal = async (id: string, payload: AnimalUpdate) => {
    const { error: updateError } = await supabase.from('animals').update(payload).eq('id', id);
    if (updateError) return { error: updateError.message };
    await fetchAnimals();
    return { error: null };
  };

  /**
   * Cambia el estado de un animal. Cuando el nuevo estado es 'urgent',
   * dispara la Edge Function que notifica por Telegram (ver Módulo C).
   * El fallo de la notificación NO revierte el cambio de estado: la
   * actualización del inventario es la fuente de verdad, la notificación
   * es un efecto secundario best-effort.
   */
  const setAnimalStatus = async (id: string, status: AnimalStatusEnum) => {
    const result = await updateAnimal(id, { status });
    if (!result.error && status === 'urgent') {
      supabase.functions.invoke('notify-urgent-animal', { body: { animal_id: id } }).catch(() => {
        // Silencioso a propósito: ver Módulo C para logging centralizado
      });
    }
    return result;
  };

  const deleteAnimal = async (id: string) => {
    const { error: deleteError } = await supabase.from('animals').delete().eq('id', id);
    if (deleteError) return { error: deleteError.message };
    await fetchAnimals();
    return { error: null };
  };

  return { animals, loading, error, createAnimal, updateAnimal, setAnimalStatus, deleteAnimal, refetch: fetchAnimals };
}
