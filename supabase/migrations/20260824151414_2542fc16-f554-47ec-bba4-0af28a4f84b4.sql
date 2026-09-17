-- ===== CAMPAIGNS =====
CREATE TABLE public.campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  image_url text,
  goal_amount numeric(12,2) NOT NULL CHECK (goal_amount > 0),
  current_amount numeric(12,2) NOT NULL DEFAULT 0,
  category text NOT NULL DEFAULT 'Outros',
  status text NOT NULL DEFAULT 'em_analise',
  rejection_reason text,
  start_date date NOT NULL DEFAULT current_date,
  end_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (status IN ('rascunho','em_analise','ativa','concluida','cancelada','encerrada'))
);
CREATE INDEX idx_campaigns_status ON public.campaigns(status, created_at DESC);
CREATE INDEX idx_campaigns_creator ON public.campaigns(creator_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.campaigns TO authenticated;
GRANT ALL ON public.campaigns TO service_role;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "camp_select" ON public.campaigns FOR SELECT TO authenticated
  USING (status IN ('ativa','concluida','encerrada') OR creator_id = auth.uid() OR public.is_admin());
CREATE POLICY "camp_insert_own" ON public.campaigns FOR INSERT TO authenticated
  WITH CHECK (creator_id = auth.uid() AND status IN ('rascunho','em_analise'));
CREATE POLICY "camp_update_own" ON public.campaigns FOR UPDATE TO authenticated
  USING (creator_id = auth.uid() OR public.is_admin()) WITH CHECK (creator_id = auth.uid() OR public.is_admin());
CREATE POLICY "camp_delete" ON public.campaigns FOR DELETE TO authenticated
  USING ((creator_id = auth.uid() AND status = 'rascunho') OR public.is_admin());
CREATE TRIGGER trg_campaigns_updated BEFORE UPDATE ON public.campaigns
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.campaigns_guard()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.current_amount := 0;
    RETURN NEW;
  END IF;
  IF NOT public.is_admin() THEN
    NEW.current_amount := OLD.current_amount;
    IF NEW.status IS DISTINCT FROM OLD.status
       AND NOT (OLD.status IN ('rascunho','ativa') AND NEW.status IN ('em_analise','cancelada','encerrada','concluida')) THEN
      RAISE EXCEPTION 'Alteração de status não permitida';
    END IF;
  ELSIF NEW.status = 'ativa' AND OLD.status <> 'ativa' THEN
    PERFORM public.notify(NEW.creator_id,'Vaquinha aprovada','Sua vaquinha "'||NEW.title||'" foi aprovada e já está pública.','success','/vaquinhas/'||NEW.id);
  ELSIF NEW.status = 'cancelada' AND OLD.status <> 'cancelada' THEN
    PERFORM public.notify(NEW.creator_id,'Vaquinha não aprovada','Sua vaquinha "'||NEW.title||'" foi cancelada pela moderação.','warning','/vaquinhas/'||NEW.id);
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_campaigns_guard BEFORE INSERT OR UPDATE ON public.campaigns
  FOR EACH ROW EXECUTE FUNCTION public.campaigns_guard();

CREATE OR REPLACE FUNCTION public.campaigns_after_insert()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.award_points(NEW.creator_id,'create_campaign',NEW.id,'Criou a vaquinha '||NEW.title);
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_campaigns_points AFTER INSERT ON public.campaigns
  FOR EACH ROW EXECUTE FUNCTION public.campaigns_after_insert();

CREATE TABLE public.campaign_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_campaign_updates ON public.campaign_updates(campaign_id, created_at DESC);
GRANT SELECT, INSERT, DELETE ON public.campaign_updates TO authenticated;
GRANT ALL ON public.campaign_updates TO service_role;
ALTER TABLE public.campaign_updates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cu_select" ON public.campaign_updates FOR SELECT TO authenticated USING (true);
CREATE POLICY "cu_insert" ON public.campaign_updates FOR INSERT TO authenticated
  WITH CHECK (author_id = auth.uid() AND EXISTS (SELECT 1 FROM public.campaigns c WHERE c.id = campaign_id AND (c.creator_id = auth.uid() OR public.is_admin())));
CREATE POLICY "cu_delete" ON public.campaign_updates FOR DELETE TO authenticated
  USING (author_id = auth.uid() OR public.is_admin());

CREATE TABLE public.campaign_contributions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount numeric(12,2) NOT NULL CHECK (amount > 0),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed','cancelled')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_contrib_campaign ON public.campaign_contributions(campaign_id);
CREATE INDEX idx_contrib_user ON public.campaign_contributions(user_id);
GRANT SELECT, INSERT, UPDATE ON public.campaign_contributions TO authenticated;
GRANT ALL ON public.campaign_contributions TO service_role;
ALTER TABLE public.campaign_contributions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "contrib_select" ON public.campaign_contributions FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin()
    OR EXISTS (SELECT 1 FROM public.campaigns c WHERE c.id = campaign_id AND c.creator_id = auth.uid()));
