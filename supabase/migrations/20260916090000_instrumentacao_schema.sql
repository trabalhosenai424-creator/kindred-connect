-- Astra Foods | Instrumentação / Calibração
-- Execute this migration in the connected Supabase project.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null default 'consulta' check (role in ('administrador','instrumentacao','manutencao','qualidade','consulta')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.instruments (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  sector text,
  status text not null default 'Ativo' check (status in ('Ativo','Manutenção','Inativo')),
  next_calibration date,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.calibrations (
  id uuid primary key default gen_random_uuid(),
  instrument_id uuid references public.instruments(id) on delete cascade,
  instrument_label text not null,
  calibration_date date not null,
  result text not null default 'Aprovado' check (result in ('Aprovado','Reprovado')),
  next_date date,
  technician text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.maintenance (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  status text not null default 'Aberta',
  event_date date not null default current_date,
  detail text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.movements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  status text not null default 'Aberta',
  event_date date not null default current_date,
  detail text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.standards (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  status text not null default 'Ativo',
  event_date date,
  detail text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.certificates (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  status text not null default 'Válido',
  event_date date,
  detail text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.nonconformities (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  status text not null default 'Aberta' check (status in ('Aberta','Em tratamento','Concluída')),
  event_date date not null default current_date,
  detail text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  status text not null default 'Ativo',
  event_date date,
  detail text,
  storage_path text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.alert_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  days_before integer[] not null default array[30,15,7,1],
  push_enabled boolean not null default true,
  email_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.notification_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  instrument_id uuid references public.instruments(id) on delete cascade,
  type text not null,
  title text not null,
  message text not null,
  due_date date,
  read_at timestamptz,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists instruments_next_calibration_idx on public.instruments(next_calibration);
create index if not exists calibrations_next_date_idx on public.calibrations(next_date);
create index if not exists notifications_user_created_idx on public.notifications(user_id, created_at desc);
create index if not exists notification_subscriptions_user_idx on public.notification_subscriptions(user_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.email));
  insert into public.alert_preferences (user_id) values (new.id);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- updated_at triggers
drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at before update on public.profiles for each row execute procedure public.set_updated_at();
drop trigger if exists instruments_updated_at on public.instruments;
create trigger instruments_updated_at before update on public.instruments for each row execute procedure public.set_updated_at();
drop trigger if exists alert_preferences_updated_at on public.alert_preferences;
create trigger alert_preferences_updated_at before update on public.alert_preferences for each row execute procedure public.set_updated_at();
drop trigger if exists notification_subscriptions_updated_at on public.notification_subscriptions;
create trigger notification_subscriptions_updated_at before update on public.notification_subscriptions for each row execute procedure public.set_updated_at();

-- RLS: every authenticated user can work with the operational records.
alter table public.profiles enable row level security;
alter table public.instruments enable row level security;
alter table public.calibrations enable row level security;
alter table public.maintenance enable row level security;
alter table public.movements enable row level security;
alter table public.standards enable row level security;
alter table public.certificates enable row level security;
alter table public.nonconformities enable row level security;
alter table public.documents enable row level security;
alter table public.alert_preferences enable row level security;
alter table public.notification_subscriptions enable row level security;
alter table public.notifications enable row level security;

create policy "profiles own read" on public.profiles for select to authenticated using (id = auth.uid());
create policy "profiles own update" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

create policy "instruments authenticated read" on public.instruments for select to authenticated using (true);
create policy "instruments authenticated insert" on public.instruments for insert to authenticated with check (created_by = auth.uid() or created_by is null);
create policy "instruments authenticated update" on public.instruments for update to authenticated using (true) with check (true);
create policy "instruments authenticated delete" on public.instruments for delete to authenticated using (true);

create policy "calibrations authenticated read" on public.calibrations for select to authenticated using (true);
create policy "calibrations authenticated insert" on public.calibrations for insert to authenticated with check (created_by = auth.uid() or created_by is null);
create policy "calibrations authenticated update" on public.calibrations for update to authenticated using (true) with check (true);
create policy "calibrations authenticated delete" on public.calibrations for delete to authenticated using (true);

create policy "maintenance authenticated all" on public.maintenance for all to authenticated using (true) with check (true);
create policy "movements authenticated all" on public.movements for all to authenticated using (true) with check (true);
create policy "standards authenticated all" on public.standards for all to authenticated using (true) with check (true);
create policy "certificates authenticated all" on public.certificates for all to authenticated using (true) with check (true);
create policy "nonconformities authenticated all" on public.nonconformities for all to authenticated using (true) with check (true);
create policy "documents authenticated all" on public.documents for all to authenticated using (true) with check (true);

create policy "alert preferences own" on public.alert_preferences for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "subscriptions own" on public.notification_subscriptions for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "notifications own" on public.notifications for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
