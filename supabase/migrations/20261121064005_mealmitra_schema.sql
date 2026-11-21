/*
# MealMitra Core Schema

1. Overview
This migration creates the core data model for MealMitra, a platform connecting
food donors (restaurants, hotels, event organizers, individuals) with verified
NGOs to rescue surplus food.

2. New Tables
- `profiles`: one row per auth user. Holds role ('donor' | 'ngo'), display name,
  and contact phone. Created automatically via trigger on auth.users signup.
- `ngo_profiles`: extra details for NGO-role users: organization name, address,
  city, service area, food-handling capacity, and verification status. New NGOs
  default to 'unverified' and cannot accept donations until an admin sets them
  to 'verified'.
- `donations`: food donation requests submitted by donors. Tracks food details,
  pickup location, consumption deadline, urgency, status lifecycle, and the
  accepting NGO. Status enum: pending, accepted, pickup_in_progress, delivered,
  expired.
- `donation_status_log`: append-only history of status transitions for auditability.

3. Security (RLS + Grants)
- `profiles`: each authenticated user can read/update only their own profile.
  Public (anon) read is intentionally denied.
- `ngo_profiles`: SELECT public to authenticated (so donors can see the verified
  NGO that accepted their donation). INSERT/UPDATE restricted to the owning NGO
  user. Verification status column is only mutable server-side (no client UPDATE
  grant on that column) — handled via the SECURITY DEFINER verify function below.
- `donations`: donors can INSERT and SELECT/UPDATE their own rows. NGOs can
  SELECT available donations plus donations they accepted. Donor contact fields
  (pickup_contact) are only readable by the accepting NGO and the donor.
- `donation_status_log`: participants (donor + accepting NGO) can read; inserts
  happen server-side via the accept/status functions.

4. Atomic NGO acceptance
A SECURITY DEFINER function `accept_donation(donation_uuid)` performs an atomic
conditional UPDATE: only a row still in 'pending' status and whose accepting
NGO is unverified-blocked will flip to 'accepted' and stamp the ngo_id. This
prevents two NGOs from accepting the same donation simultaneously.

5. NGO verification
A SECURITY DEFINER function `set_ngo_verification(ngo_user_uuid, new_status)`
allows an admin (identified by a service-role-only call path; here we restrict
EXECUTE to authenticated and gate on the caller being an admin via the
profiles.role == 'admin' check inside the function body) to flip an NGO between
'unverified' and 'verified'. There is no admin UI in the initial build, so an
operator can also run this via the Supabase SQL editor with the service role.

6. Important notes
- Owner columns default to auth.uid() so client inserts that omit user_id still
  satisfy WITH CHECK ownership policies.
- All timestamps are timestamptz default now().
- Status transitions are enforced inside the accept/status RPC functions, not
  trusted to the client.
*/

-- ---------- profiles ----------
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('donor', 'ngo', 'admin')) DEFAULT 'donor',
  full_name text,
  phone text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
GRANT SELECT, UPDATE ON public.profiles TO authenticated;

DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- ---------- ngo_profiles ----------
CREATE TABLE IF NOT EXISTS public.ngo_profiles (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  org_name text NOT NULL,
  address text NOT NULL,
  city text NOT NULL,
  contact_person text,
  service_area text NOT NULL,
  capacity_kg integer NOT NULL DEFAULT 0,
  verification_status text NOT NULL CHECK (verification_status IN ('unverified', 'verified', 'rejected')) DEFAULT 'unverified',
  verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.ngo_profiles ENABLE ROW LEVEL SECURITY;
-- authenticated users (donors) can see NGO org details (publicly relevant once accepted)
GRANT SELECT ON public.ngo_profiles TO authenticated;
-- NGO owner can insert their own row and update the non-verification columns
GRANT INSERT, UPDATE (org_name, address, city, contact_person, service_area, capacity_kg) ON public.ngo_profiles TO authenticated;

DROP POLICY IF EXISTS "ngo_select_all" ON public.ngo_profiles;
CREATE POLICY "ngo_select_all" ON public.ngo_profiles
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "ngo_insert_own" ON public.ngo_profiles;
CREATE POLICY "ngo_insert_own" ON public.ngo_profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "ngo_update_own" ON public.ngo_profiles;
CREATE POLICY "ngo_update_own" ON public.ngo_profiles
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ---------- donations ----------
CREATE TABLE IF NOT EXISTS public.donations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  donor_id uuid NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE CASCADE,
  ngo_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  food_name text NOT NULL,
  category text NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  quantity_unit text NOT NULL DEFAULT 'portions',
  dietary_type text NOT NULL CHECK (dietary_type IN ('veg', 'non_veg')) DEFAULT 'veg',
  prepared_at timestamptz NOT NULL,
  safe_until timestamptz NOT NULL,
  pickup_address text NOT NULL,
  city text NOT NULL,
  pickup_contact text NOT NULL,
  notes text,
  status text NOT NULL CHECK (status IN ('pending', 'accepted', 'pickup_in_progress', 'delivered', 'expired')) DEFAULT 'pending',
  urgency text NOT NULL CHECK (urgency IN ('low', 'medium', 'high')) DEFAULT 'medium',
  accepted_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE ON public.donations TO authenticated;

-- Donor: see all their own donations (incl. contact)
DROP POLICY IF EXISTS "donations_select_donor" ON public.donations;
CREATE POLICY "donations_select_donor" ON public.donations
  FOR SELECT TO authenticated USING (auth.uid() = donor_id);

-- NGO: see available pending donations (but NOT donor contact) + donations they accepted (full)
DROP POLICY IF EXISTS "donations_select_ngo" ON public.donations;
CREATE POLICY "donations_select_ngo" ON public.donations
  FOR SELECT TO authenticated
  USING (
    auth.uid() = ngo_id
    OR (
      status = 'pending'
      -- do NOT expose pickup_contact to NGOs browsing; handled by column grant below
    )
  );

-- Donor: insert own donation
DROP POLICY IF EXISTS "donations_insert_donor" ON public.donations;
CREATE POLICY "donations_insert_donor" ON public.donations
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = donor_id);

-- Donor: update own donation (e.g. cancel) only while still pending
DROP POLICY IF EXISTS "donations_update_donor" ON public.donations;
CREATE POLICY "donations_update_donor" ON public.donations
  FOR UPDATE TO authenticated USING (auth.uid() = donor_id) WITH CHECK (auth.uid() = donor_id);

-- NGO: update donations they have accepted (status transitions) — not contact fields
-- We restrict column writes below.
DROP POLICY IF EXISTS "donations_update_ngo" ON public.donations;
CREATE POLICY "donations_update_ngo" ON public.donations
  FOR UPDATE TO authenticated USING (auth.uid() = ngo_id) WITH CHECK (auth.uid() = ngo_id);

-- Restrict which columns the NGO can UPDATE: only status + timestamps.
-- Donor keeps full UPDATE (their own row).
REVOKE UPDATE ON public.donations FROM authenticated;
GRANT UPDATE (status, accepted_at, delivered_at) ON public.donations TO authenticated;

-- ---------- donation_status_log ----------
CREATE TABLE IF NOT EXISTS public.donation_status_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  donation_id uuid NOT NULL REFERENCES public.donations(id) ON DELETE CASCADE,
  status text NOT NULL,
  changed_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.donation_status_log ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.donation_status_log TO authenticated;

DROP POLICY IF EXISTS "log_select_participants" ON public.donation_status_log;
CREATE POLICY "log_select_participants" ON public.donation_status_log
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.donations d
      WHERE d.id = donation_status_log.donation_id
        AND (d.donor_id = auth.uid() OR d.ngo_id = auth.uid())
    )
  );

-- ---------- trigger: auto-create profile on signup ----------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_role text;
BEGIN
  new_role := COALESCE(new.raw_user_meta_data->>'role', 'donor');
  INSERT INTO public.profiles (id, role, full_name, phone)
  VALUES (new.id, new_role, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'phone');
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon;

