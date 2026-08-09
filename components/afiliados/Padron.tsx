"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "@/lib/toast";
import { obtenerPadronAction } from "./actions/padron";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  FileSpreadsheet,
} from "lucide-react";
import { descargarExcelAoA } from "./reportes/descargarExcel";
import PanelListaPestana from "./PanelListaPestana";
import { TEMA_PADRON } from "./temaPestana";

type PadronFilaExcel = {
  dpi: string;
  nombre_completo: string;
  genero: string;
};

type PageSize = number | "all";

function normalizaPadronFilaExcel(v: unknown): PadronFilaExcel | null {
  if (typeof v !== "object" || v === null) return null;
  const o = v as Record<string, unknown>;
  const dpi = o.dpi;
  const nombre = o.nombre_completo;
  if (typeof dpi !== "string" || typeof nombre !== "string") return null;
  const generoRaw = o.genero;
  const genero =
    typeof generoRaw === "string" ? generoRaw : String(generoRaw ?? "");
  return { dpi, nombre_completo: nombre, genero };
}

const CHUNK_PADRON_EXCEL = 2000;
const tema = TEMA_PADRON;

export default function Padron() {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<PageSize>(15);
  const [exportandoExcel, setExportandoExcel] = useState(false);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, pageSize]);

  const queryPageSize = pageSize === "all" ? 50000 : pageSize;

  const { data, isLoading, isError } = useQuery({
    queryKey: ["padron", page, queryPageSize, debouncedSearch],
    queryFn: () =>
      obtenerPadronAction(page, queryPageSize, debouncedSearch),
    staleTime: 5 * 60 * 1000,
    placeholderData: (prev) => prev,
  });

  const padronList = data?.data || [];
  const totalCount = data?.totalCount || 0;
  const effectiveSize =
    pageSize === "all" ? Math.max(totalCount, 1) : pageSize;
  const totalPages =
    pageSize === "all" ? 1 : Math.ceil(totalCount / effectiveSize) || 1;

  const exportarTodoPadronExcel = async (): Promise<void> => {
    if (totalCount <= 0 || isLoading || isError) return;
    setExportandoExcel(true);
    try {
      const acumuladas: PadronFilaExcel[] = [];
      let paginaActual = 1;
      while (acumuladas.length < totalCount) {
        const resultado = await obtenerPadronAction(
          paginaActual,
          CHUNK_PADRON_EXCEL,
          debouncedSearch,
        );
        const dados = resultado.data ?? [];
        if (!dados.length) break;
        for (const fila of dados) {
          const n = normalizaPadronFilaExcel(fila);
          if (n) acumuladas.push(n);
        }
        if (dados.length < CHUNK_PADRON_EXCEL) break;
        paginaActual += 1;
        if (paginaActual > Math.ceil(totalCount / CHUNK_PADRON_EXCEL) + 2) break;
      }
      if (!acumuladas.length) {
        toast.error("No hay filas válidas para exportar.");
        return;
      }
      const filas: (string | number)[][] = [
        ["No.", "DPI", "Nombre Completo", "Género"],
        ...acumuladas.map((r, idx) => [
          idx + 1,
          r.dpi,
          r.nombre_completo,
          String(r.genero ?? ""),
        ]),
      ];
      descargarExcelAoA({
        nombreArchivoBase: debouncedSearch.trim()
          ? "padron-electoral-busqueda"
          : "padron-electoral",
        nombreHoja: "Padrón",
        filas,
      });
      toast.success(`Excel (${acumuladas.length} filas).`);
    } catch {
      toast.error("No se pudo generar el Excel.");
    } finally {
      setExportandoExcel(false);
    }
  };

  return (
    <PanelListaPestana
      tema={tema}
      placeholder="Buscar por nombre o DPI..."
      value={searchTerm}
      onChange={(v) => {
        setSearchTerm(v);
        setPage(1);
      }}
      acciones={
        <div className="flex w-full sm:w-auto items-center gap-2 flex-wrap">
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ${tema.theadBg} ${tema.btnText}`}
          >
            {totalCount.toLocaleString()} registros
          </span>
          <button
            type="button"
            disabled={
              exportandoExcel || isLoading || isError || totalCount === 0
            }
            onClick={() => {
              void exportarTodoPadronExcel();
            }}
            className="inline-flex h-11 items-center justify-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-50 px-3 text-xs font-bold text-emerald-800 transition-colors hover:bg-emerald-100 disabled:opacity-50 dark:border-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-950/60"
            aria-label="Descargar padrón en Excel"
          >
            {exportandoExcel ? (
              <Loader2 className="h-4 w-4 animate-spin shrink-0" />
            ) : (
              <FileSpreadsheet className="h-4 w-4 shrink-0" />
            )}
            Excel
          </button>
        </div>
      }
      contenidoSinPadding
      footer={
        totalCount > 0 ? (
          <div className="flex flex-row items-center justify-center gap-3 w-full">
            <button
              type="button"
              className={`inline-flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed ${tema.pagination}`}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1 || pageSize === "all"}
              aria-label="Anterior"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <span className="text-sm text-gray-800 dark:text-gray-100 tabular-nums">
              {page}/{totalPages}
            </span>
            <button
              type="button"
              className={`inline-flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed ${tema.pagination}`}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || pageSize === "all"}
              aria-label="Siguiente"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            <select
              value={pageSize}
              onChange={(e) => {
                const val = e.target.value;
                setPageSize(val === "all" ? "all" : parseInt(val, 10));
              }}
              className="ml-1 h-8 rounded border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 px-2 text-sm text-gray-800 dark:text-gray-100 cursor-pointer"
            >
              <option value={15}>15</option>
              <option value={30}>30</option>
              <option value={45}>45</option>
              <option value="all">Todos</option>
            </select>
          </div>
        ) : undefined
      }
    >
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white dark:bg-neutral-900 text-xs">
          <thead
            className={`${tema.theadBg} ${tema.theadText} border-b border-black/5 dark:border-white/10`}
          >
            <tr>
              <th
                className={`px-4 py-2.5 text-left font-bold uppercase ${tema.theadText}`}
              >
                No.
              </th>
              <th
                className={`px-4 py-2.5 text-left font-bold uppercase ${tema.theadText}`}
              >
                DPI
              </th>
              <th
                className={`px-4 py-2.5 text-left font-bold uppercase ${tema.theadText}`}
              >
                Nombre Completo
              </th>
              <th
                className={`px-4 py-2.5 text-left font-bold uppercase ${tema.theadText}`}
              >
                Género
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-neutral-700">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, idx) => (
                <tr key={idx} className="animate-pulse">
                  <td className="px-4 py-3">
                    <div className="h-4 w-8 rounded bg-gray-200 dark:bg-neutral-700" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="h-4 w-32 rounded bg-gray-200 dark:bg-neutral-700" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="h-4 w-48 rounded bg-gray-200 dark:bg-neutral-700" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="h-4 w-10 rounded bg-gray-200 dark:bg-neutral-700" />
                  </td>
                </tr>
              ))
            ) : isError ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-8 text-center text-red-500"
                >
                  Error al cargar los datos del padrón.
                </td>
              </tr>
            ) : padronList.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-8 text-center text-gray-500 dark:text-gray-400"
                >
                  No se encontraron resultados en el padrón.
                </td>
              </tr>
            ) : (
              padronList.map((persona: { dpi: string; nombre_completo: string; genero: string }, index: number) => (
                <tr
                  key={persona.dpi}
                  className={`${tema.filaHover} transition-colors`}
                >
                  <td className="px-4 py-2.5 whitespace-nowrap text-gray-500 dark:text-gray-400">
                    {(page - 1) * (pageSize === "all" ? 0 : pageSize) +
                      index +
                      1}
                  </td>
                  <td className="px-4 py-2.5 whitespace-nowrap font-mono text-gray-900 dark:text-gray-100">
                    {persona.dpi}
                  </td>
                  <td className="px-4 py-2.5 whitespace-nowrap font-bold uppercase text-gray-900 dark:text-gray-100">
                    {persona.nombre_completo}
                  </td>
                  <td className="px-4 py-2.5 whitespace-nowrap">
                    <span
                      className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold ${
                        persona.genero === "M" ||
                        persona.genero === "MASCULINO"
                          ? "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300"
                          : "bg-pink-100 text-pink-800 dark:bg-pink-950/60 dark:text-pink-300"
                      }`}
                    >
                      {persona.genero === "MASCULINO"
                        ? "M"
                        : persona.genero === "FEMENINO"
                          ? "F"
                          : persona.genero}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </PanelListaPestana>
  );
}
