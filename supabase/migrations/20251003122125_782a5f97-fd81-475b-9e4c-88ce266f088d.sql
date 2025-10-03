-- Drop the existing public access policy
DROP POLICY IF EXISTS "Anyone can view doctors" ON public.doctors;

-- Create a new policy that requires authentication to view doctor information
CREATE POLICY "Authenticated users can view doctors" 
ON public.doctors 
FOR SELECT 
TO authenticated
USING (true);

-- Add comment explaining the security measure
COMMENT ON POLICY "Authenticated users can view doctors" ON public.doctors IS 
'Requires authentication to protect sensitive doctor contact information (email, phone, address) from public scraping';