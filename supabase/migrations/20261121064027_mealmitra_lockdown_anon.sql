/*
# Lock down anon access (authenticated-only app)

MealMitra requires sign-in for all data access. The default Supabase project
grants ALL on public tables to the `anon` role, which would let unauthenticated
requests read/write every table. This migration revokes anon privileges on all
MealMitra tables and the available_donations view, leaving only `authenticated`
(and service_role) access. RLS policies are already authenticated-only, so this
brings grants in line with policies.
*/

REVOKE ALL ON public.profiles FROM anon;
REVOKE ALL ON public.ngo_profiles FROM anon;
REVOKE ALL ON public.donations FROM anon;
REVOKE ALL ON public.donation_status_log FROM anon;
REVOKE ALL ON public.available_donations FROM anon;

-- Keep service_role access for edge functions / admin operations
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ngo_profiles TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.donations TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.donation_status_log TO service_role;
GRANT SELECT ON public.available_donations TO service_role;
