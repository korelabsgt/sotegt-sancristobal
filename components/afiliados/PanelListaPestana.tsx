"use client";

import { Search } from "lucide-react";
import type { ReactNode } from "react";
import type { TemaLista } from "./temaPestana";

type Props = {
  tema: TemaLista;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  acciones?: ReactNode;
  extra?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  contenidoSinPadding?: boolean;
};

export default function PanelListaPestana({
  tema,
  placeholder,
  value,
  onChange,
  acciones,
  extra,
  children,
  footer,
  contenidoSinPadding = false,
}: Props) {
  return (
    <div
      className={`overflow-hidden rounded-xl border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm border-t-4 ${tema.borderTop}`}
    >
      <div
        className={`flex flex-col sm:flex-row sm:items-center gap-3 p-3 ${tema.theadBg}`}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder={placeholder}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className={`pl-9 pr-4 py-2.5 h-11 border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 rounded-lg w-full text-sm focus:outline-none focus:ring-2 ${tema.focusRing}`}
            />
          </div>
          {extra}
        </div>
        {acciones ? (
          <div className="flex w-full min-w-0 shrink-0 flex-wrap items-center gap-2 sm:w-auto">
            {acciones}
          </div>
        ) : null}
      </div>
      <div className={contenidoSinPadding ? undefined : "px-3 pb-3 pt-3"}>
        {children}
      </div>
      {footer ? (
        <div className="border-t border-gray-100 dark:border-neutral-800 px-3 py-3">
          {footer}
        </div>
      ) : null}
    </div>
  );
}
