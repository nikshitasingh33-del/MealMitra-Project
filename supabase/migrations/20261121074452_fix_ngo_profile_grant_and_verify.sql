/*
# Fix NGO profile insert grant + add registration_number + demo verification

## Problems
1. The INSERT grant on ngo_profiles only covered (org_name, address, city,
   contact_person, service_area, capacity_kg) — it was MISSING user_id. Since
   user_id is the primary key and NOT NULL, every client insert failed with a
   42501 permission error (silently swallowed by the registration code).
2. NGOs had no way to edit their profile after registration if it was missing
   or incomplete.
3. No safe way to verify a test NGO for development without an admin account.

## Changes
1. Add `registration_number` column to ngo_profiles (nullable text) — FIRST,
   before granting on it.
2. REVOKE the broken INSERT/UPDATE grants and re-GRANT on all needed columns
   including user_id and registration_number.
3. Add a `demo_verify_ngo` SECURITY DEFINER function that verifies a single
   NGO by email — intended for testing only.
*/

-- 1. Add registration_number column FIRST
ALTER TABLE public.ngo_profiles
  ADD COLUMN IF NOT EXISTS registration_number text;

-- 2. Fix grants: revoke broken ones, re-grant with user_id included
REVOKE INSERT ON public.ngo_profiles FROM authenticated;
REVOKE UPDATE ON public.ngo_profiles FROM authenticated;

GRANT INSERT (user_id, org_name, address, city, contact_person, service_area, capacity_kg, registration_number)
  ON public.ngo_profiles TO authenticated;

GRANT UPDATE (org_name, address, city, contact_person, service_area, capacity_kg, registration_number)
  ON public.ngo_profiles TO authenticated;

-- 3. Demo verification function (for testing — not auto-verify)
CREATE OR REPLACE FUNCTION public.demo_verify_ngo(p_email text)
RETURNS public.ngo_profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.ngo_profiles;
  v_target_uid uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT id INTO v_target_uid FROM auth.users WHERE email = p_email;
  IF v_target_uid IS NULL THEN
    RAISE EXCEPTION 'No user found with that email';
  END IF;

  UPDATE public.ngo_profiles
    SET verification_status = 'verified', verified_at = now()
    WHERE user_id = v_target_uid
    RETURNING * INTO v_row;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No NGO profile found for that user';
  END IF;

  RETURN v_row;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.demo_verify_ngo(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.demo_verify_ngo(text) TO authenticated;
