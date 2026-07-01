# 🐾 RescueLink — Estructura General del Proyecto

```
rescuelink/
├── .env.example                        # Variables de entorno (plantilla)
├── .env.local                          # Variables locales (NO subir a git)
├── .gitignore
├── index.html
├── package.json
├── vite.config.ts                      # Config Vite + vite-plugin-pwa
├── tailwind.config.js
├── postcss.config.js
├── tsconfig.json
│
├── public/
│   ├── icons/                          # Iconos PWA (192, 512, maskable)
│   ├── manifest.webmanifest            # Generado por vite-plugin-pwa
│   └── favicon.svg
│
├── supabase/
│   ├── config.toml                     # Config del CLI de Supabase
│   ├── migrations/
│   │   └── 001_initial_schema.sql      # ⬅️ Entregado en esta fase
│   ├── functions/                      # Edge Functions (Deno) — Fase 3
│   │   ├── notify-urgent-animal/
│   │   │   └── index.ts                # Dispara Telegram al marcar "urgent"
│   │   ├── notify-application-status/
│   │   │   └── index.ts                # Envía email vía Resend
│   │   └── telegram-webhook/
│   │       └── index.ts                # Recibe comandos /start del bot
│   └── seed.sql                        # Datos de prueba (opcional)
│
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── router.tsx                      # React Router con rutas protegidas
    │
    ├── lib/
    │   ├── supabaseClient.ts           # Cliente único de Supabase
    │   └── constants.ts                # Enums espejo (species, status, etc.)
    │
    ├── types/
    │   └── database.types.ts           # Tipos generados por Supabase CLI
    │
    ├── hooks/
    │   ├── useAuth.ts                  # Hook de sesión/autenticación
    │   ├── useAnimals.ts               # CRUD + queries de animales
    │   └── useApplications.ts          # Queries de solicitudes
    │
    ├── modules/
    │   │
    │   ├── shelter-dashboard/          # ── MÓDULO A ──
    │   │   ├── pages/
    │   │   │   ├── LoginPage.tsx
    │   │   │   ├── DashboardHome.tsx
    │   │   │   ├── AnimalsInventoryPage.tsx
    │   │   │   └── ApplicationsInboxPage.tsx
    │   │   ├── components/
    │   │   │   ├── AnimalFormModal.tsx
    │   │   │   ├── AnimalTable.tsx
    │   │   │   ├── ApplicationCard.tsx
    │   │   │   └── ProtectedRoute.tsx
    │   │   └── index.ts
    │   │
    │   ├── public-adoption/            # ── MÓDULO B ──
    │   │   ├── pages/
    │   │   │   ├── CatalogPage.tsx
    │   │   │   ├── AnimalDetailPage.tsx
    │   │   │   └── ApplicationFormPage.tsx
    │   │   ├── components/
    │   │   │   ├── AnimalCard.tsx
    │   │   │   ├── FilterBar.tsx
    │   │   │   ├── UrgentBadge.tsx
    │   │   │   └── AdoptionForm.tsx
    │   │   └── index.ts
    │   │
    │   └── notifications/              # ── MÓDULO C (lado cliente) ──
    │       ├── telegramService.ts      # Llamadas directas a Bot API
    │       └── emailTriggers.ts        # Invoca Edge Functions de Resend
    │
    ├── components/                     # Componentes compartidos (UI kit)
    │   ├── ui/
    │   │   ├── Button.tsx
    │   │   ├── Badge.tsx
    │   │   ├── Spinner.tsx
    │   │   └── Toast.tsx
    │   └── layout/
    │       ├── PublicLayout.tsx
    │       └── DashboardLayout.tsx
    │
    └── styles/
        └── index.css                  # Directivas Tailwind
```

### Justificación de decisiones clave

| Decisión | Motivo |
|---|---|
| `shelters.id` referenciará `auth.users.id` | Simplifica RLS: 1 cuenta de Supabase Auth = 1 albergue. Sin tablas puente. |
| Edge Functions para notificaciones | Evita exponer el Bot Token de Telegram o la API Key de Resend en el frontend. Corren server-side gratis en Supabase. |
| `answers_json` como `jsonb` | El formulario de adopción puede evolucionar (más preguntas) sin migraciones nuevas. |
| Tipos generados con Supabase CLI | `supabase gen types typescript` mantiene el frontend sincronizado con el schema real. |

Continuemos con el script SQL.
