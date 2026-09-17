CREATE TYPE public.staff_role AS ENUM ('admin','professional','coordination');

-- ============ EQUIPE ============
CREATE TABLE public.staff_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  email text,
  job_title text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.staff_profiles TO authenticated;
GRANT ALL ON public.staff_profiles TO service_role;
ALTER TABLE public.staff_profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.staff_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.staff_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.staff_roles TO authenticated;
GRANT ALL ON public.staff_roles TO service_role;
ALTER TABLE public.staff_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_staff_role(_user_id uuid, _role public.staff_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.staff_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.is_staff_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_staff_role(auth.uid(), 'admin');
$$;

CREATE OR REPLACE FUNCTION public.is_staff_wide()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_staff_role(auth.uid(), 'admin') OR public.has_staff_role(auth.uid(), 'coordination');
$$;

CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.staff_roles WHERE user_id = auth.uid());
$$;

-- ============ FAMILIAS ============
CREATE TABLE public.families (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  internal_code text NOT NULL UNIQUE,
  name text NOT NULL,
  contact_name text,
  situation text NOT NULL DEFAULT 'ativa',
  responsible_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  access_code text NOT NULL UNIQUE,
  notes text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.families TO authenticated;
GRANT ALL ON public.families TO service_role;
ALTER TABLE public.families ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.family_professionals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (family_id, user_id)
);
GRANT SELECT, INSERT, DELETE ON public.family_professionals TO authenticated;
GRANT ALL ON public.family_professionals TO service_role;
ALTER TABLE public.family_professionals ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.can_access_family(_family_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.is_staff_wide()
      OR EXISTS (SELECT 1 FROM public.families f WHERE f.id = _family_id AND f.responsible_id = auth.uid())
      OR EXISTS (SELECT 1 FROM public.family_professionals fp WHERE fp.family_id = _family_id AND fp.user_id = auth.uid());
$$;

CREATE TABLE public.family_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  name text NOT NULL,
  relationship text,
  birth_date date,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.family_members TO authenticated;
GRANT ALL ON public.family_members TO service_role;
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;

-- ============ COMPROMISSOS ============
CREATE TABLE public.commitments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  guidance text,
  kind text NOT NULL DEFAULT 'acompanhamento',
  scheduled_at timestamptz NOT NULL,
  due_date date,
  priority text NOT NULL DEFAULT 'media',
  status text NOT NULL DEFAULT 'pendente',
  requires_confirmation boolean NOT NULL DEFAULT true,
  responsible_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  notes text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_commitments_family ON public.commitments(family_id);
CREATE INDEX idx_commitments_sched ON public.commitments(scheduled_at);
CREATE INDEX idx_commitments_status ON public.commitments(status);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.commitments TO authenticated;
GRANT ALL ON public.commitments TO service_role;
ALTER TABLE public.commitments ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.commitment_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  commitment_id uuid NOT NULL REFERENCES public.commitments(id) ON DELETE CASCADE,
  author_kind text NOT NULL DEFAULT 'professional',
  author_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  from_status text,
  to_status text,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_cupdates_commitment ON public.commitment_updates(commitment_id);
GRANT SELECT, INSERT ON public.commitment_updates TO authenticated;
GRANT ALL ON public.commitment_updates TO service_role;
ALTER TABLE public.commitment_updates ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  commitment_id uuid REFERENCES public.commitments(id) ON DELETE CASCADE,
  sender_kind text NOT NULL,
  sender_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  body text,
  audio_path text,
  audio_seconds integer,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_messages_family ON public.messages(family_id);
CREATE INDEX idx_messages_commitment ON public.messages(commitment_id);
GRANT SELECT, INSERT ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.aldeias_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  family_id uuid REFERENCES public.families(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text,
  kind text NOT NULL DEFAULT 'info',
  link text,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_aldeias_notif_user ON public.aldeias_notifications(user_id);
CREATE INDEX idx_aldeias_notif_family ON public.aldeias_notifications(family_id);
GRANT SELECT, UPDATE ON public.aldeias_notifications TO authenticated;
GRANT ALL ON public.aldeias_notifications TO service_role;
ALTER TABLE public.aldeias_notifications ENABLE ROW LEVEL SECURITY;

-- ============ POLITICAS ============
CREATE POLICY "staff read profiles" ON public.staff_profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "own profile insert" ON public.staff_profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "own profile update" ON public.staff_profiles FOR UPDATE TO authenticated USING (id = auth.uid() OR public.is_staff_admin()) WITH CHECK (id = auth.uid() OR public.is_staff_admin());

CREATE POLICY "staff read roles" ON public.staff_roles FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_staff_wide());

CREATE POLICY "families read" ON public.families FOR SELECT TO authenticated USING (public.can_access_family(id));
CREATE POLICY "families insert" ON public.families FOR INSERT TO authenticated WITH CHECK (public.is_staff());
CREATE POLICY "families update" ON public.families FOR UPDATE TO authenticated USING (public.can_access_family(id)) WITH CHECK (public.can_access_family(id));
CREATE POLICY "families delete" ON public.families FOR DELETE TO authenticated USING (public.is_staff_admin());

CREATE POLICY "fp read" ON public.family_professionals FOR SELECT TO authenticated USING (public.can_access_family(family_id) OR user_id = auth.uid());
CREATE POLICY "fp insert" ON public.family_professionals FOR INSERT TO authenticated WITH CHECK (public.is_staff_wide() OR public.can_access_family(family_id));
CREATE POLICY "fp delete" ON public.family_professionals FOR DELETE TO authenticated USING (public.is_staff_wide());

CREATE POLICY "members read" ON public.family_members FOR SELECT TO authenticated USING (public.can_access_family(family_id));
CREATE POLICY "members insert" ON public.family_members FOR INSERT TO authenticated WITH CHECK (public.can_access_family(family_id));
CREATE POLICY "members update" ON public.family_members FOR UPDATE TO authenticated USING (public.can_access_family(family_id)) WITH CHECK (public.can_access_family(family_id));
CREATE POLICY "members delete" ON public.family_members FOR DELETE TO authenticated USING (public.can_access_family(family_id));

CREATE POLICY "commitments read" ON public.commitments FOR SELECT TO authenticated USING (public.can_access_family(family_id));
CREATE POLICY "commitments insert" ON public.commitments FOR INSERT TO authenticated WITH CHECK (public.can_access_family(family_id));
CREATE POLICY "commitments update" ON public.commitments FOR UPDATE TO authenticated USING (public.can_access_family(family_id)) WITH CHECK (public.can_access_family(family_id));
CREATE POLICY "commitments delete" ON public.commitments FOR DELETE TO authenticated USING (public.is_staff_wide());

CREATE POLICY "cupdates read" ON public.commitment_updates FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.commitments c WHERE c.id = commitment_id AND public.can_access_family(c.family_id)));
CREATE POLICY "cupdates insert" ON public.commitment_updates FOR INSERT TO authenticated WITH CHECK (author_id = auth.uid() AND EXISTS (SELECT 1 FROM public.commitments c WHERE c.id = commitment_id AND public.can_access_family(c.family_id)));

