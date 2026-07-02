import { useState, useEffect, type FormEvent } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { supabase } from '../../../lib/supabaseClient';
import type { Shelter } from '../../../types/database.types';

const APP_URL = 'https://rescuelink-pearl.vercel.app';

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function ShelterProfileEditPage() {
  const { user } = useAuth();
  const [shelter, setShelter] = useState<Partial<Shelter>>({});
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    supabase.from('shelters').select('*').eq('id', user.id).single()
      .then(({ data }) => { if (data) setShelter(data); });
  }, [user?.id]);

  const handleLogoUpload = async (file: File) => {
    if (!user?.id) return;
    setUploadingLogo(true);
    const path = `${user.id}/logo-${Date.now()}.${file.name.split('.').pop()}`;
    const { error: uploadError } = await supabase.storage
      .from('animal-photos')
      .upload(path, file, { upsert: true });

    if (uploadError) { setUploadingLogo(false); return; }
    const { data } = supabase.storage.from('animal-photos').getPublicUrl(path);
    setShelter(prev => ({ ...prev, logo_url: data.publicUrl }));
    setUploadingLogo(false);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;
    setSaving(true);
    setError(null);
    setSuccess(false);

    // Generar slug si no existe
    const slug = shelter.slug || slugify(shelter.name ?? '');

    const { id, created_at, ...updatePayload } = shelter as Required<typeof shelter>;
    const { error: updateError } = await supabase
      .from('shelters')
      .update({ ...updatePayload, slug })
      .eq('id', user.id);

    setSaving(false);
    if (updateError) {
      setError(updateError.message.includes('unique') 
        ? 'Ese nombre de URL ya está en uso. Cambia el nombre del albergue o el slug.'
        : updateError.message);
    } else {
      setShelter(prev => ({ ...prev, slug }));
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    }
  };

  const profileUrl = `${APP_URL}/refugio/${shelter.slug || '...'}`;

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl">Perfil público del albergue</h1>
      <p className="mt-1 text-sm text-mist">
        Esta página es pública — compártela en redes sociales para que más personas conozcan tus animales.
      </p>

      {/* Preview de URL */}
      {shelter.slug && (
        <div className="mt-4 flex items-center gap-3 rounded-lg bg-forest/5 border border-forest/20 px-4 py-3">
          <span className="text-xs font-mono text-forest truncate">{profileUrl}</span>
          <a
            href={profileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 text-xs font-semibold text-forest hover:underline"
          >
            Ver →
          </a>
        </div>
      )}

      <form onSubmit={handleSubmit} className="kennel-card mt-6 space-y-5 p-6 pt-8">

        {/* Logo */}
        <div>
          <label className="label-field">Logo del albergue</label>
          <div className="flex items-center gap-4">
            {shelter.logo_url ? (
              <img src={shelter.logo_url} alt="Logo" className="h-16 w-16 rounded-full object-cover border border-mist/30" />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-forest/10 text-2xl">🐾</div>
            )}
            <label className="btn-secondary cursor-pointer text-sm">
              {uploadingLogo ? 'Subiendo…' : 'Cambiar logo'}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={uploadingLogo}
                onChange={(e) => e.target.files?.[0] && handleLogoUpload(e.target.files[0])}
              />
            </label>
          </div>
        </div>

        {/* Nombre */}
        <div>
          <label htmlFor="name" className="label-field">Nombre del albergue</label>
          <input
            id="name"
            value={shelter.name ?? ''}
            onChange={(e) => setShelter(prev => ({ ...prev, name: e.target.value }))}
            className="input-field"
            required
          />
        </div>

        {/* Biografía */}
        <div>
          <label htmlFor="bio" className="label-field">Descripción / historia</label>
          <textarea
            id="bio"
            rows={4}
            value={shelter.bio ?? ''}
            onChange={(e) => setShelter(prev => ({ ...prev, bio: e.target.value }))}
            className="input-field"
            placeholder="Cuéntanos sobre tu albergue, su historia y misión…"
          />
        </div>

        {/* Ubicación y teléfono */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="location" className="label-field">Ubicación</label>
            <input
              id="location"
              value={shelter.location ?? ''}
              onChange={(e) => setShelter(prev => ({ ...prev, location: e.target.value }))}
              className="input-field"
              placeholder="Ciudad, País"
            />
          </div>
          <div>
            <label htmlFor="phone" className="label-field">Teléfono</label>
            <input
              id="phone"
              value={shelter.phone ?? ''}
              onChange={(e) => setShelter(prev => ({ ...prev, phone: e.target.value }))}
              className="input-field"
              placeholder="+58 414 000 0000"
            />
          </div>
        </div>

        {/* Redes sociales */}
        <div>
          <p className="label-field mb-3">Redes sociales</p>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-8 text-center text-lg">📷</span>
              <input
                value={shelter.instagram ?? ''}
                onChange={(e) => setShelter(prev => ({ ...prev, instagram: e.target.value }))}
                className="input-field"
                placeholder="@tualbergue"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="w-8 text-center text-lg">👥</span>
              <input
                value={shelter.facebook ?? ''}
                onChange={(e) => setShelter(prev => ({ ...prev, facebook: e.target.value }))}
                className="input-field"
                placeholder="https://facebook.com/tualbergue"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="w-8 text-center text-lg">🌐</span>
              <input
                value={shelter.website ?? ''}
                onChange={(e) => setShelter(prev => ({ ...prev, website: e.target.value }))}
                className="input-field"
                placeholder="https://tualbergue.org"
              />
            </div>
          </div>
        </div>

        {error && <p role="alert" className="rounded-md bg-rescue/10 px-3 py-2 text-sm text-rescue">{error}</p>}
        {success && <p className="rounded-md bg-forest/10 px-3 py-2 text-sm text-forest">✓ Perfil actualizado correctamente</p>}

        <button type="submit" disabled={saving} className="btn-primary w-full">
          {saving ? 'Guardando…' : 'Guardar perfil'}
        </button>
      </form>
    </div>
  );
}
