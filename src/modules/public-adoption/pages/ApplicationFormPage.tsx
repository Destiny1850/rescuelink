import { useState, type FormEvent, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSubmitApplication } from '../../../hooks/useApplications';
import { HOUSE_TYPES, HOUSE_TYPE_LABELS } from '../../../lib/constants';
import type { HouseTypeEnum, Shelter } from '../../../types/database.types';
import { supabase } from '../../../lib/supabaseClient';

const ANALYTICAL_QUESTIONS = [
  { id: 'experience', label: '¿Has tenido mascotas antes? Cuéntanos tu experiencia.' },
  { id: 'time_alone', label: '¿Cuántas horas al día estaría solo el animal?' },
  { id: 'motivation', label: '¿Por qué quieres adoptar en este momento?' },
];

export function ApplicationFormPage() {
  const { id: animalId } = useParams<{ id: string }>();
  const { submit, submitting } = useSubmitApplication();

  const [animalName, setAnimalName] = useState('');
  const [shelter, setShelter] = useState<Shelter | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [houseType, setHouseType] = useState<HouseTypeEnum>('apartment');
  const [hasOtherPets, setHasOtherPets] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    if (!animalId) return;
    supabase
      .from('animals')
      .select('name, shelter_id')
      .eq('id', animalId)
      .single()
      .then(async ({ data }) => {
        if (data) {
          setAnimalName(data.name);
          const { data: shelterData } = await supabase
            .from('shelters')
            .select('*')
            .eq('id', data.shelter_id)
            .single();
          if (shelterData) setShelter(shelterData);
        }
      });
  }, [animalId]);

  // Construye el mensaje de WhatsApp con todos los datos del formulario
  const buildWhatsAppMessage = (data: Record<string, unknown>) => {
    const lines = [
      `🐾 *Solicitud de adopción — RescueLink*`,
      ``,
      `Animal: *${animalName}*`,
      ``,
      `*Datos del solicitante:*`,
      `• Nombre: ${data.name}`,
      `• Email: ${data.email}`,
      `• Teléfono: ${data.phone || 'No indicado'}`,
      `• Vivienda: ${HOUSE_TYPE_LABELS[data.houseType as HouseTypeEnum]}`,
      `• Otras mascotas: ${data.hasOtherPets ? 'Sí' : 'No'}`,
      ``,
      `*Respuestas:*`,
      ...ANALYTICAL_QUESTIONS.map(q => `• ${q.label}\n  ${(data.answers as Record<string,string>)[q.label] || '—'}`),
      ``,
      `Enviado desde RescueLink 🔗`,
    ];
    return encodeURIComponent(lines.join('\n'));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!shelter?.phone) {
      setError('Este albergue no tiene número de WhatsApp configurado.');
      return;
    }

    const data = { name, email, phone, houseType, hasOtherPets, answers };
    setFormData(data);
    setShowModal(true);
  };

  const handleConfirm = async () => {
    if (!animalId || !formData) return;

    // 1. Guardar en BD como respaldo
    await submit({
      animal_id: animalId,
      applicant_name: formData.name as string,
      applicant_email: formData.email as string,
      applicant_phone: (formData.phone as string) || null,
      house_type: formData.houseType as HouseTypeEnum,
      has_other_pets: formData.hasOtherPets as boolean,
      answers_json: formData.answers as Record<string, unknown>,
    });

    // 2. Abrir WhatsApp con mensaje prearmado
    const phoneClean = shelter!.phone!.replace(/\D/g, '');
    const message = buildWhatsAppMessage(formData);
    window.open(`https://wa.me/${phoneClean}?text=${message}`, '_blank');

    setShowModal(false);
  };

  // Si el albergue no tiene teléfono, mostrar advertencia
  const noPhone = shelter !== null && !shelter.phone;

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <Link to={`/animal/${animalId}`} className="text-sm text-mist hover:text-forest">
        ← Volver a la ficha
      </Link>

      <h1 className="mt-3 text-2xl">Formulario de adopción</h1>
      <p className="mt-1 text-sm text-mist">
        Responde con sinceridad — ayuda al albergue a encontrar el mejor hogar para cada animal.
      </p>

      {/* Advertencia si no hay teléfono */}
      {noPhone && (
        <div className="mt-4 rounded-lg bg-rescue/10 border border-rescue/20 px-4 py-3">
          <p className="text-sm font-semibold text-rescue">⚠️ Albergue sin WhatsApp configurado</p>
          <p className="mt-1 text-xs text-rescue/80">
            Este albergue aún no ha registrado su número de WhatsApp. Por favor contáctalos directamente a través de sus redes sociales.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="kennel-card mt-6 space-y-4 p-6 pt-8">
        <div>
          <label htmlFor="name" className="label-field">Nombre completo</label>
          <input id="name" required value={name} onChange={(e) => setName(e.target.value)} className="input-field" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="email" className="label-field">Correo</label>
            <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="input-field" />
          </div>
          <div>
            <label htmlFor="phone" className="label-field">Teléfono</label>
            <input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} className="input-field" />
          </div>
        </div>

        <div>
          <label htmlFor="houseType" className="label-field">Tipo de vivienda</label>
          <select id="houseType" value={houseType} onChange={(e) => setHouseType(e.target.value as HouseTypeEnum)} className="input-field">
            {HOUSE_TYPES.map((t) => (
              <option key={t} value={t}>{HOUSE_TYPE_LABELS[t]}</option>
            ))}
          </select>
        </div>

        <label className="flex items-center gap-2 text-sm text-ink">
          <input
            type="checkbox"
            checked={hasOtherPets}
            onChange={(e) => setHasOtherPets(e.target.checked)}
            className="h-4 w-4 rounded border-mist/40 text-forest focus:ring-forest"
          />
          Ya tengo otras mascotas en casa
        </label>

        <div className="space-y-4 border-t border-ink/5 pt-4">
          {ANALYTICAL_QUESTIONS.map((q) => (
            <div key={q.id}>
              <label htmlFor={q.id} className="label-field">{q.label}</label>
              <textarea
                id={q.id}
                rows={2}
                required
                value={answers[q.label] ?? ''}
                onChange={(e) => setAnswers((prev) => ({ ...prev, [q.label]: e.target.value }))}
                className="input-field"
              />
            </div>
          ))}
        </div>

        {error && (
          <p role="alert" className="rounded-md bg-rescue/10 px-3 py-2 text-sm text-rescue">{error}</p>
        )}

        <button
          type="submit"
          disabled={submitting || noPhone}
          className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {noPhone ? 'Albergue sin WhatsApp configurado' : 'Continuar con la solicitud'}
        </button>
      </form>

      {/* Modal de advertencia */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 px-4">
          <div className="kennel-card w-full max-w-md p-6 pt-8">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gold/10 text-2xl">
                ℹ️
              </div>
              <h2 className="font-display text-xl text-forest">Antes de continuar</h2>
              <p className="mt-3 text-sm leading-relaxed text-mist">
                Cada albergue es autónomo y tiene sus propias condiciones y parámetros de adopción.
                Al continuar serás redirigido al WhatsApp del albergue para proseguir el proceso de adopción directamente con ellos.
              </p>
              <p className="mt-2 text-xs text-mist/70">
                Tu solicitud también quedará registrada en RescueLink como respaldo.
              </p>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="btn-secondary flex-1"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirm}
                disabled={submitting}
                className="btn-primary flex-1"
              >
                {submitting ? 'Procesando…' : 'Ir a WhatsApp →'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
