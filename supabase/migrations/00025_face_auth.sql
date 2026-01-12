-- Add face_data column to profiles table for encrypted face recognition data
ALTER TABLE public.profiles
    ADD COLUMN face_data TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.face_data IS 'Encrypted face recognition descriptor data for secure authentication';
