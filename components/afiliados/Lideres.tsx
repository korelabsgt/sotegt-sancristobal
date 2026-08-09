"use client";

import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { obtenerConfiguracionAction } from "../dashboard/actions/configuracion";
import {
  ChevronLeft,
  ChevronRight,
  Pencil,
  Trash2,
  MoreVertical,
  User,
  Heart,
  ChevronsRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { eliminar } from "./acciones";
import { calcularNivelCompromiso } from "@/lib/nivelCompromiso";
import { swalNoEliminarCelula } from "@/lib/swalTheme";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { TemaLista } from "./temaPestana";
import { TEMA_LIDERES, temaDesdeLider } from "./temaPestana";
import { esUsuarioSede } from "./esquemas";

export interface Lider {
  id: string;
  email: string;
  nombres: string;
  apellidos: string;
  rol: string;
  rol_id?: number;
  conteoAfiliados?: number;
  conteoTitulares?: number;
  conteoFamiliares?: number;
  simulado?: boolean;
}

interface Props {
  lideres: Lider[];
  onVerCelula: (lider: Lider) => void;
  onEditar: (lider: Lider) => void;
  rolUsuarioSesion: string;
  onDataChange: () => void;
  searchTerm: string;
  idUsuarioSesion: string;
  isLoading?: boolean;
  tema?: TemaLista;
}

function LideresSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="h-24 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-xl p-4 flex items-center gap-4"
        >
          <div className="h-10 w-10 bg-gray-100 dark:bg-neutral-800 rounded-lg" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-1/3 bg-gray-100 dark:bg-neutral-800 rounded" />
            <div className="h-3 w-1/4 bg-gray-50 dark:bg-neutral-800/50 rounded" />
          </div>
          <div className="h-10 w-24 bg-gray-100 dark:bg-neutral-800 rounded-lg" />
        </div>
      ))}
    </div>
  );
}

