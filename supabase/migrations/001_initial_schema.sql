-- =====================================================================
-- RESCUELINK — Migración inicial del esquema
-- =====================================================================
-- Ejecutar con: supabase db push
-- o pegar directamente en el SQL Editor del panel de Supabase.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 0. EXTENSIONES
-- ---------------------------------------------------------------------
create extension if not exists "pgcrypto"; -- gen_random_uuid()

-- ---------------------------------------------------------------------
-- 1. TIPOS ENUMERADOS
-- ---------------------------------------------------------------------
create type animal_species as enum ('dog', 'cat', 'other');
create type animal_size as enum ('small', 'medium', 'large');
create type animal_status as enum ('available', 'foster', 'adopted', 'urgent');
create type application_status as enum ('pending', 'reviewed', 'approved', 'rejected');
create type house_type as enum ('apartment', 'house_with_yard', 'house_no_yard', 'farm', 'other');

-- ---------------------------------------------------------------------
-- 2. TABLA: shelters
-- ---------------------------------------------------------------------
-- IMPORTANTE: el id de shelters ES el mismo id del usuario en auth.users.
-- Esto permite que 1 login de Supabase Auth = 1 albergue, sin tablas puente,
-- y simplifica enormemente las políticas RLS (auth.uid() = shelters.id).
create table public.shelters (
    id          uuid primary key references auth.users(id) on delete cascade,
    name        text not null,
    email       text not null unique,
    phone       text,
    location    text,
    telegram_channel_id text,      -- chat_id del canal/grupo del albergue (para difusión de "urgent")
    created_at  timestamptz not null default now()
);

comment on table public.shelters is 'Perfil público/operativo de cada albergue. id = auth.users.id';

-- ---------------------------------------------------------------------
-- 3. TABLA: animals
-- ---------------------------------------------------------------------
create table public.animals (
    id               uuid primary key default gen_random_uuid(),
    shelter_id       uuid not null references public.shelters(id) on delete cascade,
    name             text not null,
    species          animal_species not null,
    breed            text,
    age_months       integer check (age_months >= 0),
    size             animal_size,
    health_status    text,
    personality_tags text[] not null default '{}',
    bio              text,
    status           animal_status not null default 'available',
    main_image_url   text,
    created_at       timestamptz not null default now(),
    updated_at       timestamptz not null default now()
);

comment on table public.animals is 'Inventario de animales en adopción por albergue.';

create index idx_animals_shelter_id on public.animals(shelter_id);
create index idx_animals_status     on public.animals(status);
create index idx_animals_species    on public.animals(species);
create index idx_animals_tags       on public.animals using gin(personality_tags);

-- ---------------------------------------------------------------------
-- 4. TABLA: adoption_applications
-- ---------------------------------------------------------------------
create table public.adoption_applications (
    id               uuid primary key default gen_random_uuid(),
    animal_id        uuid not null references public.animals(id) on delete cascade,
    applicant_name   text not null,
    applicant_email  text not null,
    applicant_phone  text,
    house_type       house_type,
    has_other_pets   boolean not null default false,
    status           application_status not null default 'pending',
    answers_json     jsonb not null default '{}'::jsonb,  -- respuestas flexibles del formulario
    created_at       timestamptz not null default now(),
    updated_at       timestamptz not null default now()
);

comment on table public.adoption_applications is 'Postulaciones de adopción enviadas por el público general.';

create index idx_applications_animal_id on public.adoption_applications(animal_id);
create index idx_applications_status    on public.adoption_applications(status);
create index idx_applications_email     on public.adoption_applications(applicant_email);

-- ---------------------------------------------------------------------
-- 5. TABLA: telegram_subscribers
-- ---------------------------------------------------------------------
create table public.telegram_subscribers (
    id               uuid primary key default gen_random_uuid(),
    chat_id          bigint not null unique,       -- chat_id de Telegram del suscriptor
    shelter_id       uuid references public.shelters(id) on delete cascade, -- a qué albergue sigue
    preferences_json jsonb not null default '{}'::jsonb, -- ej. { "species": ["dog"], "only_urgent": true }
    created_at       timestamptz not null default now()
);

comment on table public.telegram_subscribers is 'Usuarios de Telegram suscritos a notificaciones de un albergue.';

create index idx_subscribers_shelter_id on public.telegram_subscribers(shelter_id);

-- ---------------------------------------------------------------------
-- 6. TRIGGER genérico: updated_at automático
-- ---------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

create trigger trg_animals_updated_at
    before update on public.animals
    for each row execute function public.set_updated_at();

create trigger trg_applications_updated_at
    before update on public.adoption_applications
    for each row execute function public.set_updated_at();

-- =====================================================================
-- 7. ROW LEVEL SECURITY (RLS)
-- =====================================================================

alter table public.shelters               enable row level security;
alter table public.animals                 enable row level security;
alter table public.adoption_applications   enable row level security;
alter table public.telegram_subscribers    enable row level security;

