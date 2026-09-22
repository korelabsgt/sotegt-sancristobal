ALTER TABLE public.info_perfil
ADD COLUMN IF NOT EXISTS coordinador_id uuid;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'info_perfil_coordinador_id_fkey'
  ) THEN
    ALTER TABLE public.info_perfil
    ADD CONSTRAINT info_perfil_coordinador_id_fkey
    FOREIGN KEY (coordinador_id)
    REFERENCES public.info_perfil (user_id)
    ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS info_perfil_coordinador_id_idx
ON public.info_perfil (coordinador_id);