export default function Lideres({
  lideres,
  onVerCelula,
  onEditar,
  rolUsuarioSesion,
  onDataChange,
  searchTerm,
  idUsuarioSesion,
  isLoading = false,
  tema = TEMA_LIDERES,
}: Props) {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState<number | "all">(15);

  const rolUpper = (rolUsuarioSesion || "").toUpperCase();
  const isLider = rolUpper === "LIDER";
  const esAdminOSuper =
    rolUpper === "ADMINISTRADOR" ||
    rolUpper === "SUPER" ||
    rolUpper === "ADMIN";
  const esSedeSesion = rolUpper === "SEDE";
  const puedeGestionarUsuarios =
    esAdminOSuper || rolUpper === "DOCUMENTADOR" || esSedeSesion;

  const { data: config } = useQuery({
    queryKey: ["config_sistema"],
    queryFn: () => obtenerConfiguracionAction(),
    staleTime: 5 * 60 * 1000,
    refetchOnMount: false,
  });

  const META_CELULA = config?.meta_por_lider ?? config?.meta_celula ?? 15;
  const META_MINIMA = config?.meta_celula_minima ?? 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, itemsPerPage]);

  const sortedLideres = useMemo(
    () =>
      [...lideres].sort((a, b) => {
        if (a.simulado) return -1;
        if (b.simulado) return 1;
        if (a.id === idUsuarioSesion) return -1;
        if (b.id === idUsuarioSesion) return 1;
        return (b.conteoAfiliados || 0) - (a.conteoAfiliados || 0);
      }),
    [lideres, idUsuarioSesion],
  );

  const filteredLideres = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return sortedLideres.filter((lider) => {
      const fullName = `${lider.nombres} ${lider.apellidos}`.toLowerCase();
      const email = lider.email.toLowerCase();
      return fullName.includes(term) || email.includes(term);
    });
  }, [sortedLideres, searchTerm]);

  const effectiveItemsPerPage = useMemo(
    () => (itemsPerPage === "all" ? filteredLideres.length : itemsPerPage),
    [itemsPerPage, filteredLideres.length],
  );

  const totalPages = useMemo(
    () => Math.ceil(filteredLideres.length / (effectiveItemsPerPage || 1)),
    [filteredLideres.length, effectiveItemsPerPage],
  );

  const startIndex = (currentPage - 1) * (effectiveItemsPerPage as number);

  const lideresPaginados = useMemo(
    () =>
      itemsPerPage === "all"
        ? filteredLideres
        : filteredLideres.slice(
            startIndex,
            startIndex + (effectiveItemsPerPage as number),
          ),
    [filteredLideres, startIndex, effectiveItemsPerPage, itemsPerPage],
  );

  if (isLoading) return <LideresSkeleton />;

  const getRowClass = (lider: Lider) =>
    lider.id === idUsuarioSesion
      ? "bg-blue-50/50 dark:bg-blue-950/40"
      : "bg-white dark:bg-neutral-900 group-hover:bg-gray-50/80 dark:group-hover:bg-neutral-800/40";

  return (
    <>
      <div className="flex flex-col gap-3">
        <AnimatePresence initial={false}>
          {lideresPaginados.map((lider, index) => {
            const totalEnGrupo = lider.conteoAfiliados || 0;
            const progreso = Math.min((totalEnGrupo / META_CELULA) * 100, 100);
            const tieneAfiliados = totalEnGrupo > 0;
            const esSede = esUsuarioSede(lider);
            const {
              nivel: nivelCompromiso,
              colorBarra,
              textoColor,
            } = calcularNivelCompromiso(
              totalEnGrupo,
              META_CELULA,
              META_MINIMA,
              lider.nombres,
            );

            const estiloTotal =
              nivelCompromiso === "Alto"
                ? "bg-green-50 dark:bg-green-950/50 border-green-300 dark:border-green-700"
                : nivelCompromiso === "Cumple"
                  ? "bg-blue-50 dark:bg-blue-950/50 border-blue-300 dark:border-blue-700"
                  : nivelCompromiso === "Medio"
                    ? "bg-yellow-50 dark:bg-yellow-950/50 border-yellow-300 dark:border-yellow-700"
                    : totalEnGrupo === 0
                      ? "bg-gray-50 dark:bg-neutral-800/80 border-gray-200 dark:border-neutral-700"
                      : "bg-red-50 dark:bg-red-950/50 border-red-300 dark:border-red-700";

            const puedeEntrar = !(isLider && lider.id !== idUsuarioSesion);
            const temaFila = temaDesdeLider(lider, esSede) || tema;

            return (
              <motion.div
                key={lider.id}
                layout
                initial={
                  lider.simulado
                    ? { opacity: 0, y: -24, scale: 0.97 }
                    : false
                }
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={
                  lider.simulado
                    ? { opacity: 0, y: -16, scale: 0.98 }
                    : undefined
                }
                transition={{ duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
                className={`group flex flex-col rounded-xl overflow-hidden border-l-4 border-r-4 border-l-gray-200 border-r-gray-200 dark:border-l-neutral-700 dark:border-r-neutral-700 transition-all duration-300 ease-in-out ${temaFila.hoverBordeLateral} ${getRowClass(lider)}`}
              >
                <div className="p-4 flex flex-col gap-3">
                  <div className="flex items-center gap-2 min-w-0 w-full">
                    <div
                      className={`flex items-center justify-center w-8 h-8 rounded-lg text-xs font-black shrink-0 border ${tema.theadBg} ${tema.btnText} ${tema.cardBorder}`}
                    >
                      {startIndex + index + 1}
                    </div>
                    <h3
                      className={`min-w-0 flex-1 font-black text-sm md:text-base leading-none truncate ${lider.id === idUsuarioSesion ? "text-blue-900 dark:text-blue-300" : "text-gray-900 dark:text-gray-100"}`}
                    >
                      {lider.nombres}{" "}
                      <span
                        className={`font-bold ${lider.id === idUsuarioSesion ? "text-blue-800/80 dark:text-blue-400/90" : "text-slate-600 dark:text-slate-300"}`}
                      >
                        {lider.apellidos}
                      </span>
                    </h3>
                    <span className="shrink-0 text-[10px] md:text-xs font-black uppercase leading-none whitespace-nowrap text-gray-900 dark:text-white hidden sm:inline">
                      Nivel:{" "}
                      <span className={textoColor}>{nivelCompromiso}</span>
                    </span>
                    {puedeGestionarUsuarios ? (
                      <div
                        className="flex items-center shrink-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              type="button"
                              className={`inline-flex h-8 w-8 items-center justify-center rounded-md text-gray-400 transition-all duration-300 ease-in-out ${temaFila.hoverMenu}`}
                              aria-label="Acciones"
                            >
                              <MoreVertical className="h-5 w-5" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            className="min-w-[7.5rem] w-auto p-1"
                          >
                            <DropdownMenuItem
                              className="cursor-pointer gap-2 text-sm py-2 px-2.5 text-gray-700 dark:text-gray-200 focus:text-gray-700 dark:focus:text-gray-200"
                              onClick={() => onEditar(lider)}
                            >
                              <Pencil className="h-4 w-4 shrink-0" />
                              Editar
                            </DropdownMenuItem>
                            {esAdminOSuper && lider.id !== idUsuarioSesion && (
                              <DropdownMenuItem
                                className="cursor-pointer gap-2 text-sm py-2 px-2.5 text-red-600 focus:text-red-600"
                                onClick={() => {
                                  if (tieneAfiliados) {
                                    swalNoEliminarCelula();
                                  } else {
                                    eliminar(lider, onDataChange);
                                  }
                                }}
                              >
                                <Trash2 className="h-4 w-4 shrink-0" />
                                Eliminar
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    ) : null}
                  </div>

                  <div className="w-full bg-gray-100 dark:bg-neutral-800 rounded-full h-3 md:h-4 border border-gray-200 dark:border-neutral-700 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progreso}%` }}
                      className={`${colorBarra} h-full rounded-full`}
                    />
                  </div>

                  <div className="flex items-center justify-between gap-2 w-full min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                      <div
                        className={`flex items-center gap-1.5 px-2 py-1.5 rounded-md border shrink-0 ${estiloTotal}`}
                        title="Total"
                      >
                        <span
                          className={`text-xs md:text-sm font-black uppercase leading-none ${textoColor}`}
                        >
                          Total
                        </span>
                        <span
                          className={`text-xs md:text-sm font-black leading-none ${textoColor}`}
                        >
                          {totalEnGrupo}/{META_CELULA}
                        </span>
                      </div>
                      <div
                        className="flex items-center gap-1.5 bg-blue-50 dark:bg-blue-950/50 px-2 py-1.5 rounded-md border border-blue-100 dark:border-blue-800"
                        title="Titulares"
                      >
                        <User className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span className="text-xs font-black text-blue-600 uppercase leading-none hidden sm:inline">
                          Titulares
                        </span>
                        <span className="text-xs font-black text-blue-700 dark:text-blue-400 leading-none">
                          {lider.conteoTitulares || 0}
                        </span>
                      </div>
                      <div
                        className="flex items-center gap-1.5 bg-purple-50 dark:bg-purple-950/50 px-2 py-1.5 rounded-md border border-purple-100 dark:border-purple-800"
                        title="Familiares"
                      >
                        <Heart className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                        <span className="text-xs font-black text-purple-600 uppercase leading-none hidden sm:inline">
                          Familiares
                        </span>
                        <span className="text-xs font-black text-purple-700 dark:text-purple-400 leading-none">
                          {lider.conteoFamiliares || 0}
                        </span>
                      </div>
                    </div>
                    {puedeEntrar && (
                      <button
                        type="button"
                        onClick={() => onVerCelula(lider)}
                        className={`inline-flex h-9 items-center justify-center gap-1 rounded-lg border border-gray-200 bg-gray-100 px-3 text-xs font-bold uppercase whitespace-nowrap shrink-0 text-gray-500 transition-all duration-300 ease-in-out dark:border-neutral-700 dark:bg-neutral-800 dark:text-gray-400 ${temaFila.hoverEntrar}`}
                      >
                        Entrar
                        <ChevronsRight className="h-4 w-4 shrink-0" />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <div className="flex flex-row items-center justify-center gap-3 mt-6 mb-2 w-full px-1">
        <button
          type="button"
          className={`inline-flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed ${tema.pagination}`}
          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          disabled={currentPage === 1 || itemsPerPage === "all"}
          aria-label="Anterior"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <span className="text-sm text-gray-800 dark:text-gray-100 tabular-nums">
          {currentPage}/{totalPages || 1}
        </span>
        <button
          type="button"
          className={`inline-flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed ${tema.pagination}`}
          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          disabled={currentPage === totalPages || itemsPerPage === "all"}
          aria-label="Siguiente"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
        <select
          value={itemsPerPage}
          onChange={(e) => {
            const val = e.target.value;
            setItemsPerPage(val === "all" ? "all" : parseInt(val));
          }}
          className="ml-1 h-8 rounded border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 px-2 text-sm text-gray-800 dark:text-gray-100 cursor-pointer"
        >
          <option value={15}>15</option>
          <option value={30}>30</option>
          <option value={45}>45</option>
          <option value="all">Todos</option>
        </select>
      </div>
    </>
  );
}
