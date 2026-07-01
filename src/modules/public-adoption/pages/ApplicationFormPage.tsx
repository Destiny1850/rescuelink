import { useState, type FormEvent } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSubmitApplication } from '../../../hooks/useApplications';
import { HOUSE_TYPES, HOUSE_TYPE_LABELS } from '../../../lib/constants';
import type { HouseTypeEnum } from '../../../types/database.types';

// Preguntas adicionales del formulario analítico. Se guardan libremente en
// answers_json, así que agregar/quitar preguntas aquí no requiere migración.
const ANALYTICAL_QUESTIONS = [
  { id: 'experience', label: '¿Has tenido mascotas antes? Cuéntanos tu experiencia.' },
  { id: 'time_alone', label: '¿Cuántas horas al día estaría solo el animal?' },
  { id: 'motivation', label: '¿Por qué quieres adoptar en este momento?' },
];

export function ApplicationFormPage() {
  const { id: animalId } = useParams<{ id: string }>();
  const { submit, submitting } = useSubmitApplication();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [houseType, setHouseType] = useState<HouseTypeEnum>('apartment');
  const [hasOtherPets, setHasOtherPets] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!animalId) return;

    const { error: submitError } = await submit({
      animal_id: animalId,
      applicant_name: name,
      applicant_email: email,
      applicant_phone: phone || null,
      house_type: houseType,
      has_other_pets: hasOtherPets,
      answers_json: answers,
    });

    if (submitError) setError(submitError);
    else setSuccess(true);
  };

  if (success) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <h1 className="text-2xl text-forest">¡Solicitud enviada!</h1>
        <p className="mt-2 text-mist">
          El albergue revisará tu postulación y se pondrá en contacto contigo a {email}.
        </p>
        <Link to="/" className="btn-primary mt-6 inline-flex">Seguir explorando</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <Link to={`/animal/${animalId}`} className="text-sm text-mist hover:text-forest">← Volver a la ficha</Link>

      <h1 className="mt-3 text-2xl">Formulario de adopción</h1>
      <p className="mt-1 text-sm text-mist">
        Responde con sinceridad: ayuda al albergue a encontrar el mejor hogar para cada animal.
      </p>

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
          <input type="checkbox" checked={hasOtherPets} onChange={(e) => setHasOtherPets(e.target.checked)} className="h-4 w-4 rounded border-mist/40 text-forest focus:ring-forest" />
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

        {error && <p role="alert" className="rounded-md bg-rescue/10 px-3 py-2 text-sm text-rescue">{error}</p>}

        <button type="submit" disabled={submitting} className="btn-primary w-full">
          {submitting ? 'Enviando…' : 'Enviar solicitud'}
        </button>
      </form>
    </div>
  );
}
