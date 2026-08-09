"use client";

import { useMemo, useState, useEffect } from "react";
import type { Afiliado } from "../esquemas";
import { useQuery } from "@tanstack/react-query";
import { obtenerSectoresAction } from "../forms/afiliados/catalogos";
import { ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ChartHeader } from "./chartTheme";
import BarrasHorizontales from "./BarrasHorizontales";

interface Props {
  afiliados: Afiliado[];
}

export default function Lugares({ afiliados }: Props) {
  const [expandedSectors, setExpandedSectors] = useState<
    Record<string, boolean>
  >({});

  const { data: sectores } = useQuery({
    queryKey: ["sectores"],
    queryFn: () => obtenerSectoresAction(),
  });

  const toggleSector = (sectorName: string) => {
    setExpandedSectors((prev) => ({
      ...prev,
      [sectorName]: !prev[sectorName],
    }));
  };

  const datosPorSector = useMemo(() => {
    const porSector: Record<
      string,
      { name: string; value: number; sector_id: number }[]
    > = {};
    const sectorIds: Record<string, number> = {};

    if (sectores) {
      sectores.forEach((s) => {
        porSector[s.nombre] = [];
        sectorIds[s.nombre] = s.id;
      });
    }

    const conteo: Record<
      string,
      { count: number; sector: string; sector_id: number }
    > = {};
    afiliados.forEach((af) => {
      const lugar = af.lugar_nombre || "Sin Especificar";
      const sector = af.sector_nombre || "Sin Clasificar";
      const sector_id = af.sector_id ?? 0;
      if (!conteo[lugar]) conteo[lugar] = { count: 0, sector, sector_id };
      conteo[lugar].count++;
    });

    Object.entries(conteo).forEach(([lugar, { count, sector, sector_id }]) => {
      if (!porSector[sector]) {
        porSector[sector] = [];
        sectorIds[sector] = sector_id;
      }
      porSector[sector].push({ name: lugar, value: count, sector_id });
    });

    const sectoresOrdenados = Object.keys(porSector).sort((a, b) => {
      const idA = sectorIds[a] ?? 0;
      const idB = sectorIds[b] ?? 0;
      if (idA === 0 && idB !== 0) return 1;
      if (idB === 0 && idA !== 0) return -1;
      return idA - idB;
    });

    return sectoresOrdenados.map((sectorName) => {
      const lugaresDelSector = porSector[sectorName];
      const sectorId = sectorIds[sectorName] ?? 0;
      const totalReal = lugaresDelSector.reduce((s, l) => s + l.value, 0);
      lugaresDelSector.sort((a, b) => b.value - a.value);

      return {
        sectorName,
        sectorId,
        totalReal,
        lugares: lugaresDelSector,
      };
    });
  }, [afiliados, sectores]);

  useEffect(() => {
    if (
      datosPorSector.length > 0 &&
      Object.keys(expandedSectors).length === 0
    ) {
      const first = datosPorSector[0]?.sectorName;
      if (first) setExpandedSectors({ [first]: true });
    }
  }, [datosPorSector, expandedSectors]);

  return (
    <div className="w-full h-full flex flex-col">
      <ChartHeader
        title="Ubicación de los Afiliados"
        subtitle="Lugares con mayor presencia"
      />

      <div className="flex-1 w-full overflow-y-auto pb-2 space-y-3 pr-1 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-neutral-700 scrollbar-track-transparent max-h-[min(60vh,640px)]">
        {datosPorSector.map((sectorData) => {
          const isExpanded = expandedSectors[sectorData.sectorName] ?? false;
          return (
            <div
              key={sectorData.sectorName}
              className="border border-gray-200 dark:border-neutral-700/80 rounded-xl overflow-hidden bg-white dark:bg-neutral-900/40 shadow-sm"
            >
              <button
                type="button"
                onClick={() => toggleSector(sectorData.sectorName)}
                className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-neutral-800/80 hover:bg-gray-100 dark:hover:bg-neutral-700/50 transition-colors"
              >
                <div className="flex flex-col items-start text-left gap-0.5">
                  <span className="text-sm md:text-base text-gray-900 dark:text-neutral-100">
                    {sectorData.sectorId === 0 ? (
                      <span className="text-indigo-600 dark:text-indigo-400 font-bold uppercase">
                        {sectorData.sectorName}
                      </span>
                    ) : (
                      <>
                        <span className="text-indigo-600 dark:text-indigo-400 font-bold uppercase">
                          Sector {sectorData.sectorId}:{" "}
                        </span>
                        <span className="text-gray-800 dark:text-neutral-200">
                          {sectorData.sectorName}
                        </span>
                      </>
                    )}
                  </span>
                  <span className="text-[10px] font-bold text-gray-500 dark:text-neutral-500 uppercase tracking-wide">
                    {sectorData.totalReal} personas ·{" "}
                    {sectorData.lugares.length} lugares
                  </span>
                </div>
                <div className="p-2 bg-white dark:bg-neutral-900/60 rounded-full border border-gray-200 dark:border-neutral-700 shadow-sm">
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-gray-600 dark:text-neutral-300" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-600 dark:text-neutral-300" />
                  )}
                </div>
              </button>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: "easeInOut" }}
                    className="border-t border-gray-200 dark:border-neutral-700/80 overflow-hidden"
                  >
                    <div className="p-3">
                      <BarrasHorizontales
                        items={sectorData.lugares}
                        total={sectorData.totalReal}
                        labelColumna="Lugar"
                        accentColor="#6366f1"
                        emptyLabel="No hay registros en este sector"
                        maxHeightClass="max-h-none"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