CREATE POLICY "messages read" ON public.messages FOR SELECT TO authenticated USING (public.can_access_family(family_id));
CREATE POLICY "messages insert" ON public.messages FOR INSERT TO authenticated WITH CHECK (sender_kind = 'professional' AND sender_id = auth.uid() AND public.can_access_family(family_id));

CREATE POLICY "notif read" ON public.aldeias_notifications FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "notif update" ON public.aldeias_notifications FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ============ FUNCOES DE APOIO ============
CREATE OR REPLACE FUNCTION public.bootstrap_staff()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid uuid := auth.uid(); _email text; _name text; _role public.staff_role;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Não autenticado'; END IF;
  SELECT email, coalesce(raw_user_meta_data->>'full_name', split_part(email,'@',1))
    INTO _email, _name FROM auth.users WHERE id = _uid;
  INSERT INTO public.staff_profiles (id, full_name, email)
  VALUES (_uid, coalesce(_name,'Profissional'), _email)
  ON CONFLICT (id) DO UPDATE SET email = excluded.email;
  IF NOT EXISTS (SELECT 1 FROM public.staff_roles WHERE user_id = _uid) THEN
    IF EXISTS (SELECT 1 FROM public.staff_roles WHERE role = 'admin') THEN
      _role := 'professional';
    ELSE
      _role := 'admin';
    END IF;
    INSERT INTO public.staff_roles (user_id, role) VALUES (_uid, _role) ON CONFLICT DO NOTHING;
  END IF;
  RETURN jsonb_build_object('ok', true);
END; $$;
REVOKE ALL ON FUNCTION public.bootstrap_staff() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.bootstrap_staff() TO authenticated;

CREATE OR REPLACE FUNCTION public.refresh_overdue_commitments()
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE public.commitments
     SET status = 'atrasado', updated_at = now()
   WHERE status IN ('pendente','confirmado')
     AND coalesce((due_date + time '23:59')::timestamptz, scheduled_at) < now();
$$;
REVOKE ALL ON FUNCTION public.refresh_overdue_commitments() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.refresh_overdue_commitments() TO authenticated;

CREATE TRIGGER trg_families_updated BEFORE UPDATE ON public.families FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_commitments_updated BEFORE UPDATE ON public.commitments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_staffprof_updated BEFORE UPDATE ON public.staff_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();