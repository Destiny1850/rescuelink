/**
 * telegram-webhook — versión multi-albergue
 * Un usuario puede suscribirse a varios albergues simultáneamente.
 *
 * Comandos:
 *   /start <shelter_id>  — suscribirse a un albergue
 *   /lista               — ver todos los albergues a los que estás suscrito
 *   /stop                — menú para desuscribirse de un albergue específico
 *   /stop <shelter_id>   — desuscribirse directamente de un albergue
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
    if (!message?.text) return new Response('ok', { headers: corsHeaders });

    const chatId = message.chat.id;
    const firstName = message.chat.first_name ?? 'Amigo';
    const text = message.text.trim();

    const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN')!;
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // /start <shelter_id>
    if (text.startsWith('/start')) {
      const shelterId = text.split(' ')[1]?.trim() ?? null;

      if (!shelterId) {
        await sendMessage(botToken, chatId,
          `¡Hola ${firstName}! 🐾\n\nSoy el bot de *RescueLink*.\n` +
          `Escanea el código QR de un albergue para suscribirte a sus alertas.`
        );
        return new Response('ok', { headers: corsHeaders });
      }

      // Verificar que el albergue existe
      const { data: shelter } = await supabase
        .from('shelters')
        .select('id, name')
        .eq('id', shelterId)
        .single();

      if (!shelter) {
        await sendMessage(botToken, chatId,
          `❌ No encontré ese albergue. Usa el enlace oficial del albergue.`
        );
        return new Response('ok', { headers: corsHeaders });
      }

      // Verificar si ya está suscrito a este albergue
      const { data: existing } = await supabase
        .from('telegram_subscribers')
        .select('id')
        .eq('chat_id', chatId)
        .eq('shelter_id', shelterId)
        .single();

      if (existing) {
        await sendMessage(botToken, chatId,
          `ℹ️ Ya estás suscrito a *${shelter.name}*.\n` +
          `Usa /lista para ver todos tus albergues.`
        );
        return new Response('ok', { headers: corsHeaders });
      }

      // Insertar nueva suscripción
      const { error } = await supabase
        .from('telegram_subscribers')
        .insert({ chat_id: chatId, shelter_id: shelterId });

      if (error) throw new Error(error.message);

      await sendMessage(botToken, chatId,
        `✅ ¡Suscrito a *${shelter.name}*!\n\n` +
        `Te avisaré cuando tengan animales con adopción urgente. 🐶🐱\n\n` +
        `Usa /lista para ver todos tus albergues.\n` +
        `Usa /stop para cancelar una suscripción.`
      );

    // /lista — ver todas las suscripciones
    } else if (text === '/lista') {
      const { data: subs } = await supabase
        .from('telegram_subscribers')
        .select('shelter_id, shelters(name)')
        .eq('chat_id', chatId);

      if (!subs || subs.length === 0) {
        await sendMessage(botToken, chatId,
          `ℹ️ No tienes suscripciones activas.\n` +
          `Escanea el QR de un albergue para suscribirte.`
        );
      } else {
        const lista = subs.map((s, i) => {
          const name = (s.shelters as { name: string } | null)?.name ?? 'Albergue';
          return `${i + 1}. *${name}*`;
        }).join('\n');

        await sendMessage(botToken, chatId,
          `📋 *Tus albergues suscritos:*\n\n${lista}\n\n` +
          `Usa /stop para cancelar una suscripción.`
        );
      }

    // /stop <shelter_id> o /stop solo
    } else if (text.startsWith('/stop')) {
      const shelterId = text.split(' ')[1]?.trim() ?? null;

      // Si viene con shelter_id directo
      if (shelterId) {
        const { data: shelter } = await supabase
          .from('shelters')
          .select('name')
          .eq('id', shelterId)
          .single();

        const { error } = await supabase
          .from('telegram_subscribers')
          .delete()
          .eq('chat_id', chatId)
          .eq('shelter_id', shelterId);

        if (error) throw new Error(error.message);

        await sendMessage(botToken, chatId,
          `✔️ Cancelada la suscripción a *${shelter?.name ?? 'ese albergue'}*.\n` +
          `Usa /lista para ver tus suscripciones restantes.`
        );

      } else {
        // Mostrar lista para que elija
        const { data: subs } = await supabase
          .from('telegram_subscribers')
          .select('shelter_id, shelters(name)')
          .eq('chat_id', chatId);

        if (!subs || subs.length === 0) {
          await sendMessage(botToken, chatId,
            `ℹ️ No tienes suscripciones activas.`
          );
        } else {
          const lista = subs.map((s) => {
            const name = (s.shelters as { name: string } | null)?.name ?? 'Albergue';
            return `• /stop ${s.shelter_id} — *${name}*`;
          }).join('\n');

          await sendMessage(botToken, chatId,
            `¿De cuál albergue quieres cancelar la suscripción?\n\n${lista}`
          );
        }
      }

    } else {
      await sendMessage(botToken, chatId,
        `Comandos disponibles:\n\n` +
        `• /lista — ver tus albergues suscritos\n` +
        `• /stop — cancelar una suscripción`
      );
    }

    return new Response('ok', { headers: corsHeaders });

  } catch (err) {
    console.error('[telegram-webhook]', err);
    return new Response('ok', { headers: corsHeaders });
  }
});
