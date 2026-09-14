import { esRolCoordinador } from "@/components/afiliados/esquemas";

type ConfigMetas = {
  meta_por_lider?: number | null;
  meta_celula?: number | null;
  meta_celula_minima?: number | null;
  meta_por_coordinador?: number | null;
  meta_coordinador_minima?: number | null;
};

export function metasPorRol(
  config: ConfigMetas | null | undefined,
  rol?: string | null,
) {
  const metaLider = config?.meta_por_lider ?? config?.meta_celula ?? 15;
  const minLider = config?.meta_celula_minima ?? 10;
  if (esRolCoordinador(rol)) {
    const metaCoord = config?.meta_por_coordinador ?? 0;
    const minCoord = config?.meta_coordinador_minima ?? 0;
    return {
      meta: metaCoord > 0 ? metaCoord : metaLider,
      min: minCoord > 0 ? minCoord : minLider,
    };
  }
  return { meta: metaLider, min: minLider };
}
