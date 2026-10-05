CREATE TABLE public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL,
  actor_id uuid,
  action text NOT NULL,
  target_type text NOT NULL,
  target_id uuid,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX audit_log_ws_idx ON public.audit_log(workspace_id, created_at DESC);
GRANT SELECT ON public.audit_log TO authenticated;
GRANT ALL ON public.audit_log TO service_role;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "audit admin read" ON public.audit_log FOR SELECT TO authenticated
  USING (public.has_workspace_role(workspace_id, 'admin'::workspace_role));

CREATE OR REPLACE FUNCTION public.audit_trigger()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
declare r jsonb; ws uuid; act text; meta jsonb := '{}'::jsonb;
begin
  if TG_OP = 'DELETE' then r := to_jsonb(OLD); else r := to_jsonb(NEW); end if;
  if TG_TABLE_NAME = 'workspaces' then ws := (r->>'id')::uuid; else ws := (r->>'workspace_id')::uuid; end if;
  act := TG_TABLE_NAME || '.' || lower(TG_OP);
  if TG_TABLE_NAME = 'workspace_invites' then meta := jsonb_build_object('email', r->>'email', 'role', r->>'role');
  elsif TG_TABLE_NAME = 'workspace_members' then meta := jsonb_build_object('user_id', r->>'user_id', 'role', r->>'role');
    if TG_OP = 'UPDATE' then meta := meta || jsonb_build_object('old_role', to_jsonb(OLD)->>'role'); end if;
  elsif TG_TABLE_NAME = 'pairings' then meta := jsonb_build_object('leader_id', r->>'leader_id', 'report_id', r->>'report_id', 'active', r->>'active');
    if TG_OP = 'UPDATE' then
      if (to_jsonb(OLD)->>'leader_id') is distinct from (r->>'leader_id') then act := 'pairings.handoff';
        meta := meta || jsonb_build_object('old_leader_id', to_jsonb(OLD)->>'leader_id'); end if;
    end if;
  elsif TG_TABLE_NAME = 'templates' then meta := jsonb_build_object('name', r->>'name');
  elsif TG_TABLE_NAME = 'meetings' then meta := jsonb_build_object('held_on', r->>'held_on', 'template', r->>'template_name');
  elsif TG_TABLE_NAME = 'workspaces' then meta := jsonb_build_object('name', r->>'name');
  end if;
  if ws is not null and exists (select 1 from workspaces where id = ws) then
    insert into audit_log(workspace_id, actor_id, action, target_type, target_id, meta)
    values (ws, auth.uid(), act, TG_TABLE_NAME, (r->>'id')::uuid, meta);
  end if;
  return null;
end $$;

CREATE TRIGGER audit_members AFTER INSERT OR UPDATE OR DELETE ON public.workspace_members FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();
CREATE TRIGGER audit_invites AFTER INSERT OR DELETE ON public.workspace_invites FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();
CREATE TRIGGER audit_pairings AFTER INSERT OR UPDATE OR DELETE ON public.pairings FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();
CREATE TRIGGER audit_templates AFTER INSERT OR UPDATE OR DELETE ON public.templates FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();
CREATE TRIGGER audit_meetings AFTER DELETE ON public.meetings FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();
CREATE TRIGGER audit_workspaces AFTER UPDATE ON public.workspaces FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();

CREATE TABLE public.ai_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ai_usage_user_idx ON public.ai_usage(user_id, created_at DESC);
GRANT SELECT ON public.ai_usage TO authenticated;
GRANT ALL ON public.ai_usage TO service_role;
ALTER TABLE public.ai_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai usage own read" ON public.ai_usage FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.consume_ai_quota(_limit int DEFAULT 20)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
declare n int;
begin
  if auth.uid() is null then return false; end if;
  select count(*) into n from ai_usage where user_id = auth.uid() and created_at > now() - interval '1 hour';
  if n >= _limit then return false; end if;
  insert into ai_usage(user_id) values (auth.uid());
  delete from ai_usage where user_id = auth.uid() and created_at < now() - interval '2 days';
  return true;
end $$;

ALTER TABLE public.profiles ADD COLUMN reminder_emails boolean NOT NULL DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN last_reminder_on date;
ALTER TABLE public.workspaces ADD COLUMN onboarding_dismissed boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.delete_workspace(_ws uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
begin
  if not exists (select 1 from workspace_members where workspace_id=_ws and user_id=auth.uid() and role='owner') then
    raise exception 'only the owner can delete this workspace';
  end if;
  delete from action_items where pairing_id in (select id from pairings where workspace_id=_ws);
  delete from agenda_items where meeting_id in (select id from meetings where workspace_id=_ws);
  delete from meeting_notes where meeting_id in (select id from meetings where workspace_id=_ws);
  delete from meetings where workspace_id=_ws;
  delete from pairings where workspace_id=_ws;
  delete from templates where workspace_id=_ws;
  delete from workspace_invites where workspace_id=_ws;
  delete from workspace_members where workspace_id=_ws;
  delete from audit_log where workspace_id=_ws;
  delete from workspaces where id=_ws;
end $$;
GRANT EXECUTE ON FUNCTION public.delete_workspace(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.consume_ai_quota(int) TO authenticated;