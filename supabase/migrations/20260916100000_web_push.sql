-- Astra Foods | Web Push + rotina de alertas
-- A rotina diária é executada pelo pg_cron e chama a Edge Function.

create extension if not exists pg_cron;
create extension if not exists pg_net;

alter table public.notifications
  add column if not exists dedupe_key text;

create unique index if not exists notifications_dedupe_key_uidx
  on public.notifications(dedupe_key)
  where dedupe_key is not null;

-- O job é criado depois que os secrets project_url e cron_secret forem cadastrados no Vault.
-- Para evitar uma chamada quebrada em projetos que ainda não possuem esses secrets,
-- a criação do job fica disponível no script abaixo, para ser executada após a configuração.

create or replace function public.schedule_calibration_alerts()
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  job_id bigint;
begin
  select cron.unschedule(jobid)
  from cron.job
  where jobname = 'astra-calibration-alerts-daily';

  select cron.schedule(
    'astra-calibration-alerts-daily',
    '0 11 * * *',
    $$
      select net.http_post(
        url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url') || '/functions/v1/send-calibration-alerts',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret')
        ),
        body := jsonb_build_object('source', 'pg_cron', 'run_at', now())
      ) as request_id;
    $$
  ) into job_id;

  return job_id;
end;
$$;

comment on function public.schedule_calibration_alerts() is
  'Cria/recria o job diário que chama a Edge Function de alertas. Execute após configurar Vault secrets project_url e cron_secret.';
