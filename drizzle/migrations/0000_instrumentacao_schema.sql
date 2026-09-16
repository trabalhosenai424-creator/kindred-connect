create table public.instruments (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  name text not null,
  sector text,
  status text not null default 'Ativo',
  next_calibration date,
  created_by uuid,
  created_at timestamptz not null default now()
);

create table public.calibrations (
  id uuid primary key default gen_random_uuid(),
  instrument_id uuid references public.instruments(id) on delete set null,
  instrument_label text not null,
  calibration_date date not null,
  result text not null default 'Aprovado',
  next_date date,
  technician text,
  created_by uuid,
  created_at timestamptz not null default now()
);

create table public.alert_preferences (
  user_id uuid primary key,
  days_before int[] not null default '{30,15,7,1}',
  push_enabled boolean not null default true,
  updated_at timestamptz not null default now()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  instrument_id uuid,
  type text not null,
  title text not null,
  message text not null,
  due_date date,
  sent_at timestamptz,
  dedupe_key text unique,
  created_at timestamptz not null default now()
);

create table public.notification_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now()
);

grant select, insert, update, delete on public.instruments to authenticated;
grant select, insert, update, delete on public.calibrations to authenticated;
grant select, insert, update, delete on public.alert_preferences to authenticated;
grant select, insert, update, delete on public.notifications to authenticated;
grant select, insert, update, delete on public.notification_subscriptions to authenticated;
grant all on public.instruments to service_role;
grant all on public.calibrations to service_role;
grant all on public.alert_preferences to service_role;
grant all on public.notifications to service_role;
grant all on public.notification_subscriptions to service_role;

alter table public.instruments enable row level security;
alter table public.calibrations enable row level security;
alter table public.alert_preferences enable row level security;
alter table public.notifications enable row level security;
alter table public.notification_subscriptions enable row level security;

create policy "Equipe gerencia instrumentos"
  on public.instruments for all
  to authenticated
  using (true) with check (true);

create policy "Equipe gerencia calibracoes"
  on public.calibrations for all
  to authenticated
  using (true) with check (true);

create policy "Usuario gerencia suas preferencias"
  on public.alert_preferences for all
  to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Usuario le suas notificacoes"
  on public.notifications for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Sistema insere notificacoes"
  on public.notifications for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Usuario atualiza suas notificacoes"
  on public.notifications for update
  to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Usuario gerencia suas assinaturas push"
  on public.notification_subscriptions for all
  to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);