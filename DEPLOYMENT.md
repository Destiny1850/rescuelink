# 🚀 RescueLink — Guía de Despliegue Completo

## RESUMEN DEL STACK (costo: $0/mes en producción)

| Capa | Servicio | Límite gratuito |
|---|---|---|
| Frontend + PWA | Vercel | 100 GB ancho de banda / mes |
| Base de datos | Supabase PostgreSQL | 500 MB almacenamiento |
| Auth | Supabase Auth | MAU ilimitados |
| Storage fotos | Supabase Storage | 1 GB |
| Notificaciones | Telegram Bot API | Ilimitado |
| Email | Resend | 3.000 emails / mes |
| Edge Functions | Supabase Edge Functions | 500.000 invocaciones / mes |

---

## PASO 1 — Clonar y configurar localmente

```bash
# 1.1 Clonar el repositorio (o descomprimir el .tar.gz entregado)
git clone https://github.com/TU_USUARIO/rescuelink.git
cd rescuelink

# 1.2 Instalar dependencias
npm install

# 1.3 Crear archivo de variables de entorno local
cp .env.example .env.local
# Abre .env.local y rellena los valores (los obtienes en el Paso 2)

# 1.4 Arrancar el servidor de desarrollo
npm run dev
# → App disponible en http://localhost:5173
```

---

## PASO 2 — Configurar Supabase

### 2.1 Crear el proyecto

1. Ve a **https://supabase.com** → "New project"
2. Elige un nombre (ej: `rescuelink-prod`) y una región cercana a tus usuarios
3. Guarda la contraseña de la base de datos en un lugar seguro
4. Espera ~2 minutos a que el proyecto esté listo

### 2.2 Ejecutar la migración SQL

1. En el panel de Supabase → **SQL Editor** → "New query"
2. Pega el contenido completo de `supabase/migrations/001_initial_schema.sql`
3. Haz clic en **Run** → debes ver "Success. No rows returned."

### 2.3 Verificar RLS y Storage

- **Authentication → Policies**: debes ver 4 tablas con el candado verde activado
- **Storage**: debe aparecer el bucket `animal-photos` (público)

### 2.4 Obtener las credenciales para .env.local

Ve a **Project Settings → API** y copia:

```bash
# En tu .env.local:
VITE_SUPABASE_URL=https://XXXXXXXXXXXXXXXX.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 2.5 Crear el usuario del albergue (login del dashboard)

Opción A — Desde el panel (recomendado para el primer albergue):
1. **Authentication → Users** → "Invite user"
2. Ingresa el email del albergue
3. El albergue recibirá un correo para establecer su contraseña

Opción B — Desde SQL Editor (para pruebas):
```sql
-- Ejecuta esto en el SQL Editor de Supabase:
SELECT auth.sign_up(
  'email@tualbergue.org',
  'contraseña-segura-123'
);
```

Luego crea el perfil del albergue (requerido por la FK de shelters → auth.users):
```sql
INSERT INTO public.shelters (id, name, email, phone, location)
VALUES (
  '<UUID del usuario creado en auth.users>',
  'Refugio Animal Los Pinos',
  'contacto@lospinos.org',
  '+57 300 000 0000',
  'Bogotá, Colombia'
);
```
> El UUID lo encuentras en **Authentication → Users**, copiando el "User UID".

---

## PASO 3 — Configurar Telegram Bot

### 3.1 Crear el bot con @BotFather

1. Abre Telegram → busca **@BotFather** → `/newbot`
2. Dale un nombre: `RescueLink Alertas`
3. Dale un username: `rescuelink_TUALBERGUE_bot`
4. Guarda el **Token** que te entrega (ej: `7123456789:AAF...`)

### 3.2 Registrar el webhook en Telegram

Una vez desplegadas las Edge Functions (Paso 5), ejecuta este comando
reemplazando las variables:

```bash
curl "https://api.telegram.org/bot<TOKEN>/setWebhook" \
  -d "url=https://<PROJECT_ID>.supabase.co/functions/v1/telegram-webhook"

