import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { AdoptionApplication, ApplicationStatusEnum } from '../types/database.types';

type NewApplication = Omit<AdoptionApplication, 'id' | 'created_at' | 'updated_at' | 'status'>;

/**
 * Envío del formulario público de adopción (Módulo B).
 * RLS permite INSERT a `anon` sin necesidad de cuenta.
 */
export function useSubmitApplication() {
  const [submitting, setSubmitting] = useState(false);

  const submit = async (payload: NewApplication) => {
    setSubmitting(true);
    const { error } = await supabase.from('adoption_applications').insert(payload);
    setSubmitting(false);
    return { error: error?.message ?? null };
  };

  return { submit, submitting };
}

/**
 * Bandeja de solicitudes entrantes en el dashboard del albergue (Módulo A).
 * Trae también el nombre del animal asociado (join) para no hacer N+1 queries.
 */
export interface ApplicationWithAnimal extends AdoptionApplication {
  animals: { name: string; main_image_url: string | null } | null;
}

export function useShelterApplications() {
  const [applications, setApplications] = useState<ApplicationWithAnimal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    // RLS ya filtra automáticamente: solo llegan solicitudes de animales
    // cuyo shelter_id = auth.uid(), sin necesidad de un .eq() manual aquí.
    const { data, error: fetchError } = await supabase
      .from('adoption_applications')
      .select('*, animals(name, main_image_url)')
      .order('created_at', { ascending: false });

    if (fetchError) setError(fetchError.message);
    setApplications((data as ApplicationWithAnimal[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  /**
   * Cambia el estado de una solicitud. Dispara el email al adoptante
   * a través de la Edge Function `notify-application-status` (Módulo C).
   */
  const updateStatus = async (id: string, status: ApplicationStatusEnum) => {
    const { error: updateError } = await supabase
      .from('adoption_applications')
      .update({ status })
      .eq('id', id);

    if (updateError) return { error: updateError.message };

    supabase.functions
      .invoke('notify-application-status', { body: { application_id: id, new_status: status } })
      .catch(() => {
        // Best-effort: el estado ya quedó guardado aunque el email falle
      });

    await fetchApplications();
    return { error: null };
  };

  return { applications, loading, error, updateStatus, refetch: fetchApplications };
}
