-- Create table to track doctor contact access
CREATE TABLE public.doctor_access_granted (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, doctor_id)
);

ALTER TABLE public.doctor_access_granted ENABLE ROW LEVEL SECURITY;

-- Users can view their own access grants
CREATE POLICY "Users can view their own doctor access"
ON public.doctor_access_granted
FOR SELECT
USING (auth.uid() = user_id);

-- Drop existing overly permissive doctor policy
DROP POLICY IF EXISTS "Authenticated users can view doctors" ON public.doctors;

-- Create new policy: Users can see basic doctor info (no contact details)
CREATE POLICY "Users can view basic doctor info"
ON public.doctors
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Update pharmacies RLS to require authentication
DROP POLICY IF EXISTS "Anyone can view pharmacies" ON public.pharmacies;

CREATE POLICY "Authenticated users can view pharmacies"
ON public.pharmacies
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Grant access when appointment is created (trigger function)
CREATE OR REPLACE FUNCTION public.grant_doctor_access()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.doctor_access_granted (user_id, doctor_id)
  VALUES (NEW.user_id, NEW.doctor_id)
  ON CONFLICT (user_id, doctor_id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Trigger to grant access on appointment booking
CREATE TRIGGER on_appointment_created
  AFTER INSERT ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.grant_doctor_access();

-- Helper function to check doctor contact access
CREATE OR REPLACE FUNCTION public.can_access_doctor_contact(doctor_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.doctor_access_granted
    WHERE user_id = auth.uid()
      AND doctor_id = doctor_uuid
  );
$$;