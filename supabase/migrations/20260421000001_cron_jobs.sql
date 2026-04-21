-- Enable pg_cron and pg_net extensions (required for HTTP-based cron jobs)
create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

-- Grant usage so cron can call net functions
grant usage on schema cron to postgres;
grant all privileges on all tables in schema cron to postgres;

-- 1) Sync Plaid transactions every 6 hours
select cron.schedule(
  'plaid-sync-transactions',
  '0 */6 * * *',  -- every 6 hours at minute 0
  $$
  select net.http_post(
    url := 'https://rhghtegxlamvhxytwomx.supabase.co/functions/v1/plaid-sync-transactions',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := '{}'::jsonb
  );
  $$
);

-- 2) Process monthly charges on the LAST day of each month at 6:00 PM UTC
--    Runs daily at 6 PM but only fires the charge if tomorrow is the 1st
select cron.schedule(
  'process-monthly-charges',
  '0 18 * * *',  -- every day at 6 PM UTC
  $$
  do $body$
  begin
    -- Only run if tomorrow is the 1st (meaning today is the last day of the month)
    if extract(day from now() + interval '1 day') = 1 then
      perform net.http_post(
        url := 'https://rhghtegxlamvhxytwomx.supabase.co/functions/v1/process-monthly-charges',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
        ),
        body := '{}'::jsonb
      );
    end if;
  end
  $body$;
  $$
);
