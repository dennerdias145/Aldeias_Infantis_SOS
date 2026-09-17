-- ============ ENUMS ============
CREATE TYPE public.app_role AS ENUM ('user', 'super_admin');

-- ============ HELPERS ============
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE OR REPLACE FUNCTION public.normalize_txt(_t text)
RETURNS text LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT lower(regexp_replace(translate(coalesce(_t,''),
    'áàãâäéèêëíìîïóòõôöúùûüçÁÀÃÂÄÉÈÊËÍÌÎÏÓÒÕÔÖÚÙÛÜÇ',
    'aaaaaeeeeiiiiooooouuuucAAAAAEEEEIIIIOOOOOUUUUC'),
    '[^a-z0-9]+', '', 'g'));
$$;

-- ============ RESIDENCES ============
CREATE TABLE public.residences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cep text NOT NULL,
  street text NOT NULL,
  number text NOT NULL,
  complement text,
  neighborhood text NOT NULL,
  city text NOT NULL,
  state text NOT NULL,
  residence_key text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.residences TO authenticated;
GRANT ALL ON public.residences TO service_role;
ALTER TABLE public.residences ENABLE ROW LEVEL SECURITY;

-- ============ USER ROLES ============
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'user',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(auth.uid(), 'super_admin');
$$;

CREATE POLICY "roles_select_own" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

-- ============ PROFILES (public-safe) ============
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  avatar_url text,
  neighborhood text,
  city text,
  points integer NOT NULL DEFAULT 0,
  blocked boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select_auth" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid() OR public.is_admin()) WITH CHECK (id = auth.uid() OR public.is_admin());
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ PROFILE PRIVATE ============
CREATE TABLE public.profile_private (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone text,
  email text,
  residence_id uuid REFERENCES public.residences(id) ON DELETE SET NULL,
  is_primary boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_profile_private_residence ON public.profile_private(residence_id);
GRANT SELECT, UPDATE ON public.profile_private TO authenticated;
GRANT ALL ON public.profile_private TO service_role;
ALTER TABLE public.profile_private ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pp_select_own" ON public.profile_private FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.is_admin());
CREATE POLICY "pp_update_own" ON public.profile_private FOR UPDATE TO authenticated
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());

CREATE POLICY "residences_select_own" ON public.residences FOR SELECT TO authenticated
  USING (public.is_admin() OR EXISTS (
    SELECT 1 FROM public.profile_private p WHERE p.residence_id = residences.id AND p.id = auth.uid()));

-- ============ HOUSEHOLD MEMBERS ============
CREATE TABLE public.household_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  residence_id uuid NOT NULL REFERENCES public.residences(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  relationship text NOT NULL,
  birth_date date,
  phone text,
  email text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_household_residence ON public.household_members(residence_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.household_members TO authenticated;
GRANT ALL ON public.household_members TO service_role;
ALTER TABLE public.household_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "hm_all_own" ON public.household_members FOR ALL TO authenticated
  USING (user_id = auth.uid() OR public.is_admin())
  WITH CHECK (user_id = auth.uid() OR public.is_admin());

-- ============ POINT RULES / LEVELS / TRANSACTIONS ============
CREATE TABLE public.point_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action_type text NOT NULL UNIQUE,
  label text NOT NULL,
  points integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.point_rules TO authenticated;
GRANT ALL ON public.point_rules TO service_role;
ALTER TABLE public.point_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pr_select" ON public.point_rules FOR SELECT TO authenticated USING (true);
CREATE POLICY "pr_admin" ON public.point_rules FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

INSERT INTO public.point_rules (action_type, label, points) VALUES
  ('create_campaign','Criar vaquinha',50),
  ('contribute_campaign','Contribuir para vaquinha',20),
  ('donate_food','Doar alimento',30),
  ('donate_clothes','Doar roupa',20),
  ('donation_completed','Doação concluída',50),
  ('register_pet','Cadastrar pet',5),
  ('help_campaign','Ajudar em campanha comunitária',30),
  ('confirm_receipt','Confirmar recebimento de doação',10),
  ('validated_action','Ação comunitária validada',50);

CREATE TABLE public.levels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  min_points integer NOT NULL,
  max_points integer,
  sort_order integer NOT NULL DEFAULT 0
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.levels TO authenticated;
GRANT ALL ON public.levels TO service_role;
ALTER TABLE public.levels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "levels_select" ON public.levels FOR SELECT TO authenticated USING (true);
CREATE POLICY "levels_admin" ON public.levels FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

INSERT INTO public.levels (name, min_points, max_points, sort_order) VALUES
  ('Novo Morador',0,99,1),('Participante',100,299,2),('Colaborador',300,599,3),
  ('Parceiro Comunitário',600,999,4),('Embaixador Comunitário',1000,NULL,5);

CREATE TABLE public.points_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type text NOT NULL,
  points integer NOT NULL,
  reference_id uuid NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, action_type, reference_id)
);
CREATE INDEX idx_points_user ON public.points_transactions(user_id, created_at DESC);
GRANT SELECT ON public.points_transactions TO authenticated;
GRANT ALL ON public.points_transactions TO service_role;
ALTER TABLE public.points_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pt_select_own" ON public.points_transactions FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