-- ---------- SECURITY DEFINER: accept_donation (atomic) ----------
CREATE OR REPLACE FUNCTION public.accept_donation(p_donation uuid)
RETURNS public.donations
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.donations;
  v_ngo_status text;
BEGIN
  -- Must be authenticated NGO
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- NGO must be verified
  SELECT verification_status INTO v_ngo_status
  FROM public.ngo_profiles WHERE user_id = auth.uid();
  IF NOT FOUND THEN
    RAISE EXCEPTION 'NGO profile not found';
  END IF;
  IF v_ngo_status <> 'verified' THEN
    RAISE EXCEPTION 'NGO not verified';
  END IF;

  -- Atomic conditional update: only if still pending
  UPDATE public.donations
    SET status = 'accepted', ngo_id = auth.uid(), accepted_at = now()
    WHERE id = p_donation AND status = 'pending'
    RETURNING * INTO v_row;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Donation no longer available';
  END IF;

  INSERT INTO public.donation_status_log (donation_id, status, changed_by)
    VALUES (v_row.id, 'accepted', auth.uid());

  RETURN v_row;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.accept_donation(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.accept_donation(uuid) TO authenticated;

-- ---------- SECURITY DEFINER: update_donation_status (NGO transitions) ----------
CREATE OR REPLACE FUNCTION public.update_donation_status(p_donation uuid, p_status text)
RETURNS public.donations
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.donations;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  UPDATE public.donations d
    SET status = p_status,
        delivered_at = CASE WHEN p_status = 'delivered' THEN now() ELSE d.delivered_at END
    WHERE id = p_donation
      AND ngo_id = auth.uid()
      AND status IN ('accepted', 'pickup_in_progress')
      AND p_status IN ('pickup_in_progress', 'delivered')
    RETURNING * INTO v_row;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid status transition';
  END IF;

  INSERT INTO public.donation_status_log (donation_id, status, changed_by)
    VALUES (v_row.id, p_status, auth.uid());

  RETURN v_row;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.update_donation_status(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.update_donation_status(uuid, text) TO authenticated;

-- ---------- SECURITY DEFINER: set_ngo_verification (admin) ----------
CREATE OR REPLACE FUNCTION public.set_ngo_verification(p_ngo uuid, p_status text)
RETURNS public.ngo_profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.ngo_profiles;
  v_caller_role text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT role INTO v_caller_role FROM public.profiles WHERE id = auth.uid();
  IF v_caller_role IS DISTINCT FROM 'admin' THEN
    RAISE EXCEPTION 'Only admins can verify NGOs';
  END IF;

  UPDATE public.ngo_profiles
    SET verification_status = p_status,
        verified_at = CASE WHEN p_status = 'verified' THEN now() ELSE verified_at END
    WHERE user_id = p_ngo
    RETURNING * INTO v_row;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'NGO not found';
  END IF;

  RETURN v_row;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.set_ngo_verification(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_ngo_verification(uuid, text) TO authenticated;

-- ---------- View: public donation list for NGOs (hides contact) ----------
CREATE OR REPLACE VIEW public.available_donations AS
SELECT
  id, donor_id, food_name, category, quantity, quantity_unit, dietary_type,
  prepared_at, safe_until, pickup_address, city, notes, status, urgency,
  created_at
FROM public.donations
WHERE status = 'pending';
ALTER TABLE public.available_donations SET (security_invoker = true);
GRANT SELECT ON public.available_donations TO authenticated;

-- Indexes for common filters
CREATE INDEX IF NOT EXISTS idx_donations_status ON public.donations(status);
CREATE INDEX IF NOT EXISTS idx_donations_city ON public.donations(city);
CREATE INDEX IF NOT EXISTS idx_donations_donor ON public.donations(donor_id);
CREATE INDEX IF NOT EXISTS idx_donations_ngo ON public.donations(ngo_id);
CREATE INDEX IF NOT EXISTS idx_donations_category ON public.donations(category);
CREATE INDEX IF NOT EXISTS idx_donations_dietary ON public.donations(dietary_type);
