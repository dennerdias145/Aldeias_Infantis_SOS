REVOKE ALL ON FUNCTION public.campaigns_guard() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.campaigns_after_insert() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.contributions_guard() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.donations_after_insert() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.donation_requests_flow() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.pets_after_insert() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.sightings_notify() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.demands_notify() FROM PUBLIC, anon, authenticated;