# Respuesta esperada:
# {"ok":true,"result":true,"description":"Webhook was set"}
```

### 3.3 Probar el bot

1. Abre Telegram → busca tu bot → `/start`
2. Debes recibir el mensaje de bienvenida de RescueLink

---

## PASO 4 — Configurar Resend (emails)

1. Ve a **https://resend.com** → crea cuenta gratuita
2. **API Keys** → "Create API Key" → copia la key (`re_...`)
3. **Domains** → verifica tu dominio (o usa el dominio de sandbox para pruebas)
4. Guarda la key para el Paso 5 (secrets de Edge Functions)

---

## PASO 5 — Desplegar las Edge Functions

### 5.1 Instalar el CLI de Supabase

```bash
npm install -g supabase
supabase login
# Se abrirá el navegador para autenticarte con tu cuenta de Supabase
```

### 5.2 Vincular el proyecto

```bash
cd rescuelink
supabase link --project-ref ldyurytkyvvbyhlxfeuk
# El PROJECT_ID está en: Supabase Panel → Settings → General → Reference ID
```

### 5.3 Configurar los secrets (equivale a variables de entorno del servidor)

```bash
supabase secrets set TELEGRAM_BOT_TOKEN="8836111443:AAFnOErK_7g6Np0krpaKz9G6UcTXPDHovCs"
supabase secrets set RESEND_API_KEY="re_LHo5yVpZ_NpcNkq9mXy8wFEKJgRQWu6cx"
supabase secrets set RESEND_FROM_EMAIL="RescueLink thyescobar1993@gmail.com"
supabase secrets set APP_URL="https://rescuelink.vercel.app"
# APP_URL la defines después del deploy en Vercel (Paso 6)
```

### 5.4 Desplegar las 3 funciones

```bash
supabase functions deploy notify-urgent-animal
supabase functions deploy notify-application-status
supabase functions deploy telegram-webhook
```

### 5.5 Registrar el webhook de Telegram (ahora sí)

```bash
# Reemplaza TOKEN y PROJECT_ID con los tuyos:
curl "https://api.telegram.org/bot<TOKEN>/setWebhook" \
  -d "url=https://<PROJECT_ID>.supabase.co/functions/v1/telegram-webhook"
```

---

## PASO 6 — Desplegar el frontend en Vercel

### 6.1 Subir el código a GitHub

```bash
cd rescuelink
git init
git add .
git commit -m "feat: RescueLink v1.0 — initial commit"
git remote add origin https://github.com/TU_USUARIO/rescuelink.git
git push -u origin main
```

### 6.2 Importar en Vercel

1. Ve a **https://vercel.com** → "Add New Project"
2. Conecta tu cuenta de GitHub → selecciona el repo `rescuelink`
3. Vercel detectará Vite automáticamente. Configuración:
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`

### 6.3 Agregar las variables de entorno en Vercel

En el paso de configuración, expande "Environment Variables" y agrega:

| Variable | Valor |
|---|---|
| `VITE_SUPABASE_URL` | `https://XXXXX.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGci...` |

> ⚠️ Las variables `VITE_` son públicas por diseño (van al bundle del navegador).
> Las keys secretas (Telegram, Resend) NUNCA van aquí — solo en los secrets de Supabase.

### 6.4 Deploy

Haz clic en **Deploy**. En ~90 segundos tendrás tu URL:
`https://rescuelink-XXXXX.vercel.app`

### 6.5 Actualizar APP_URL en Supabase

```bash
supabase secrets set APP_URL="https://tu-url-real.vercel.app"

# Re-desplegar las funciones para que tomen el nuevo secret:
supabase functions deploy notify-urgent-animal
supabase functions deploy notify-application-status
```

---

## PASO 7 — Generar tipos TypeScript desde el schema real (recomendado)

Una vez que el proyecto está desplegado, reemplaza los tipos manuales por los
generados automáticamente desde tu schema real de Supabase:

```bash
# Reemplaza YOUR_PROJECT_ID con tu Reference ID
npx supabase gen types typescript \
  --project-id YOUR_PROJECT_ID \
  > src/types/database.types.ts

git add src/types/database.types.ts
git commit -m "chore: sync types from Supabase schema"
git push
# → Vercel redesplegará automáticamente con los tipos actualizados
```

---

## PASO 8 — Generar el QR de suscripción a Telegram (por albergue)

El dashboard puede mostrar un QR que apunta al deep-link del bot con el shelter_id
como parámetro. El link tiene este formato:

```
https://t.me/TU_BOT_USERNAME?start=<SHELTER_ID>
```

Cuando un usuario escanea el QR y escribe `/start`, la Edge Function `telegram-webhook`
recibe el shelter_id del parámetro y lo suscribe automáticamente al albergue correcto.

Para generar el QR puedes usar la API gratuita de QR Server:
```
https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=https://t.me/TU_BOT?start=SHELTER_ID
```

---

## VERIFICACIÓN FINAL — checklist de producción

```
[ ] npm run dev funciona localmente sin errores en consola
[ ] Login del albergue funciona en /albergue/login
[ ] Puedo crear un animal con foto desde el dashboard
[ ] La foto aparece en el catálogo público en /
[ ] El formulario de adopción en /animal/:id/postular guarda en Supabase
[ ] La solicitud aparece en /albergue/solicitudes
[ ] Cambiar estado a "urgente" llega al canal de Telegram
[ ] Aprobar/rechazar una solicitud envía email al adoptante
[ ] La app se puede instalar como PWA desde el navegador móvil (ícono "Añadir a inicio")
[ ] En Vercel: el dominio personalizado está configurado (opcional, dominio propio)
```

---

## COMANDOS DE REFERENCIA RÁPIDA

```bash
npm run dev                    # Desarrollo local
npm run build                  # Build de producción
npm run gen:types              # Regenerar tipos desde Supabase

supabase functions deploy <fn> # Redesplegar una Edge Function
supabase secrets list          # Ver secrets configurados
supabase logs --fn-name <fn>   # Ver logs de una Edge Function en tiempo real
```
