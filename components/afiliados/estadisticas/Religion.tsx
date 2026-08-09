"use client";

import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Afiliado } from "../esquemas";
import { CHART_PALETTE, ChartHeader, ChartFooter } from "./chartTheme";
import { useChartTheme } from "./useChartTheme";

interface Props {
  afiliados: Afiliado[];
}

export default function Religiones({ afiliados }: Props) {
  const theme = useChartTheme();
  const [activo, setActivo] = useState<string | null>(null);

  const conteo: Record<string, number> = {};

  afiliados.forEach((afiliado) => {
    const rel = afiliado.religion || "Sin especificar";
    conteo[rel] = (conteo[rel] || 0) + 1;
  });

  const datosPadron = Object.entries(conteo)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value], index) => ({
      name,
      value,
      color: CHART_PALETTE[index % CHART_PALETTE.length],
    }));

  const tieneDatos = afiliados.length > 0;
  const datosGrafica = tieneDatos
    ? datosPadron.filter((d) => d.value > 0)
    : [{ name: "Sin registros", value: 1, color: theme.empty }];

  const total = afiliados.length;
  const datosDonut = datosGrafica.filter((d) => d.name !== "Sin registros");
  const itemActivo = datosDonut.find((d) => d.name === activo) ?? null;

  return (
    <div className="w-full h-full flex flex-col min-h-[400px]">
      <ChartHeader
        title="Estadística de Religión"
        subtitle="Distribución porcentual del grupo"
      />

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="flex-1 flex flex-col md:flex-row gap-4 md:gap-6 w-full items-stretch min-h-[280px]"
      >
        <div className="relative w-full md:w-[260px] h-[260px] shrink-0 mx-auto md:mx-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={datosGrafica}
                cx="50%"
                cy="50%"
                innerRadius="56%"
                outerRadius="88%"
                paddingAngle={datosDonut.length > 1 ? 5 : 0}
                cornerRadius={10}
                dataKey="value"
                stroke={theme.stroke}
                strokeWidth={4}
                onMouseEnter={(_, i) => {
                  const item = datosGrafica[i];
                  if (item?.name !== "Sin registros")
                    setActivo(item?.name ?? null);
                }}
                onMouseLeave={() => setActivo(null)}
              >
                {datosGrafica.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color}
                    opacity={
                      entry.name === "Sin registros" ||
                      activo === null ||
                      activo === entry.name
                        ? 1
                        : 0.3
                    }
                    style={{ transition: "opacity 0.3s ease" }}
                  />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>

          {tieneDatos && (
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none px-4">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 dark:text-neutral-500">
                Total
              </span>
              <span className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white tabular-nums leading-none">
                {total}
              </span>
              <AnimatePresence>
                {itemActivo && (
                  <motion.div
                    key={itemActivo.name}
                    initial={{ opacity: 0, y: 8, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: "auto" }}
                    exit={{ opacity: 0, y: 8, height: 0 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className="flex flex-col items-center gap-0.5 mt-2 overflow-hidden text-center max-w-[130px]"
                  >
                    <span className="text-[9px] font-semibold text-gray-500 dark:text-neutral-400 leading-tight line-clamp-2">
                      {itemActivo.name}
                    </span>
                    <span
                      className="text-sm font-black tabular-nums"
                      style={{ color: itemActivo.color }}
                    >
                      {total > 0
                        ? ((itemActivo.value / total) * 100).toFixed(0)
                        : 0}
                      % · {itemActivo.value}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        {datosDonut.length > 0 ? (
          <div className="flex-1 overflow-hidden rounded-lg border border-gray-100 bg-gray-50/50 dark:border-neutral-800 dark:bg-neutral-900/40">
            <table className="w-full table-fixed border-collapse text-left">
              <colgroup>
                <col />
                <col className="w-[3.5rem]" />
                <col className="w-[3rem]" />
              </colgroup>
              <thead>
                <tr className="border-b border-gray-200 dark:border-neutral-700">
                  <th className="px-3 pb-2 pt-2 text-[9px] font-bold uppercase tracking-wide text-gray-500 dark:text-neutral-400 md:text-[10px]">
                    Categoría
                  </th>
                  <th className="px-3 pb-2 pt-2 text-right text-[9px] font-bold uppercase tracking-wide text-gray-500 dark:text-neutral-400 md:text-[10px]">
                    Cant.
                  </th>
                  <th className="px-3 pb-2 pt-2 text-right text-[9px] font-bold uppercase tracking-wide text-gray-500 dark:text-neutral-400 md:text-[10px]">
                    %
                  </th>
                </tr>
              </thead>
              <tbody>
                {datosDonut.map((d) => {
                  const pct =
                    total > 0 ? ((d.value / total) * 100).toFixed(0) : "0";
                  const esActivo = activo === d.name;
                  return (
                    <tr
                      key={d.name}
                      onMouseEnter={() => setActivo(d.name)}
                      onMouseLeave={() => setActivo(null)}
                      className={`cursor-default border-b border-gray-100 last:border-0 dark:border-neutral-800 ${
                        esActivo
                          ? "bg-white dark:bg-neutral-800/80"
                          : "hover:bg-gray-50 dark:hover:bg-neutral-800/40"
                      }`}
                    >
                      <td className="px-3 py-2.5">
                        <div className="flex min-w-0 items-center gap-2">
                          <span
                            className="h-2.5 w-2.5 shrink-0 rounded-full"
                            style={{ backgroundColor: d.color }}
                          />
                          <span className="truncate text-[9px] font-bold uppercase leading-snug text-gray-700 dark:text-neutral-300 md:text-[10px]">
                            {d.name}
                          </span>
                        </div>
                      </td>
                      <td
                        className="px-3 py-2.5 text-right text-xs font-black tabular-nums md:text-sm"
                        style={{ color: d.color }}
                      >
                        {d.value}
                      </td>
                      <td className="px-3 py-2.5 text-right text-[10px] font-semibold tabular-nums text-gray-500 dark:text-neutral-400 md:text-xs">
                        {pct}%
                      </td>
                    </tr>
                  );
                })}
                <tr className="border-t-2 border-gray-200 dark:border-neutral-700">
                  <td className="px-3 py-2.5 text-[10px] font-black uppercase text-gray-800 dark:text-neutral-100">
                    Total
                  </td>
                  <td className="px-3 py-2.5 text-right text-xs font-black tabular-nums text-gray-900 dark:text-white md:text-sm">
                    {total}
                  </td>
                  <td className="px-3 py-2.5 text-right text-[10px] font-black tabular-nums text-gray-800 dark:text-neutral-100 md:text-xs">
                    100%
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-xs text-gray-400 dark:text-neutral-500 italic">
            Sin registros de religión
          </div>
        )}
      </motion.div>

      <ChartFooter>
        <p className="text-gray-500 dark:text-neutral-400">
          Total de registros: {afiliados.length}
        </p>
      </ChartFooter>
    </div>
  );
}
