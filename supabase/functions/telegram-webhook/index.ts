/**
 * telegram-webhook
 * ─────────────────────────────────────────────────────────────────────────
 * Recibe updates del Bot de Telegram cuando usuarios envían /start.
 * Esta función DEBE registrarse como webhook en Telegram:
 *
 *   curl "https://api.telegram.org/bot<TOKEN>/setWebhook" \
 *     -d "url=https://<project>.supabase.co/functions/v1/telegram-webhook"
 *
 * Comandos soportados:
 *   /start <shelter_id>  — suscribir al usuario al albergue con ese ID
 *   /stop                — cancelar suscripción
 *   /info                — ver estado de suscripción actual
 *
 * Uso típico: el dashboard del albergue muestra un link de Telegram
 * con el shelter_id como parámetro deep-link:
 *   https://t.me/<BOT_USERNAME>?start=<shelter_id>
 *
 * Variables de entorno requeridas:
 *   TELEGRAM_BOT_TOKEN        — token del bot
 *   SUPABASE_URL              — inyectada automáticamente
 *   SUPABASE_SERVICE_ROLE_KEY — inyectada automáticamente
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface TelegramMessage {
  message_id: number;
  chat: { id: number; first_name?: string; username?: string };
  text?: string;
}

interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function sendMessage(botToken: string, chatId: number, text: string) {
  await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown' }),
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const update: TelegramUpdate = await req.json();
    const message = update.message;
    if (!message?.text) {
      return new Response('ok', { headers: corsHeaders });
    }

    const chatId = message.chat.id;
    const firstName = message.chat.first_name ?? 'Amigo';
    const text = message.text.trim();

    const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN')!;
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // /start <shelter_id>  — viene del deep-link del QR/dashboard
    if (text.startsWith('/start')) {
      const shelterId = text.split(' ')[1]?.trim() ?? null;

      if (!shelterId) {
        await sendMessage(botToken, chatId,
          `¡Hola ${firstName}! 🐾\n\nSoy el bot de *RescueLink*.\n` +
          `Para suscribirte a las alertas de un albergue, escanea el código QR ` +
          `del albergue o pídele el enlace de suscripción directa.`
        );
        return new Response('ok', { headers: corsHeaders });
      }

      // Verificar que el albergue existe antes de suscribir
      const { data: shelter } = await supabase
        .from('shelters')
        .select('id, name')
        .eq('id', shelterId)
        .single();

      if (!shelter) {
        await sendMessage(botToken, chatId,
          `❌ No encontré ese albergue. Asegúrate de usar el enlace oficial del albergue.`
        );
        return new Response('ok', { headers: corsHeaders });
      }

      // Upsert: si ya existía, actualiza el shelter_id (por si cambió)
      const { error: upsertError } = await supabase
        .from('telegram_subscribers')
        .upsert({ chat_id: chatId, shelter_id: shelterId }, { onConflict: 'chat_id' });

      if (upsertError) throw new Error(upsertError.message);

      await sendMessage(botToken, chatId,
        `✅ ¡Suscrito a *${shelter.name}*!\n\n` +
        `Te avisaré cuando haya animales con adopción urgente. 🐶🐱\n` +
        `Usa /stop para cancelar la suscripción.`
      );

    // /stop — cancelar suscripción
    } else if (text === '/stop') {
      const { error } = await supabase
        .from('telegram_subscribers')
        .delete()
        .eq('chat_id', chatId);

      if (error) throw new Error(error.message);

      await sendMessage(botToken, chatId,
        `✔️ Suscripción cancelada. Ya no recibirás alertas.\n` +
        `Si cambias de opinión, usa el enlace de tu albergue para volver a suscribirte.`
      );

    // /info — estado actual
    } else if (text === '/info') {
      const { data: sub } = await supabase
        .from('telegram_subscribers')
        .select('shelter_id, shelters(name)')
        .eq('chat_id', chatId)
        .single();

      if (!sub) {
        await sendMessage(botToken, chatId,
          `ℹ️ No tienes ninguna suscripción activa.\n` +
          `Escanea el QR de un albergue para suscribirte.`
        );
      } else {
        const shelterName = (sub.shelters as { name: string } | null)?.name ?? 'un albergue';
        await sendMessage(botToken, chatId,
          `ℹ️ Estás suscrito a las alertas de *${shelterName}*.\n` +
          `Usa /stop para cancelar.`
        );
      }

    // Cualquier otro mensaje
    } else {
      await sendMessage(botToken, chatId,
        `No entendí ese comando.\n\nComandos disponibles:\n` +
        `• /info — ver tu suscripción actual\n` +
        `• /stop — cancelar suscripción`
      );
    }

    return new Response('ok', { headers: corsHeaders });

  } catch (err) {
    console.error('[telegram-webhook]', err);
    // Siempre devolvemos 200 a Telegram para que no reintente el update
    return new Response('ok', { headers: corsHeaders });
  }
});
