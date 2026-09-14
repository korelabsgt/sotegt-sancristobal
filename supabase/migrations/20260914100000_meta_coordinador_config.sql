ALTER TABLE public.sis_configuracion
ADD COLUMN IF NOT EXISTS meta_por_coordinador INT8 NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS meta_coordinador_minima INT8 NOT NULL DEFAULT 0;
