/**
 * notify-application-status
 * ─────────────────────────────────────────────────────────────────────────
 * Disparada desde el cliente con:
 *   supabase.functions.invoke('notify-application-status', {
 *     body: { application_id, new_status }
 *   })
 *
 * Flujo:
 *   1. Lee la solicitud con el animal y el albergue asociados.
 *   2. Construye un email transaccional personalizado según el nuevo estado.
 *   3. Lo envía al adoptante vía Resend API (capa free: 3.000/mes).
 *
 * Variables de entorno requeridas:
 *   RESEND_API_KEY           — obtenida en resend.com (gratis)
 *   RESEND_FROM_EMAIL        — ej: "RescueLink <noreply@tudominio.com>"
 *   SUPABASE_URL             — inyectada automáticamente
 *   SUPABASE_SERVICE_ROLE_KEY — inyectada automáticamente
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

type ApplicationStatus = 'pending' | 'reviewed' | 'approved' | 'rejected';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/** Genera el HTML del email según el estado de la solicitud */
function buildEmailContent(params: {
  applicantName: string;
  animalName: string;
  shelterName: string;
  status: ApplicationStatus;
  appUrl: string;
  animalId: string;
}): { subject: string; html: string } {
  const { applicantName, animalName, shelterName, status, appUrl, animalId } = params;
  const animalUrl = `${appUrl}/animal/${animalId}`;

  const contents: Record<ApplicationStatus, { subject: string; heading: string; body: string }> = {
    pending: {
      subject: `Recibimos tu solicitud para adoptar a ${animalName}`,
      heading: '¡Solicitud recibida!',
      body: `Hemos registrado tu interés en adoptar a <strong>${animalName}</strong>. El equipo de <strong>${shelterName}</strong> revisará tu postulación y te contactará pronto.`,
    },
    reviewed: {
      subject: `Tu solicitud para ${animalName} está siendo revisada`,
      heading: 'Tu solicitud está en revisión',
      body: `El equipo de <strong>${shelterName}</strong> está revisando tu postulación para adoptar a <strong>${animalName}</strong>. Te avisaremos en cuanto haya novedades.`,
    },
    approved: {
      subject: `🎉 ¡Tu solicitud para adoptar a ${animalName} fue aprobada!`,
      heading: '¡Felicitaciones, tu solicitud fue aprobada!',
      body: `El equipo de <strong>${shelterName}</strong> aprobó tu postulación para adoptar a <strong>${animalName}</strong>. Pronto se comunicarán contigo para coordinar los detalles del proceso de adopción.`,
    },
    rejected: {
      subject: `Actualización sobre tu solicitud para ${animalName}`,
      heading: 'Actualización sobre tu solicitud',
      body: `Lamentamos informarte que en esta ocasión tu solicitud para adoptar a <strong>${animalName}</strong> no pudo ser aprobada por <strong>${shelterName}</strong>. Te invitamos a explorar otros animales que podrían ser el compañero perfecto para ti.`,
    },
  };

  const { subject, heading, body } = contents[status];

  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background-color:#F3ECE0;font-family:'Inter',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F3ECE0;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="padding-bottom:24px;text-align:center;">
              <span style="font-family:Georgia,serif;font-size:24px;font-weight:700;color:#2F4538;">
                RescueLink
              </span>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background:#ffffff;border-radius:12px;padding:40px 36px;box-shadow:0 2px 12px rgba(34,31,26,0.08);">
              <p style="margin:0 0 8px 0;font-size:12px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:#7C8B85;">
                Hola, ${applicantName}
              </p>
              <h1 style="margin:0 0 20px 0;font-family:Georgia,serif;font-size:26px;font-weight:700;color:#2F4538;line-height:1.3;">
                ${heading}
              </h1>
              <p style="margin:0 0 28px 0;font-size:15px;color:#221F1A;line-height:1.7;">
                ${body}
              </p>
              ${status !== 'rejected' ? `
              <a href="${animalUrl}"
                 style="display:inline-block;background-color:#2F4538;color:#F3ECE0;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:14px;font-weight:600;">
                Ver la ficha de ${animalName}
              </a>` : `
              <a href="${appUrl}"
                 style="display:inline-block;background-color:#2F4538;color:#F3ECE0;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:14px;font-weight:600;">
                Explorar otros animales
              </a>`}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding-top:24px;text-align:center;font-size:12px;color:#7C8B85;line-height:1.6;">
              Este mensaje fue enviado por RescueLink en nombre de ${shelterName}.<br>
              Si no enviaste una solicitud de adopción, puedes ignorar este correo.
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { subject, html };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { application_id, new_status } = await req.json() as {
      application_id: string;
      new_status: ApplicationStatus;
    };

    if (!application_id || !new_status) {
      throw new Error('application_id y new_status son requeridos');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // 1. Leer solicitud + animal + albergue en una query con join
    const { data: application, error: appError } = await supabase
      .from('adoption_applications')
      .select(`
        id,
        applicant_name,
        applicant_email,
        animal_id,
        animals (
          id,
          name,
          shelter_id,
          shelters ( name )
        )
      `)
      .eq('id', application_id)
      .single();

    if (appError || !application) {
      throw new Error(`Solicitud no encontrada: ${appError?.message}`);
    }

    const animal = application.animals as {
      id: string;
      name: string;
      shelter_id: string;
      shelters: { name: string } | null;
    } | null;

    const shelterName = animal?.shelters?.name ?? 'El albergue';
    const animalName = animal?.name ?? 'el animal';
    const animalId = animal?.id ?? '';

    const resendKey = Deno.env.get('RESEND_API_KEY');
    if (!resendKey) throw new Error('RESEND_API_KEY no configurado');

    const fromEmail = Deno.env.get('RESEND_FROM_EMAIL') ?? 'RescueLink <noreply@rescuelink.app>';
    const appUrl = Deno.env.get('APP_URL') ?? 'https://rescuelink.app';

    // 2. Construir email
    const { subject, html } = buildEmailContent({
      applicantName: application.applicant_name,
      animalName,
      shelterName,
      status: new_status,
      appUrl,
      animalId,
    });

    // 3. Enviar vía Resend
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendKey}`,
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [application.applicant_email],
        subject,
        html,
      }),
    });

    if (!resendResponse.ok) {
      const resendError = await resendResponse.json();
      throw new Error(`Resend error: ${JSON.stringify(resendError)}`);
    }

    const resendData = await resendResponse.json();

    return new Response(
      JSON.stringify({ success: true, email_id: resendData.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    console.error('[notify-application-status]', err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