CREATE OR REPLACE FUNCTION public.award_points(_user uuid, _action text, _ref uuid, _desc text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _pts integer; _n integer;
BEGIN
  IF _user IS NULL OR _ref IS NULL THEN RETURN; END IF;
  SELECT points INTO _pts FROM public.point_rules WHERE action_type = _action AND active;
  IF _pts IS NULL OR _pts = 0 THEN RETURN; END IF;
  INSERT INTO public.points_transactions (user_id, action_type, points, reference_id, description)
  VALUES (_user, _action, _pts, _ref, _desc) ON CONFLICT DO NOTHING;
  GET DIAGNOSTICS _n = ROW_COUNT;
  IF _n > 0 THEN UPDATE public.profiles SET points = points + _pts WHERE id = _user; END IF;
END; $$;

-- ============ NOTIFICATIONS ============
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text,
  kind text NOT NULL DEFAULT 'info',
  link text,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_notif_user ON public.notifications(user_id, created_at DESC);
GRANT SELECT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notif_own" ON public.notifications FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "notif_update_own" ON public.notifications FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "notif_delete_own" ON public.notifications FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.notify(_user uuid, _title text, _body text, _kind text, _link text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF _user IS NULL THEN RETURN; END IF;
  INSERT INTO public.notifications (user_id, title, body, kind, link) VALUES (_user, _title, _body, _kind, _link);
END; $$;

-- ============ BOOTSTRAP PROFILE (registration) ============
CREATE OR REPLACE FUNCTION public.residence_available(_cep text, _street text, _number text, _complement text, _city text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM public.residences r
    JOIN public.profile_private p ON p.residence_id = r.id AND p.is_primary
    WHERE r.residence_key = public.normalize_txt(_cep)||'-'||public.normalize_txt(_street)||'-'||
      public.normalize_txt(_number)||'-'||public.normalize_txt(_complement)||'-'||public.normalize_txt(_city)
  );
$$;

CREATE OR REPLACE FUNCTION public.bootstrap_profile()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE m jsonb; _uid uuid := auth.uid(); _key text; _res uuid; _email text;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Não autenticado'; END IF;
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = _uid) THEN RETURN jsonb_build_object('created', false); END IF;
  SELECT raw_user_meta_data, email INTO m, _email FROM auth.users WHERE id = _uid;
  m := coalesce(m, '{}'::jsonb);
  _key := public.normalize_txt(m->>'cep')||'-'||public.normalize_txt(m->>'street')||'-'||
          public.normalize_txt(m->>'number')||'-'||public.normalize_txt(m->>'complement')||'-'||
          public.normalize_txt(m->>'city');

  SELECT id INTO _res FROM public.residences WHERE residence_key = _key;
  IF _res IS NULL THEN
    INSERT INTO public.residences (cep, street, number, complement, neighborhood, city, state, residence_key)
    VALUES (coalesce(m->>'cep',''), coalesce(m->>'street',''), coalesce(m->>'number',''), m->>'complement',
            coalesce(m->>'neighborhood',''), coalesce(m->>'city',''), coalesce(m->>'state',''), _key)
    RETURNING id INTO _res;
  ELSIF EXISTS (SELECT 1 FROM public.profile_private WHERE residence_id = _res AND is_primary) THEN
    RAISE EXCEPTION 'Esta residência já possui um cadastro principal. Caso você seja morador desta residência, solicite ao responsável pelo cadastro que adicione você como dependente.';
  END IF;

  INSERT INTO public.profiles (id, full_name, neighborhood, city)
  VALUES (_uid, coalesce(m->>'full_name','Morador'), m->>'neighborhood', m->>'city');
  INSERT INTO public.profile_private (id, phone, email, residence_id, is_primary)
  VALUES (_uid, m->>'phone', _email, _res, true);
  INSERT INTO public.user_roles (user_id, role) VALUES (_uid, 'user') ON CONFLICT DO NOTHING;
  RETURN jsonb_build_object('created', true);
END; $$;