-- ---------------------------------------------------------------------
-- 7.1 Políticas: shelters
-- ---------------------------------------------------------------------
-- Cualquiera puede ver los datos públicos de los albergues (nombre, ubicación, etc.)
-- para mostrarlos en la PWA pública (ej. "publicado por Albergue X").
create policy "shelters_public_select"
    on public.shelters for select
    to anon, authenticated
    using (true);

-- Un albergue solo puede insertar SU PROPIA fila (creada normalmente vía trigger
-- de registro o justo después del sign-up, con id = auth.uid()).
create policy "shelters_self_insert"
    on public.shelters for insert
    to authenticated
    with check (id = auth.uid());

-- Un albergue solo puede actualizar su propia fila.
create policy "shelters_self_update"
    on public.shelters for update
    to authenticated
    using (id = auth.uid())
    with check (id = auth.uid());

-- ---------------------------------------------------------------------
-- 7.2 Políticas: animals
-- ---------------------------------------------------------------------
-- Lectura pública total: el catálogo de adopción es público (PWA sin login).
create policy "animals_public_select"
    on public.animals for select
    to anon, authenticated
    using (true);

-- Solo el albergue dueño puede crear animales bajo su propio shelter_id.
create policy "animals_owner_insert"
    on public.animals for insert
    to authenticated
    with check (shelter_id = auth.uid());

-- Solo el albergue dueño puede editar sus animales.
create policy "animals_owner_update"
    on public.animals for update
    to authenticated
    using (shelter_id = auth.uid())
    with check (shelter_id = auth.uid());

-- Solo el albergue dueño puede eliminar sus animales.
create policy "animals_owner_delete"
    on public.animals for delete
    to authenticated
    using (shelter_id = auth.uid());

-- ---------------------------------------------------------------------
-- 7.3 Políticas: adoption_applications
-- ---------------------------------------------------------------------
-- Cualquier visitante (incluso anónimo) puede POSTULAR (insertar) una solicitud.
-- No puede leer, editar ni borrar solicitudes ajenas: solo insertar.
create policy "applications_public_insert"
    on public.adoption_applications for insert
    to anon, authenticated
    with check (true);

-- Solo el albergue dueño del animal referenciado puede VER las solicitudes.
create policy "applications_owner_select"
    on public.adoption_applications for select
    to authenticated
    using (
        exists (
            select 1 from public.animals a
            where a.id = adoption_applications.animal_id
              and a.shelter_id = auth.uid()
        )
    );

-- Solo el albergue dueño del animal puede actualizar el estado de la solicitud
-- (pending -> reviewed -> approved/rejected).
create policy "applications_owner_update"
    on public.adoption_applications for update
    to authenticated
    using (
        exists (
            select 1 from public.animals a
            where a.id = adoption_applications.animal_id
              and a.shelter_id = auth.uid()
        )
    )
    with check (
        exists (
            select 1 from public.animals a
            where a.id = adoption_applications.animal_id
              and a.shelter_id = auth.uid()
        )
    );

-- ---------------------------------------------------------------------
-- 7.4 Políticas: telegram_subscribers
-- ---------------------------------------------------------------------
-- Nadie desde el frontend público lee la lista de suscriptores directamente
-- (eso lo hace la Edge Function con la service_role key, que ignora RLS).
-- Se permite INSERT público porque la suscripción inicial puede originarse
-- desde un webhook de Telegram ejecutado con la anon key.
create policy "subscribers_public_insert"
    on public.telegram_subscribers for insert
    to anon, authenticated
    with check (true);

-- Un albergue autenticado puede ver cuántos/quiénes son sus propios suscriptores
-- (útil para mostrar métricas en el dashboard).
create policy "subscribers_owner_select"
    on public.telegram_subscribers for select
    to authenticated
    using (shelter_id = auth.uid());

-- =====================================================================
-- 8. STORAGE: bucket para fotos de animales
-- =====================================================================
insert into storage.buckets (id, name, public)
values ('animal-photos', 'animal-photos', true)
on conflict (id) do nothing;

-- Lectura pública de fotos (para mostrarlas en el catálogo sin login).
create policy "animal_photos_public_read"
    on storage.objects for select
    to anon, authenticated
    using (bucket_id = 'animal-photos');

-- Solo usuarios autenticados (albergues) pueden subir, dentro de una carpeta
-- con su propio uid como prefijo: animal-photos/<shelter_id>/foto.jpg
create policy "animal_photos_owner_insert"
    on storage.objects for insert
    to authenticated
    with check (
        bucket_id = 'animal-photos'
        and (storage.foldername(name))[1] = auth.uid()::text
    );

create policy "animal_photos_owner_delete"
    on storage.objects for delete
    to authenticated
    using (
        bucket_id = 'animal-photos'
        and (storage.foldername(name))[1] = auth.uid()::text
    );

-- =====================================================================
-- FIN DE LA MIGRACIÓN
-- =====================================================================
