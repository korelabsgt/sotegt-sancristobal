ALTER TABLE public.sis_configuracion
ADD COLUMN IF NOT EXISTS logo_url text,
ADD COLUMN IF NOT EXISTS partido_url text;
