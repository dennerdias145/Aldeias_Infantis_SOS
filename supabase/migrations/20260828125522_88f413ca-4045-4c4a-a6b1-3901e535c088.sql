CREATE TABLE public.aldeias_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_label text,
  action text NOT NULL,
  entity text NOT NULL,
  entity_id uuid,
  details jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_aldeias_audit_created ON public.aldeias_audit_logs(created_at DESC);
GRANT SELECT, INSERT ON public.aldeias_audit_logs TO authenticated;
GRANT ALL ON public.aldeias_audit_logs TO service_role;
ALTER TABLE public.aldeias_audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "audit read wide" ON public.aldeias_audit_logs FOR SELECT TO authenticated USING (public.is_staff_wide());
CREATE POLICY "audit insert staff" ON public.aldeias_audit_logs FOR INSERT TO authenticated WITH CHECK (public.is_staff() AND actor_id = auth.uid());