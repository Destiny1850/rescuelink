/**
 * notify-urgent-animal
 * ─────────────────────────────────────────────────────────────────────────
 * Disparada desde el cliente con:
 *   supabase.functions.invoke('notify-urgent-animal', { body: { animal_id } })
 *
 * Flujo:
 *   1. Lee los datos completos del animal (nombre, especie, imagen, id del albergue).
 *   2. Busca todos los suscriptores de Telegram del albergue.
 *   3. Envía un mensaje personalizado a cada uno vía Bot API de Telegram.
 *
 * Variables de entorno requeridas (Supabase → Settings → Edge Functions Secrets):
 *   TELEGRAM_BOT_TOKEN   — token del bot obtenido con @BotFather
 *   SUPABASE_URL         — inyectada automáticamente por Supabase
 *   SUPABASE_SERVICE_ROLE_KEY — inyectada automáticamente; necesaria para
 *                               leer `telegram_subscribers` (ignora RLS).
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Preflight CORS (requerido por Supabase Edge Functions)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { animal_id } = await req.json() as { animal_id: string };
    if (!animal_id) throw new Error('animal_id es requerido');

    // Cliente con service_role: ignora RLS para leer suscriptores
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // 1. Leer datos del animal + albergue en un solo query con join
    const { data: animal, error: animalError } = await supabase
      .from('animals')
      .select('id, name, species, breed, age_months, main_image_url, shelter_id, shelters(name)')
      .eq('id', animal_id)
      .single();

    if (animalError || !animal) throw new Error(`Animal no encontrado: ${animalError?.message}`);

    // 2. Buscar suscriptores del albergue
    const { data: subscribers, error: subError } = await supabase
      .from('telegram_subscribers')
      .select('chat_id, preferences_json')
      .eq('shelter_id', animal.shelter_id);

    if (subError) throw new Error(`Error leyendo suscriptores: ${subError.message}`);
    if (!subscribers || subscribers.length === 0) {
      return new Response(
        JSON.stringify({ sent: 0, message: 'Sin suscriptores para este albergue' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
    if (!botToken) throw new Error('TELEGRAM_BOT_TOKEN no configurado');

    const shelterName = (animal.shelters as { name: string } | null)?.name ?? 'Un albergue';
    const appUrl = Deno.env.get('APP_URL') ?? 'https://rescuelink.app';

    // 3. Construir el mensaje (Markdown V2 de Telegram)
    const ageLabel = animal.age_months != null
      ? animal.age_months < 12
        ? `${animal.age_months} meses`
        : `${Math.floor(animal.age_months / 12)} años`
      : 'edad desconocida';

    const speciesEmoji: Record<string, string> = { dog: '🐶', cat: '🐱', other: '🐾' };
    const emoji = speciesEmoji[animal.species] ?? '🐾';

    const text = [
      `🚨 *ADOPCIÓN URGENTE* 🚨`,
      ``,
      `${emoji} *${animal.name}* necesita hogar YA`,
      `${shelterName} · ${ageLabel}${animal.breed ? ` · ${animal.breed}` : ''}`,
      ``,
      `Ver ficha completa y postular:`,
      `${appUrl}/animal/${animal.id}`,
    ].join('\n');

    // 4. Enviar a cada suscriptor (en paralelo, máx 30 concurrentes para no saturar la API)
    const BATCH_SIZE = 30;
    let sent = 0;
    let failed = 0;

    for (let i = 0; i < subscribers.length; i += BATCH_SIZE) {
      const batch = subscribers.slice(i, i + BATCH_SIZE);
      const results = await Promise.allSettled(
        batch.map(async (sub) => {
          // Respetar preferencia de especie si el suscriptor la configuró
          const prefs = sub.preferences_json as { species?: string[] } | null;
          if (prefs?.species?.length && !prefs.species.includes(animal.species)) return;

          const payload: Record<string, unknown> = {
            chat_id: sub.chat_id,
            text,
            parse_mode: 'Markdown',
          };

          // Si hay foto, usamos sendPhoto con caption en vez de sendMessage
          const method = animal.main_image_url ? 'sendPhoto' : 'sendMessage';
          if (animal.main_image_url) {
            payload['photo'] = animal.main_image_url;
            payload['caption'] = text;
            delete payload['text'];
          }

          const res = await fetch(
            `https://api.telegram.org/bot${botToken}/${method}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
            }
          );

          if (!res.ok) {
            const err = await res.json();
            throw new Error(`chat_id ${sub.chat_id}: ${err.description}`);
          }
        })
      );

      for (const r of results) {
        if (r.status === 'fulfilled') sent++;
        else { failed++; console.error(r.reason); }
      }
    }

    return new Response(
      JSON.stringify({ sent, failed }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    console.error('[notify-urgent-animal]', err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