CREATE POLICY "contrib_insert_own" ON public.campaign_contributions FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND status = 'pending');
CREATE POLICY "contrib_update" ON public.campaign_contributions FOR UPDATE TO authenticated
  USING (public.is_admin() OR user_id = auth.uid()) WITH CHECK (public.is_admin() OR user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.contributions_guard()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _title text; _creator uuid;
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.amount <> OLD.amount AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Valor da contribuição não pode ser alterado';
  END IF;
  IF NEW.status = 'confirmed' AND (TG_OP = 'INSERT' OR OLD.status <> 'confirmed') THEN
    IF NOT public.is_admin() THEN RAISE EXCEPTION 'Somente a moderação pode confirmar contribuições'; END IF;
    UPDATE public.campaigns SET current_amount = current_amount + NEW.amount
      WHERE id = NEW.campaign_id RETURNING title, creator_id INTO _title, _creator;
    PERFORM public.award_points(NEW.user_id,'contribute_campaign',NEW.id,'Contribuiu com a vaquinha '||coalesce(_title,''));
    PERFORM public.notify(NEW.user_id,'Contribuição confirmada','Sua contribuição para "'||coalesce(_title,'')||'" foi confirmada.','success','/vaquinhas/'||NEW.campaign_id);
    PERFORM public.notify(_creator,'Nova contribuição confirmada','Sua vaquinha "'||coalesce(_title,'')||'" recebeu um novo apoio.','success','/vaquinhas/'||NEW.campaign_id);
  ELSIF TG_OP = 'UPDATE' AND OLD.status = 'confirmed' AND NEW.status <> 'confirmed' THEN
    IF NOT public.is_admin() THEN RAISE EXCEPTION 'Somente a moderação pode alterar contribuições confirmadas'; END IF;
    UPDATE public.campaigns SET current_amount = greatest(0, current_amount - OLD.amount) WHERE id = NEW.campaign_id;
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_contrib_guard AFTER INSERT OR UPDATE ON public.campaign_contributions
  FOR EACH ROW EXECUTE FUNCTION public.contributions_guard();

-- ===== DONATIONS =====
CREATE TABLE public.donations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  donor_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  kind text NOT NULL CHECK (kind IN ('alimento','roupa')),
  category text NOT NULL,
  description text,
  quantity numeric(10,2),
  unit text,
  photo_url text,
  condition text,
  expires_at date,
  neighborhood text NOT NULL,
  status text NOT NULL DEFAULT 'disponivel' CHECK (status IN ('disponivel','reservada','concluida','cancelada','bloqueada')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_donations_status ON public.donations(status, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.donations TO authenticated;
GRANT ALL ON public.donations TO service_role;
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "don_select" ON public.donations FOR SELECT TO authenticated
  USING (status <> 'bloqueada' OR donor_id = auth.uid() OR public.is_admin());
CREATE POLICY "don_insert_own" ON public.donations FOR INSERT TO authenticated WITH CHECK (donor_id = auth.uid());
CREATE POLICY "don_update_own" ON public.donations FOR UPDATE TO authenticated
  USING (donor_id = auth.uid() OR public.is_admin()) WITH CHECK (donor_id = auth.uid() OR public.is_admin());
CREATE POLICY "don_delete_own" ON public.donations FOR DELETE TO authenticated
  USING (donor_id = auth.uid() OR public.is_admin());
CREATE TRIGGER trg_donations_updated BEFORE UPDATE ON public.donations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.donations_after_insert()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.award_points(NEW.donor_id,
    CASE WHEN NEW.kind = 'alimento' THEN 'donate_food' ELSE 'donate_clothes' END,
    NEW.id, 'Cadastrou a doação '||NEW.title);
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_donations_points AFTER INSERT ON public.donations
  FOR EACH ROW EXECUTE FUNCTION public.donations_after_insert();

CREATE TABLE public.donation_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  donation_id uuid NOT NULL REFERENCES public.donations(id) ON DELETE CASCADE,
  requester_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','completed','cancelled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (donation_id, requester_id)
);
CREATE INDEX idx_dreq_donation ON public.donation_requests(donation_id);
GRANT SELECT, INSERT, UPDATE ON public.donation_requests TO authenticated;
GRANT ALL ON public.donation_requests TO service_role;
ALTER TABLE public.donation_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "dreq_select" ON public.donation_requests FOR SELECT TO authenticated
  USING (requester_id = auth.uid() OR public.is_admin()
    OR EXISTS (SELECT 1 FROM public.donations d WHERE d.id = donation_id AND d.donor_id = auth.uid()));
CREATE POLICY "dreq_insert_own" ON public.donation_requests FOR INSERT TO authenticated
  WITH CHECK (requester_id = auth.uid() AND status = 'pending'
    AND NOT EXISTS (SELECT 1 FROM public.donations d WHERE d.id = donation_id AND d.donor_id = auth.uid()));
CREATE POLICY "dreq_update" ON public.donation_requests FOR UPDATE TO authenticated
  USING (requester_id = auth.uid() OR public.is_admin()
    OR EXISTS (SELECT 1 FROM public.donations d WHERE d.id = donation_id AND d.donor_id = auth.uid()))
  WITH CHECK (requester_id = auth.uid() OR public.is_admin()
    OR EXISTS (SELECT 1 FROM public.donations d WHERE d.id = donation_id AND d.donor_id = auth.uid()));

CREATE OR REPLACE FUNCTION public.donation_requests_flow()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _donor uuid; _title text;
BEGIN
  SELECT donor_id, title INTO _donor, _title FROM public.donations WHERE id = NEW.donation_id;
  IF TG_OP = 'INSERT' THEN
    PERFORM public.notify(_donor,'Nova solicitação de doação','Alguém solicitou "'||coalesce(_title,'')||'".','info','/doacoes/'||NEW.donation_id);
    RETURN NEW;
  END IF;
  IF NEW.status = 'approved' AND OLD.status <> 'approved' THEN
    UPDATE public.donations SET status = 'reservada' WHERE id = NEW.donation_id AND status = 'disponivel';
    PERFORM public.notify(NEW.requester_id,'Solicitação aceita','Sua solicitação para "'||coalesce(_title,'')||'" foi aceita.','success','/doacoes/'||NEW.donation_id);
  ELSIF NEW.status = 'rejected' AND OLD.status <> 'rejected' THEN
    PERFORM public.notify(NEW.requester_id,'Solicitação recusada','Sua solicitação para "'||coalesce(_title,'')||'" foi recusada.','warning','/doacoes/'||NEW.donation_id);
  ELSIF NEW.status = 'completed' AND OLD.status <> 'completed' THEN
    UPDATE public.donations SET status = 'concluida' WHERE id = NEW.donation_id;
    PERFORM public.award_points(_donor,'donation_completed',NEW.id,'Doação concluída: '||coalesce(_title,''));
    PERFORM public.award_points(NEW.requester_id,'confirm_receipt',NEW.id,'Confirmou o recebimento de '||coalesce(_title,''));
    PERFORM public.notify(_donor,'Doação concluída','A entrega de "'||coalesce(_title,'')||'" foi confirmada.','success','/doacoes/'||NEW.donation_id);
    PERFORM public.notify(NEW.requester_id,'Doação concluída','Obrigado por confirmar o recebimento de "'||coalesce(_title,'')||'".','success','/doacoes/'||NEW.donation_id);
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_dreq_flow AFTER INSERT OR UPDATE ON public.donation_requests
  FOR EACH ROW EXECUTE FUNCTION public.donation_requests_flow();

-- ===== PETS =====
CREATE TABLE public.pets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  species text NOT NULL CHECK (species IN ('cachorro','gato','ave','outro')),
  breed text,
  sex text,
  birth_date date,
  size text,
  color text,
  photo_url text,
  extra_photos text[],
  traits text,
  has_microchip boolean NOT NULL DEFAULT false,
  microchip text,
  notes text,
  emergency_contact text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_pets_owner ON public.pets(owner_user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pets TO authenticated;
GRANT ALL ON public.pets TO service_role;
ALTER TABLE public.pets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pets_own" ON public.pets FOR ALL TO authenticated
  USING (owner_user_id = auth.uid() OR public.is_admin())
  WITH CHECK (owner_user_id = auth.uid() OR public.is_admin());

CREATE OR REPLACE FUNCTION public.pets_after_insert()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.award_points(NEW.owner_user_id,'register_pet',NEW.id,'Cadastrou o pet '||NEW.name);
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_pets_points AFTER INSERT ON public.pets
  FOR EACH ROW EXECUTE FUNCTION public.pets_after_insert();

CREATE TABLE public.missing_pets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id uuid REFERENCES public.pets(id) ON DELETE SET NULL,
  owner_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  species text NOT NULL,
  breed text,
  photo_url text,
  traits text,
  last_seen_area text NOT NULL,
  last_seen_date date NOT NULL,
  last_seen_time text,
  notes text,
  contact_phone text,
  status text NOT NULL DEFAULT 'desaparecido' CHECK (status IN ('desaparecido','encontrado','encerrado','bloqueado')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_missing_status ON public.missing_pets(status, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.missing_pets TO authenticated;
GRANT ALL ON public.missing_pets TO service_role;
ALTER TABLE public.missing_pets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mp_select" ON public.missing_pets FOR SELECT TO authenticated
  USING (status <> 'bloqueado' OR owner_user_id = auth.uid() OR public.is_admin());
CREATE POLICY "mp_insert_own" ON public.missing_pets FOR INSERT TO authenticated WITH CHECK (owner_user_id = auth.uid());
CREATE POLICY "mp_update_own" ON public.missing_pets FOR UPDATE TO authenticated
  USING (owner_user_id = auth.uid() OR public.is_admin()) WITH CHECK (owner_user_id = auth.uid() OR public.is_admin());
CREATE POLICY "mp_delete_own" ON public.missing_pets FOR DELETE TO authenticated
  USING (owner_user_id = auth.uid() OR public.is_admin());
CREATE TRIGGER trg_missing_updated BEFORE UPDATE ON public.missing_pets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.pet_sightings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  missing_pet_id uuid NOT NULL REFERENCES public.missing_pets(id) ON DELETE CASCADE,
  reporter_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  description text NOT NULL,
  approximate_location text NOT NULL,
  photo_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_sightings_pet ON public.pet_sightings(missing_pet_id, created_at DESC);
GRANT SELECT, INSERT, DELETE ON public.pet_sightings TO authenticated;
GRANT ALL ON public.pet_sightings TO service_role;
ALTER TABLE public.pet_sightings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sight_select" ON public.pet_sightings FOR SELECT TO authenticated USING (true);
CREATE POLICY "sight_insert" ON public.pet_sightings FOR INSERT TO authenticated WITH CHECK (reporter_user_id = auth.uid());
CREATE POLICY "sight_delete" ON public.pet_sightings FOR DELETE TO authenticated
  USING (reporter_user_id = auth.uid() OR public.is_admin());

CREATE OR REPLACE FUNCTION public.sightings_notify()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _owner uuid; _name text;
BEGIN
  SELECT owner_user_id, name INTO _owner, _name FROM public.missing_pets WHERE id = NEW.missing_pet_id;
  PERFORM public.notify(_owner,'Novo avistamento','Alguém informou um avistamento de '||coalesce(_name,'seu pet')||'.','info','/pets-desaparecidos/'||NEW.missing_pet_id);
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_sightings_notify AFTER INSERT ON public.pet_sightings
  FOR EACH ROW EXECUTE FUNCTION public.sightings_notify();

-- ===== SERVICE PROVIDERS =====
CREATE TABLE public.service_providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  category text NOT NULL,
  description text,
  phone text,
  whatsapp text,
  photo_url text,
  neighborhood text NOT NULL,
  work_hours text,
  status text NOT NULL DEFAULT 'em_analise' CHECK (status IN ('em_analise','ativo','inativo','bloqueado')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_providers_status ON public.service_providers(status, category);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.service_providers TO authenticated;
GRANT ALL ON public.service_providers TO service_role;
ALTER TABLE public.service_providers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sp_select" ON public.service_providers FOR SELECT TO authenticated
  USING (status = 'ativo' OR user_id = auth.uid() OR public.is_admin());
CREATE POLICY "sp_insert_own" ON public.service_providers FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND status = 'em_analise');
CREATE POLICY "sp_update_own" ON public.service_providers FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.is_admin()) WITH CHECK (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "sp_delete_own" ON public.service_providers FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());
CREATE TRIGGER trg_providers_updated BEFORE UPDATE ON public.service_providers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.service_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL REFERENCES public.service_providers(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provider_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.service_reviews TO authenticated;
GRANT ALL ON public.service_reviews TO service_role;
ALTER TABLE public.service_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sr_select" ON public.service_reviews FOR SELECT TO authenticated USING (true);
CREATE POLICY "sr_write_own" ON public.service_reviews FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "sr_update_own" ON public.service_reviews FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "sr_delete_own" ON public.service_reviews FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

CREATE TABLE public.content_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entity text NOT NULL,
  entity_id uuid NOT NULL,
  reason text NOT NULL,
  status text NOT NULL DEFAULT 'aberta' CHECK (status IN ('aberta','em_analise','resolvida','arquivada')),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.content_reports TO authenticated;
GRANT ALL ON public.content_reports TO service_role;
ALTER TABLE public.content_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cr_select" ON public.content_reports FOR SELECT TO authenticated
  USING (reporter_id = auth.uid() OR public.is_admin());
CREATE POLICY "cr_insert" ON public.content_reports FOR INSERT TO authenticated WITH CHECK (reporter_id = auth.uid());
CREATE POLICY "cr_update_admin" ON public.content_reports FOR UPDATE TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ===== DEMANDS =====
CREATE TABLE public.community_demands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  category text NOT NULL,
  photo_url text,
  approximate_location text,
  status text NOT NULL DEFAULT 'registrada' CHECK (status IN ('registrada','em_analise','em_andamento','resolvida','arquivada')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_demands_status ON public.community_demands(status, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.community_demands TO authenticated;
GRANT ALL ON public.community_demands TO service_role;
ALTER TABLE public.community_demands ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cd_select" ON public.community_demands FOR SELECT TO authenticated
  USING (status <> 'arquivada' OR user_id = auth.uid() OR public.is_admin());
CREATE POLICY "cd_insert_own" ON public.community_demands FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND status = 'registrada');
CREATE POLICY "cd_update" ON public.community_demands FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.is_admin()) WITH CHECK (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "cd_delete" ON public.community_demands FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());
CREATE TRIGGER trg_demands_updated BEFORE UPDATE ON public.community_demands
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.demands_notify()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    PERFORM public.notify(NEW.user_id,'Demanda atualizada','A demanda "'||NEW.title||'" agora está: '||NEW.status,'info','/demandas');
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_demands_notify AFTER UPDATE ON public.community_demands
  FOR EACH ROW EXECUTE FUNCTION public.demands_notify();

-- ===== CONFIDENTIAL REPORTS =====
CREATE TABLE public.confidential_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category text NOT NULL,
  description text NOT NULL,
  approximate_location text,
  status text NOT NULL DEFAULT 'recebido' CHECK (status IN ('recebido','em_analise','encaminhado','encerrado')),
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.confidential_reports TO authenticated;
GRANT ALL ON public.confidential_reports TO service_role;
ALTER TABLE public.confidential_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "conf_select" ON public.confidential_reports FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "conf_insert_own" ON public.confidential_reports FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "conf_update_admin" ON public.confidential_reports FOR UPDATE TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE TRIGGER trg_conf_updated BEFORE UPDATE ON public.confidential_reports
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ===== AUDIT LOGS =====
CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity text NOT NULL,
  entity_id uuid,
  details jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_created ON public.audit_logs(created_at DESC);
GRANT SELECT, INSERT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "audit_select_admin" ON public.audit_logs FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "audit_insert_admin" ON public.audit_logs FOR INSERT TO authenticated
  WITH CHECK (public.is_admin() AND actor_id = auth.uid());

-- ===== STORAGE POLICIES =====
CREATE POLICY "media_auth_read" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'media');
CREATE POLICY "media_auth_insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'media' AND owner = auth.uid());
CREATE POLICY "media_auth_update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'media' AND owner = auth.uid());
CREATE POLICY "media_auth_delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'media' AND owner = auth.uid());