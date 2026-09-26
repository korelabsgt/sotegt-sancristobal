"use client";

import { Building2, UsersRound, type LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import {
  PiBriefcaseDuotone,
  PiMedalDuotone,
  PiShieldCheckDuotone,
} from "react-icons/pi";
import type { IconType } from "react-icons";

interface Props {
  totalSede: number;
  totalLideres: number;
  totalEmpleados?: number;
  totalCoordinadores?: number;
  totalAdministrativos?: number;
  objetivoTotal?: number;
  mostrarSede?: boolean;
  mostrarEmpleados?: boolean;
  mostrarCoordinadores?: boolean;
  mostrarAdministrativos?: boolean;
}

type Segmento = {
  key: string;
  label: string;
  labelCorto: string;
  valor: number;
  mostrar: boolean;
  barra: string;
  texto: string;
  pill: string;
  Icon: LucideIcon | IconType;
};

function pctParte(valor: number, total: number) {
  if (total <= 0) return 0;
  return (valor / total) * 100;
}

function textoPct(valor: number, total: number) {
  const p = pctParte(valor, total);
  if (p === 0) return "0%";
  if (p < 10) return `${p.toFixed(1)}%`;
  return `${Math.round(p)}%`;
}

export default function MetaGeneral({
  totalSede,
  totalLideres,
  totalEmpleados = 0,
  totalCoordinadores = 0,
  totalAdministrativos = 0,
  objetivoTotal = 0,
  mostrarSede = true,
  mostrarEmpleados = false,
  mostrarCoordinadores = false,
  mostrarAdministrativos = false,
}: Props) {
  const segmentos: Segmento[] = [
    {
      key: "sede",
      label: "Sede",
      labelCorto: "Sede",
      valor: totalSede,
      mostrar: mostrarSede,
      barra: "bg-blue-600",
      texto: "text-blue-700 dark:text-blue-400",
      pill: "bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-200",
      Icon: Building2,
    },
    {
      key: "coord",
      label: "Coordinadores",
      labelCorto: "Coord.",
      valor: totalCoordinadores,
      mostrar: mostrarCoordinadores,
      barra: "bg-cyan-500",
      texto: "text-cyan-600 dark:text-cyan-400",
      pill: "bg-cyan-100 text-cyan-800 dark:bg-cyan-950/70 dark:text-cyan-200",
      Icon: UsersRound,
    },
    {
      key: "enlaces",
      label: "Enlaces",
      labelCorto: "Enlaces",
      valor: totalLideres,
      mostrar: true,
      barra: "bg-orange-500",
      texto: "text-orange-600 dark:text-orange-400",
      pill: "bg-orange-100 text-orange-800 dark:bg-orange-950/70 dark:text-orange-200",
      Icon: PiMedalDuotone,
    },
    {
      key: "empleados",
      label: "Empleados",
      labelCorto: "Emp.",
      valor: totalEmpleados,
      mostrar: mostrarEmpleados,
      barra: "bg-violet-500",
      texto: "text-violet-600 dark:text-violet-400",
      pill: "bg-violet-100 text-violet-800 dark:bg-violet-950/70 dark:text-violet-200",
      Icon: PiBriefcaseDuotone,
    },
    {
      key: "admin",
      label: "Administrativos",
      labelCorto: "Admin.",
      valor: totalAdministrativos,
      mostrar: mostrarAdministrativos,
      barra: "bg-indigo-500",
      texto: "text-indigo-600 dark:text-indigo-400",
      pill: "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/70 dark:text-indigo-200",
      Icon: PiShieldCheckDuotone,
    },
  ];

  const visibles = segmentos.filter((s) => s.mostrar);
  const total = visibles.reduce((acc, s) => acc + s.valor, 0);
  const objetivo = objetivoTotal > 0 ? objetivoTotal : 0;
  const pctBarra = (n: number) =>
    objetivo > 0 ? Math.min((n / objetivo) * 100, 100) : 0;
  const progreso =
    objetivo > 0 ? Math.min((total / objetivo) * 100, 100) : 0;
  const texto = "text-xs md:text-lg font-bold leading-snug";

  return (
    <div className="mb-4 w-full rounded-xl border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 shadow-sm">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
        <span
          className={`${texto} uppercase tracking-wide text-blue-800 dark:text-blue-400`}
        >
          Meta General de Afiliación
        </span>
        <span
          className={`${texto} whitespace-nowrap text-blue-700 dark:text-blue-400`}
        >
          {total.toLocaleString()} / {objetivo.toLocaleString()}{" "}
          <span className="text-gray-500 dark:text-gray-400">
            ({progreso.toFixed(1)}%)
          </span>
        </span>
      </div>
      <div className="relative flex h-3 w-full items-center overflow-hidden rounded-full bg-gray-200 dark:bg-neutral-800">
        {visibles.map((s, i) => (
          <motion.div
            key={s.key}
            initial={{ width: 0 }}
            animate={{ width: `${pctBarra(s.valor)}%` }}
            transition={{ duration: 1, ease: "easeOut", delay: i * 0.05 }}
            className={`h-full shrink-0 ${s.barra}`}
          />
        ))}
      </div>
      <div className="mt-2.5 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 md:justify-start md:gap-x-4">
        {visibles.map((s) => {
          const Icon = s.Icon;
          return (
            <span
              key={s.key}
              className={`inline-flex items-center gap-1.5 ${texto} uppercase ${s.texto}`}
            >
              <Icon className="size-4 shrink-0 md:size-5" />
              <span className="md:hidden">{s.labelCorto}</span>
              <span className="hidden md:inline">{s.label}</span>
              <span
                className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-black leading-none tracking-tight md:px-2 md:text-xs ${s.pill}`}
              >
                {textoPct(s.valor, total)}
              </span>
              <span className="tabular-nums">{s.valor.toLocaleString()}</span>
            </span>
          );
        })}
      </div>
    </div>
  );
}
