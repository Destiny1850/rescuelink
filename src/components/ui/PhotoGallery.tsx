import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import type { AnimalPhoto } from '../../types/database.types';

interface PhotoGalleryProps {
  animalId: string;
  mainImageUrl: string | null;
  editable?: boolean; // true en el dashboard, false en el catálogo público
  shelterId?: string;
}

export function PhotoGallery({ animalId, mainImageUrl, editable = false, shelterId }: PhotoGalleryProps) {
  const [photos, setPhotos] = useState<AnimalPhoto[]>([]);
  const [selected, setSelected] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [lightbox, setLightbox] = useState(false);

  // La foto principal siempre va primero como foto "virtual"
  const allPhotos = [
    ...(mainImageUrl ? [{ id: 'main', url: mainImageUrl, position: -1, animal_id: animalId, created_at: '' }] : []),
    ...photos,
  ];

  useEffect(() => {
    supabase
      .from('animal_photos')
      .select('*')
      .eq('animal_id', animalId)
      .order('position')
      .then(({ data }) => setPhotos(data ?? []));
  }, [animalId]);

  const handleUpload = async (file: File) => {
    if (!shelterId) return;
    setUploading(true);

    const path = `${shelterId}/${animalId}/${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from('animal-photos')
      .upload(path, file, { cacheControl: '3600' });

    if (uploadError) { setUploading(false); return; }

    const { data } = supabase.storage.from('animal-photos').getPublicUrl(path);

    const { data: newPhoto } = await supabase
      .from('animal_photos')
      .insert({ animal_id: animalId, url: data.publicUrl, position: photos.length })
      .select()
      .single() as { data: AnimalPhoto | null };

    if (newPhoto) setPhotos(prev => [...prev, newPhoto]);
    setUploading(false);
  };

  const handleDelete = async (photo: AnimalPhoto) => {
    await supabase.from('animal_photos').delete().eq('id', photo.id);
    setPhotos(prev => prev.filter(p => p.id !== photo.id));
    if (selected >= allPhotos.length - 1) setSelected(0);
  };

  if (allPhotos.length === 0) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-lg bg-mist/10 text-4xl">
        🐾
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Foto principal grande */}
      <div
        className="relative aspect-square cursor-zoom-in overflow-hidden rounded-lg bg-mist/10"
        onClick={() => setLightbox(true)}
      >
        <img
          src={allPhotos[selected]?.url}
          alt="Foto del animal"
          className="h-full w-full object-cover transition-transform hover:scale-105"
        />
        {allPhotos.length > 1 && (
          <div className="absolute bottom-2 right-2 rounded-full bg-ink/50 px-2 py-0.5 text-xs text-paper">
            {selected + 1} / {allPhotos.length}
          </div>
        )}
      </div>

      {/* Miniaturas */}
      {allPhotos.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {allPhotos.map((photo, i) => (
            <button
              key={photo.id}
              onClick={() => setSelected(i)}
              className={`relative flex-shrink-0 overflow-hidden rounded-md border-2 transition-all ${
                i === selected ? 'border-forest' : 'border-transparent opacity-60 hover:opacity-100'
              }`}
            >
              <img src={photo.url} alt="" className="h-16 w-16 object-cover" />
              {editable && photo.id !== 'main' && (
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(photo as AnimalPhoto); }}
                  className="absolute right-0 top-0 flex h-5 w-5 items-center justify-center bg-rescue/80 text-white text-xs"
                >
                  ×
                </button>
              )}
            </button>
          ))}

          {/* Botón agregar foto */}
          {editable && photos.length < 4 && (
            <label className="flex h-16 w-16 flex-shrink-0 cursor-pointer items-center justify-center rounded-md border-2 border-dashed border-mist/40 text-mist hover:border-forest hover:text-forest transition-colors">
              {uploading ? '…' : '+'}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={uploading}
                onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
              />
            </label>
          )}
        </div>
      )}

      {/* Botón agregar si no hay fotos extra aún */}
      {editable && photos.length === 0 && (
        <label className="flex cursor-pointer items-center gap-2 text-sm text-mist hover:text-forest">
          <input
            type="file"
            accept="image/*"
            className="hidden"
            disabled={uploading}
            onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
          />
          {uploading ? 'Subiendo…' : '+ Agregar más fotos (máx. 4)'}
        </label>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/90 p-4"
          onClick={() => setLightbox(false)}
        >
          <img
            src={allPhotos[selected]?.url}
            alt="Foto ampliada"
            className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={() => setLightbox(false)}
            className="absolute right-4 top-4 text-paper text-2xl hover:text-mist"
          >
            ×
          </button>
          {allPhotos.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); setSelected(i => (i - 1 + allPhotos.length) % allPhotos.length); }}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-paper text-3xl hover:text-mist"
              >
                ‹
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setSelected(i => (i + 1) % allPhotos.length); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-paper text-3xl hover:text-mist"
              >
                ›
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
