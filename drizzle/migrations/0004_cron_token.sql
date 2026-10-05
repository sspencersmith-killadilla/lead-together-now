CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon, authenticated;
CREATE TABLE IF NOT EXISTS private.cron_tokens (name text PRIMARY KEY, token text NOT NULL);
INSERT INTO private.cron_tokens(name, token) SELECT 'reminders', encode(extensions.gen_random_bytes(32), 'hex')
  ON CONFLICT (name) DO NOTHING;
CREATE OR REPLACE FUNCTION public.verify_cron_token(_name text, _token text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = private, public AS $$
  select exists (select 1 from private.cron_tokens where name=_name and token=_token)
$$;
REVOKE ALL ON FUNCTION public.verify_cron_token(text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.verify_cron_token(text, text) TO service_role;