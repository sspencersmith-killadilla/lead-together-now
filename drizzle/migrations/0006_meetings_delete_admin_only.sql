DROP POLICY "meetings delete" ON public.meetings;
CREATE POLICY "meetings admin delete" ON public.meetings
  FOR DELETE TO authenticated
  USING (public.has_workspace_role(workspace_id, 'admin'::public.workspace_role));
COMMENT ON POLICY "meetings admin delete" ON public.meetings IS 'Records retention: only workspace owners/admins may delete 1-on-1 sessions; deletions are recorded in audit_log.';