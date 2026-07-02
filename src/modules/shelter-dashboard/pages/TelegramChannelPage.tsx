import { useState, useEffect } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { supabase } from '../../../lib/supabaseClient';

// Nombre de usuario del bot — cámbialo por el tuyo
const BOT_USERNAME = 'TU_BOT_USERNAME';
const APP_URL = 'https://rescuelink-pearl.vercel.app';

export function TelegramChannelPage() {
  const { user } = useAuth();
  const [shelterName, setShelterName] = useState('');
  const [subscriberCount, setSubscriberCount] = useState(0);
  const [copied, setCopied] = useState(false);

  const telegramLink = `https://t.me/${BOT_USERNAME}?start=${user?.id}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(telegramLink)}&color=2F4538&bgcolor=F3ECE0`;

  useEffect(() => {
    if (!user?.id) return;

    // Cargar nombre del albergue
    supabase
      .from('shelters')
      .select('name')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        if (data) setShelterName(data.name);
      });

    // Contar suscriptores
    supabase
      .from('telegram_subscribers')
      .select('id', { count: 'exact' })
      .eq('shelter_id', user.id)
      .then(({ count }) => {
        setSubscriberCount(count ?? 0);
      });
  }, [user?.id]);

  const handleCopy = () => {
    navigator.clipboard.writeText(telegramLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl">Canal de Telegram</h1>
      <p className="mt-1 text-sm text-mist">
        Comparte tu link o QR para que personas interesadas reciban alertas automáticas cuando tengas animales urgentes.
      </p>

      {/* Contador de suscriptores */}
      <div className="mt-6 grid grid-cols-2 gap-4">
        <div className="kennel-card p-5 pt-7 text-center">
          <p className="font-display text-4xl font-bold text-forest">{subscriberCount}</p>
          <p className="mt-1 text-sm text-mist">suscriptores activos</p>
        </div>
        <div className="kennel-card p-5 pt-7 text-center">
          <p className="font-display text-4xl font-bold text-forest">∞</p>
          <p className="mt-1 text-sm text-mist">alertas gratuitas</p>
        </div>
      </div>

      {/* QR y link */}
      <div className="kennel-card mt-6 p-6 pt-8">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">

          {/* QR */}
          <div className="flex-shrink-0 text-center">
            <img
              src={qrUrl}
              alt="QR de suscripción a Telegram"
              className="h-48 w-48 rounded-lg border border-ink/10"
            />
            <p className="mt-2 text-xs text-mist">Escanear con Telegram</p>
          </div>

          {/* Info y acciones */}
          <div className="flex-1">
            <h2 className="font-display text-lg text-forest">
              {shelterName || 'Tu albergue'}
            </h2>
            <p className="mt-1 text-sm text-mist">
              Cuando alguien escanea este QR o abre el link, queda suscrito a las alertas de tu albergue en Telegram.
            </p>

            {/* Link copiable */}
            <div className="mt-4">
              <label className="label-field">Link de suscripción</label>
              <div className="flex gap-2">
                <input
                  readOnly
                  value={telegramLink}
                  className="input-field flex-1 font-mono text-xs"
                />
                <button
                  onClick={handleCopy}
                  className={`btn-primary flex-shrink-0 transition-all ${copied ? 'bg-moss' : ''}`}
                >
                  {copied ? '¡Copiado!' : 'Copiar'}
                </button>
              </div>
            </div>

            {/* Acciones */}
            <div className="mt-4 flex flex-wrap gap-3">
              <a
                href={telegramLink}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary text-sm"
              >
                Abrir en Telegram →
              </a>
              <a
                href={qrUrl}
                download={`qr-telegram-${shelterName || 'albergue'}.png`}
                className="btn-secondary text-sm"
              >
                Descargar QR
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Instrucciones */}
      <div className="kennel-card mt-6 p-6 pt-8">
        <h3 className="font-display text-base text-forest">¿Cómo funciona?</h3>
        <ol className="mt-4 space-y-3">
          {[
            'El adoptante escanea el QR o abre el link desde su celular.',
            'Telegram abre el chat con el bot de RescueLink.',
            'El adoptante presiona "Start" — queda suscrito a tu albergue.',
            'Cuando marques un animal como "Urgente" en el inventario, todos tus suscriptores reciben una alerta automática con foto.',
          ].map((step, i) => (
            <li key={i} className="flex gap-3 text-sm text-ink">
              <span className="flex-shrink-0 font-mono text-xs font-bold text-forest mt-0.5">
                {String(i + 1).padStart(2, '0')}
              </span>
              {step}
            </li>
          ))}
        </ol>
      </div>

      {/* Aviso si el bot no está configurado */}
      {BOT_USERNAME === 'TU_BOT_USERNAME' && (
        <div className="mt-4 rounded-md bg-rescue/10 px-4 py-3 text-sm text-rescue">
          ⚠️ Recuerda reemplazar <code>TU_BOT_USERNAME</code> en el código con el username real de tu bot de Telegram.
        </div>
      )}
    </div>
  );
}
