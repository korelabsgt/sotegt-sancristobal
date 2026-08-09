"use client";

import type { Afiliado } from "../esquemas";
import { ChartHeader, ChartFooter } from "./chartTheme";
import BarrasHorizontales from "./BarrasHorizontales";

interface Props {
  afiliados: Afiliado[];
}

export default function CondicionEspecial({ afiliados }: Props) {
  const conteo: Record<string, number> = {};

  afiliados.forEach((afiliado) => {
    const condicion = afiliado.condicion_especial || "Sin Especificar";
    conteo[condicion] = (conteo[condicion] || 0) + 1;
  });

  const datos = Object.entries(conteo)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  return (
    <div className="w-full h-full flex flex-col gap-3">
      <ChartHeader
        title="Condición Especial"
        subtitle="Distribución de condiciones especiales"
      />

      <BarrasHorizontales
        items={datos}
        total={afiliados.length}
        labelColumna="Condición"
        accentColor="#14b8a6"
      />

      <ChartFooter>
        <p className="text-gray-500 dark:text-neutral-400">
          Total de registros: {afiliados.length}
        </p>
      </ChartFooter>
    </div>
  );
}
