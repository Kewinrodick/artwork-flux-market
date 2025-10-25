-- Fix profiles public exposure - require authentication for profile viewing
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

CREATE POLICY "Authenticated users can view profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

-- Create private storage bucket for designs
INSERT INTO storage.buckets (id, name, public)
VALUES ('designs', 'designs', false)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS policies for design uploads
CREATE POLICY "Designers can upload designs"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'designs' AND
    (SELECT has_role(auth.uid(), 'designer'))
  );

CREATE POLICY "Designers can delete own designs"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'designs' AND
    owner = auth.uid()
  );

CREATE POLICY "Authenticated users can view designs"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'designs');