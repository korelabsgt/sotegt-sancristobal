"use client";

import { Building2, UsersRound } from "lucide-react";
import { motion } from "framer-motion";
import { PiBriefcaseDuotone, PiMedalDuotone } from "react-icons/pi";

interface Props {
  totalSede: number;
  totalLideres: number;
  totalEmpleados?: number;
  totalCoordinadores?: number;
  objetivoTotal?: number;
  mostrarSede?: boolean;
  mostrarEmpleados?: boolean;
  mostrarCoordinadores?: boolean;
}

export default function MetaGeneral({
  totalSede,
  totalLideres,
  totalEmpleados = 0,
  totalCoordinadores = 0,
  objetivoTotal = 0,
  mostrarSede = true,
  mostrarEmpleados = false,
  mostrarCoordinadores = false,
}: Props) {
  const total =
    (mostrarSede ? totalSede : 0) +
    (mostrarCoordinadores ? totalCoordinadores : 0) +
    totalLideres +
    (mostrarEmpleados ? totalEmpleados : 0);
  const objetivo = objetivoTotal > 0 ? objetivoTotal : 0;
  const pct = (n: number) =>
    objetivo > 0 ? Math.min((n / objetivo) * 100, 100) : 0;
  const progreso =
    objetivo > 0 ? Math.min((total / objetivo) * 100, 100) : 0;
  const texto = "text-xs md:text-lg font-bold leading-snug";
  let delay = 0;

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
        {mostrarSede && (
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct(totalSede)}%` }}
            transition={{ duration: 1, ease: "easeOut", delay: delay++ * 0.05 }}
            className="h-full shrink-0 bg-blue-600"
          />
        )}
        {mostrarCoordinadores && (
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct(totalCoordinadores)}%` }}
            transition={{ duration: 1, ease: "easeOut", delay: delay++ * 0.05 }}
            className="h-full shrink-0 bg-cyan-500"
          />
        )}
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct(totalLideres)}%` }}
          transition={{ duration: 1, ease: "easeOut", delay: delay++ * 0.05 }}
          className="h-full shrink-0 bg-orange-500"
        />
        {mostrarEmpleados && (
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct(totalEmpleados)}%` }}
            transition={{ duration: 1, ease: "easeOut", delay: delay++ * 0.05 }}
            className="h-full shrink-0 bg-violet-500"
          />
        )}
      </div>
      <div className="mt-2.5 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 md:justify-start">
        {mostrarSede && (
          <span
            className={`flex items-center gap-1.5 ${texto} uppercase text-blue-700 dark:text-blue-400`}
          >
            <Building2 className="size-5 shrink-0" />
            Sede: {totalSede.toLocaleString()}
          </span>
        )}
        {mostrarCoordinadores && (
          <span
            className={`flex items-center gap-1.5 ${texto} uppercase text-cyan-600 dark:text-cyan-400`}
          >
            <UsersRound className="size-5 shrink-0" />
            Coordinadores: {totalCoordinadores.toLocaleString()}
          </span>
        )}
        <span
          className={`flex items-center gap-1.5 ${texto} uppercase text-orange-600 dark:text-orange-400`}
        >
          <PiMedalDuotone className="size-5 shrink-0" />
          Enlaces: {totalLideres.toLocaleString()}
        </span>
        {mostrarEmpleados && (
          <span
            className={`flex items-center gap-1.5 ${texto} uppercase text-violet-600 dark:text-violet-400`}
          >
            <PiBriefcaseDuotone className="size-5 shrink-0" />
            Empleados: {totalEmpleados.toLocaleString()}
          </span>
        )}
      </div>
    </div>
  );
}
