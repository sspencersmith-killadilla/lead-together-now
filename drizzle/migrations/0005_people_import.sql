alter table public.workspace_invites add column if not exists manager_email text, add column if not exists display_name text;

create or replace function public.link_import_pairings(_ws uuid)
returns integer language plpgsql security definer set search_path to 'public' as $$
declare n int := 0; r record;
begin
  for r in
    select distinct lu.id as leader, ru.id as report
    from workspace_invites i
    join auth.users ru on lower(ru.email)=lower(i.email)
    join auth.users lu on lower(lu.email)=lower(i.manager_email)
    where i.workspace_id=_ws and i.manager_email is not null and lu.id<>ru.id
      and exists(select 1 from workspace_members m where m.workspace_id=_ws and m.user_id=ru.id)
      and exists(select 1 from workspace_members m where m.workspace_id=_ws and m.user_id=lu.id)
  loop
    insert into pairings(workspace_id, leader_id, report_id) values (_ws, r.leader, r.report)
      on conflict (workspace_id, leader_id, report_id) do nothing;
    if found then n := n+1; end if;
  end loop;
  return n;
end $$;
revoke all on function public.link_import_pairings(uuid) from public, anon, authenticated;

create or replace function public.accept_invites()
returns integer language plpgsql security definer set search_path to 'public' as $$
declare n int := 0; r record; em text;
begin
  select email into em from auth.users where id=auth.uid();
  for r in select * from workspace_invites where lower(email)=lower(em) and accepted_at is null loop
    insert into workspace_members(workspace_id,user_id,role) values (r.workspace_id, auth.uid(), r.role)
      on conflict (workspace_id,user_id) do nothing;
    update workspace_invites set accepted_at=now() where id=r.id;
    perform public.link_import_pairings(r.workspace_id);
    n := n+1;
  end loop;
  return n;
end $$;

-- Import a reviewed list of people. Admin only. Existing members are not re-invited,
-- but their manager link is kept so the pairing appears once both people have joined.
create or replace function public.import_people(_ws uuid, _rows jsonb)
returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare r jsonb; em text; mgr text; nm text; rl workspace_role; is_mem boolean; new_ids uuid[] := '{}'; iid uuid; skipped int := 0; linked int;
begin
  if not has_workspace_role(_ws, 'admin') then raise exception 'Only owners and admins can import people.'; end if;
  if jsonb_array_length(_rows) > 2000 then raise exception 'Please import at most 2,000 people at a time.'; end if;
  for r in select * from jsonb_array_elements(_rows) loop
    em := lower(trim(r->>'email'));
    if em is null or em !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then skipped := skipped+1; continue; end if;
    mgr := nullif(lower(trim(coalesce(r->>'manager_email',''))), '');
    nm := nullif(trim(coalesce(r->>'name','')), '');
    rl := case when r->>'role' = 'admin' then 'admin'::workspace_role else 'member'::workspace_role end;
    select exists(select 1 from workspace_members m join auth.users u on u.id=m.user_id
                  where m.workspace_id=_ws and lower(u.email)=em) into is_mem;
    if exists(select 1 from workspace_invites where workspace_id=_ws and lower(email)=em and accepted_at is null) then
      update workspace_invites set manager_email=coalesce(mgr, manager_email), display_name=coalesce(nm, display_name)
        where workspace_id=_ws and lower(email)=em and accepted_at is null;
      skipped := skipped+1; continue;
    end if;
    insert into workspace_invites(workspace_id, email, role, invited_by, manager_email, display_name, accepted_at)
      values (_ws, em, rl, auth.uid(), mgr, nm, case when is_mem then now() end)
      returning id into iid;
    if not is_mem then new_ids := new_ids || iid; end if;
  end loop;
  linked := public.link_import_pairings(_ws);
  return jsonb_build_object('invite_ids', to_jsonb(new_ids), 'skipped', skipped, 'pairings', linked);
end $$;
revoke all on function public.import_people(uuid, jsonb) from public, anon;
grant execute on function public.import_people(uuid, jsonb) to authenticated;