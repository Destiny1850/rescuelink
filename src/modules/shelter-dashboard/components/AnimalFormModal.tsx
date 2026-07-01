import { useState, type FormEvent } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import type { Animal } from '../../../types/database.types';
import {
  ANIMAL_SPECIES,
  ANIMAL_SIZES,
  SPECIES_LABELS,
  SIZE_LABELS,
  SUGGESTED_PERSONALITY_TAGS,
} from '../../../lib/constants';

interface AnimalFormModalProps {
  shelterId: string;
  animal: Animal | null; // null = modo creación
  onClose: () => void;
  onSubmit: (payload: Partial<Animal>) => Promise<{ error: string | null }>;
}

export function AnimalFormModal({ shelterId, animal, onClose, onSubmit }: AnimalFormModalProps) {
  const [name, setName] = useState(animal?.name ?? '');
  const [species, setSpecies] = useState(animal?.species ?? 'dog');
  const [breed, setBreed] = useState(animal?.breed ?? '');
  const [ageMonths, setAgeMonths] = useState(animal?.age_months?.toString() ?? '');
  const [size, setSize] = useState(animal?.size ?? 'medium');
  const [healthStatus, setHealthStatus] = useState(animal?.health_status ?? '');
  const [bio, setBio] = useState(animal?.bio ?? '');
  const [tags, setTags] = useState<string[]>(animal?.personality_tags ?? []);
  const [imageUrl, setImageUrl] = useState(animal?.main_image_url ?? '');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleTag = (tag: string) => {
    setTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  };

  const handleImageUpload = async (file: File) => {
    setUploading(true);
    setError(null);

    // Ruta con prefijo shelterId: coincide con la política RLS de Storage
    // (storage.foldername(name)[1] = auth.uid()::text)
    const path = `${shelterId}/${Date.now()}-${file.name}`;

    const { error: uploadError } = await supabase.storage
      .from('animal-photos')
      .upload(path, file, { upsert: false, cacheControl: '3600' });

    if (uploadError) {
      setError(`No se pudo subir la imagen: ${uploadError.message}`);
      setUploading(false);
      return;
    }

    const { data } = supabase.storage.from('animal-photos').getPublicUrl(path);
    setImageUrl(data.publicUrl);
    setUploading(false);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const { error: submitError } = await onSubmit({
      shelter_id: shelterId,
      name,
      species,
      breed: breed || null,
      age_months: ageMonths ? Number(ageMonths) : null,
      size,
      health_status: healthStatus || null,
      personality_tags: tags,
      bio: bio || null,
      main_image_url: imageUrl || null,
    });

    setSaving(false);
    if (submitError) {
      setError(submitError);
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4 py-8" role="dialog" aria-modal="true">
      <div className="kennel-card w-full max-w-lg overflow-y-auto p-6 pt-8 max-h-[90vh]">
        <h2 className="text-xl">{animal ? `Editar a ${animal.name}` : 'Nueva ficha de animal'}</h2>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Foto */}
          <div>
            <label className="label-field">Foto principal</label>
            <div className="flex items-center gap-4">
              <img
                src={imageUrl || '/icons/icon-192.png'}
                alt="Vista previa"
                className="h-16 w-16 rounded-full border border-mist/30 object-cover"
              />
              <input
                type="file"
                accept="image/*"
                disabled={uploading}
                onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
                className="text-xs text-mist"
              />
            </div>
            {uploading && <p className="mt-1 text-xs text-mist">Subiendo…</p>}
          </div>

          <div>
            <label htmlFor="name" className="label-field">Nombre</label>
            <input id="name" required value={name} onChange={(e) => setName(e.target.value)} className="input-field" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="species" className="label-field">Especie</label>
              <select id="species" value={species} onChange={(e) => setSpecies(e.target.value as typeof species)} className="input-field">
                {ANIMAL_SPECIES.map((s) => (
                  <option key={s} value={s}>{SPECIES_LABELS[s]}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="size" className="label-field">Tamaño</label>
              <select id="size" value={size} onChange={(e) => setSize(e.target.value as typeof size)} className="input-field">
                {ANIMAL_SIZES.map((s) => (
                  <option key={s} value={s}>{SIZE_LABELS[s]}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="breed" className="label-field">Raza</label>
              <input id="breed" value={breed} onChange={(e) => setBreed(e.target.value)} className="input-field" placeholder="Mestizo, Labrador…" />
            </div>
            <div>
              <label htmlFor="age" className="label-field">Edad (meses)</label>
              <input id="age" type="number" min={0} value={ageMonths} onChange={(e) => setAgeMonths(e.target.value)} className="input-field" />
            </div>
          </div>

          <div>
            <label htmlFor="health" className="label-field">Estado de salud</label>
            <input
              id="health"
              value={healthStatus}
              onChange={(e) => setHealthStatus(e.target.value)}
              className="input-field"
              placeholder="Vacunado, esterilizado, en tratamiento…"
            />
          </div>

          <div>
            <span className="label-field">Personalidad</span>
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_PERSONALITY_TAGS.map((tag) => (
                <button
                  type="button"
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                    tags.includes(tag)
                      ? 'border-forest bg-forest text-paper'
                      : 'border-mist/30 text-mist hover:border-forest/50'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="bio" className="label-field">Historia / biografía</label>
            <textarea id="bio" rows={3} value={bio} onChange={(e) => setBio(e.target.value)} className="input-field" />
          </div>

          {error && <p role="alert" className="rounded-md bg-rescue/10 px-3 py-2 text-sm text-rescue">{error}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">Cancelar</button>
            <button type="submit" disabled={saving || uploading} className="btn-primary">
              {saving ? 'Guardando…' : 'Guardar ficha'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
