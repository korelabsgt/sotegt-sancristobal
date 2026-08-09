"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  LabelList,
  Cell,
} from "recharts";
import { useEffect, useMemo, useState } from "react";
import type { Afiliado } from "../esquemas";
import { calcularEdadNacimiento } from "../fechaNacimiento";
import { ChartHeader } from "./chartTheme";
import { useChartTheme } from "./useChartTheme";

interface Props {
  afiliados: Afiliado[];
}

export default function Edades({ afiliados }: Props) {
  const [isMobile, setIsMobile] = useState(false);
  const [hoverIndex, setHoverIndex] = useState<number | undefined>();
  const [pinnedIndex, setPinnedIndex] = useState<number | undefined>();
  const theme = useChartTheme();

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const rangos = useMemo(() => {
    const data = [
      { name: "Jóvenes (18-30)", min: 18, max: 30, hombres: 0, mujeres: 0 },
      { name: "Adultos (31-60)", min: 31, max: 60, hombres: 0, mujeres: 0 },
      { name: "Mayores (61+)", min: 61, max: 150, hombres: 0, mujeres: 0 },
    ];

    afiliados.forEach((af) => {
      const edad = calcularEdadNacimiento(af.nacimiento);
      if (edad === null) return;
      const rango = data.find((r) => edad >= r.min && edad <= r.max);
      if (rango) {
        if (af.sexo === "M") rango.hombres++;
        else rango.mujeres++;
      }
    });

    return data;
  }, [afiliados]);

  const activeIndex = hoverIndex ?? pinnedIndex;

  const totales = useMemo(
    () => ({
      hombres: rangos.reduce((sum, r) => sum + r.hombres, 0),
      mujeres: rangos.reduce((sum, r) => sum + r.mujeres, 0),
    }),
    [rangos],
  );

  const totalGeneral = totales.hombres + totales.mujeres;
  const pctTotalH =
    totalGeneral > 0 ? (totales.hombres / totalGeneral) * 100 : 0;
  const pctTotalM =
    totalGeneral > 0 ? (totales.mujeres / totalGeneral) * 100 : 0;

  const handleBarClick = (_: unknown, index: number) => {
    setPinnedIndex((prev) => (prev === index ? undefined : index));
  };

  const handleRowClick = (index: number) => {
    setPinnedIndex((prev) => (prev === index ? undefined : index));
  };

  const handleBarEnter = (_: unknown, index: number) => {
    setHoverIndex(index);
  };

  const handleInteractionLeave = () => {
    setHoverIndex(undefined);
  };

  return (
    <div className="w-full h-full flex flex-col">
      <ChartHeader
        title="Demografía del Grupo"
        subtitle="Distribución por rangos de edad y género"
      />

      <div onMouseLeave={handleInteractionLeave}>
        <div className="h-[280px] w-full shrink-0 md:h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={rangos}
              margin={{ top: 24, right: 10, left: -20, bottom: 20 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke={theme.grid}
              />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 9, fontWeight: 700, fill: theme.tick }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 9, fill: theme.tick }}
                tickFormatter={(value) => String(Math.round(Number(value)))}
                domain={[0, (max: number) => Math.ceil(max * 1.05) || 1]}
              />
              <Legend
                verticalAlign="top"
                height={40}
                iconType="circle"
                wrapperStyle={{
                  fontSize: "9px",
                  color: theme.tick,
                }}
              />
              <Bar
                dataKey="hombres"
                name="Hombres"
                fill="#3b82f6"
                radius={[8, 8, 0, 0]}
                barSize={isMobile ? 22 : 48}
                isAnimationActive={false}
                activeBar={false}
                className="cursor-pointer"
                onClick={handleBarClick}
                onMouseEnter={handleBarEnter}
              >
                {rangos.map((_, index) => (
                  <Cell
                    key={`h-${index}`}
                    fill={
                      activeIndex === undefined || activeIndex === index
                        ? "#3b82f6"
                        : "#93c5fd"
                    }
                  />
                ))}
                <LabelList
                  dataKey="hombres"
                  position="top"
                  fill={theme.hombresLabel}
                  fontSize={9}
                  fontWeight={900}
                />
              </Bar>
              <Bar
                dataKey="mujeres"
                name="Mujeres"
                fill="#ec4899"
                radius={[8, 8, 0, 0]}
                barSize={isMobile ? 22 : 48}
                isAnimationActive={false}
                activeBar={false}
                className="cursor-pointer"
                onClick={handleBarClick}
                onMouseEnter={handleBarEnter}
              >
                {rangos.map((_, index) => (
                  <Cell
                    key={`m-${index}`}
                    fill={
                      activeIndex === undefined || activeIndex === index
                        ? "#ec4899"
                        : "#f9a8d4"
                    }
                  />
                ))}
                <LabelList
                  dataKey="mujeres"
                  position="top"
                  fill={theme.mujeresLabel}
                  fontSize={9}
                  fontWeight={900}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-2 overflow-hidden rounded-lg border border-gray-100 bg-gray-50/50 dark:border-neutral-800 dark:bg-neutral-900/40">
          <table className="w-full table-fixed border-collapse text-left">
            <colgroup>
              <col className="w-[4.5rem]" />
              <col />
              <col className="w-[4.5rem]" />
            </colgroup>
            <thead>
              <tr className="border-b border-gray-200 dark:border-neutral-700">
                <th className="px-3 pb-2 pt-2 text-left text-[9px] font-bold uppercase tracking-wide text-blue-600 dark:text-blue-400 md:text-[10px]">
                  Hombres
                </th>
                <th className="px-3 pb-2 pt-2 text-center text-[9px] font-bold uppercase tracking-wide text-gray-500 dark:text-neutral-400 md:text-[10px]">
                  Rango
                </th>
                <th className="px-3 pb-2 pt-2 text-right text-[9px] font-bold uppercase tracking-wide text-pink-600 dark:text-pink-400 md:text-[10px]">
                  Mujeres
                </th>
              </tr>
            </thead>
            <tbody>
              {rangos.map((rango, index) => {
                const isActive = activeIndex === index;
                const filaTotal = rango.hombres + rango.mujeres;
                const pctH =
                  filaTotal > 0 ? (rango.hombres / filaTotal) * 100 : 0;
                const pctM =
                  filaTotal > 0 ? (rango.mujeres / filaTotal) * 100 : 0;

                return (
                  <tr
                    key={rango.name}
                    onMouseEnter={() => setHoverIndex(index)}
                    onClick={() => handleRowClick(index)}
                    className="cursor-pointer"
                  >
                    <td
                      colSpan={3}
                      className="relative border-b border-gray-100 p-0 last:border-0 dark:border-neutral-800"
                    >
                      <div
                        className={`absolute inset-0 transition-colors duration-200 ${
                          isActive
                            ? "bg-gray-100 dark:bg-neutral-800/80"
                            : "bg-transparent hover:bg-gray-50 dark:hover:bg-neutral-800/40"
                        }`}
                      />
                      <div className="relative px-3 py-2.5">
                        <div className="grid grid-cols-[4.5rem_1fr_4.5rem] items-center gap-2">
                          <span className="text-left text-xs font-black tabular-nums text-blue-600 md:text-sm">
                            {rango.hombres}
                          </span>
                          <span
                            className={`text-center text-[9px] font-bold uppercase leading-snug md:text-[10px] ${
                              isActive
                                ? "text-gray-900 dark:text-neutral-100"
                                : "text-gray-700 dark:text-neutral-300"
                            }`}
                          >
                            {rango.name}
                          </span>
                          <span className="text-right text-xs font-black tabular-nums text-pink-600 md:text-sm">
                            {rango.mujeres}
                          </span>
                        </div>
                        <div className="mt-2 flex h-1.5 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-neutral-700">
                          <div
                            className="h-full bg-blue-500 transition-[width] duration-300 ease-out"
                            style={{ width: `${pctH}%` }}
                          />
                          <div
                            className="h-full bg-pink-500 transition-[width] duration-300 ease-out"
                            style={{ width: `${pctM}%` }}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
              <tr className="border-t-2 border-gray-200 dark:border-neutral-700">
                <td
                  colSpan={3}
                  className="relative bg-gray-50/80 p-0 dark:bg-neutral-900/60"
                >
                  <div className="relative px-3 py-3">
                    <div className="grid grid-cols-[4.5rem_1fr_4.5rem] items-center gap-2">
                      <span className="text-left text-sm font-black tabular-nums text-blue-600 md:text-base">
                        {totales.hombres}
                      </span>
                      <span className="text-center text-[10px] font-black uppercase tracking-wide text-gray-800 dark:text-neutral-100 md:text-xs">
                        Total
                      </span>
                      <span className="text-right text-sm font-black tabular-nums text-pink-600 md:text-base">
                        {totales.mujeres}
                      </span>
                    </div>
                    <div className="mt-2 flex h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-neutral-700">
                      <div
                        className="h-full bg-blue-500"
                        style={{ width: `${pctTotalH}%` }}
                      />
                      <div
                        className="h-full bg-pink-500"
                        style={{ width: `${pctTotalM}%` }}
                      />
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
