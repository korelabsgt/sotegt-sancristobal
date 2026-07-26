"use client";

import { useState, Fragment, useMemo, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { obtenerHistorialMensajesAction, eliminarMensajeAction } from "../dashboard/actions/mensajes";
import { Dialog, Transition, TransitionChild, DialogPanel } from "@headlessui/react";
import { X, CheckCircle2, Clock, ChevronLeft, ChevronRight, ChevronDown, Calendar, Check, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import Swal from "@/lib/swal";
import { swalThemeOptions } from "@/lib/swalTheme";
import { toast } from "@/lib/toast";

const MESES_CORTOS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
const MESES_LARGOS = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];
const DIAS_CORTOS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const PAGE_SIZE_OPTIONS = [10, 50, 100] as const;

type SemanaRango = {
  start: Date;
  end: Date;
  label: string;
};

type PanelPos = {
  top: number;
  left: number;
  width: number;
};

function inicioDia(fecha: Date) {
  const d = new Date(fecha);
  d.setHours(0, 0, 0, 0);
  return d;
}

function finDia(fecha: Date) {
  const d = new Date(fecha);
  d.setHours(23, 59, 59, 999);
  return d;
}

function etiquetaSemana(inicio: Date, fin: Date) {
  return `${DIAS_CORTOS[inicio.getDay()]} ${inicio.getDate()} - ${DIAS_CORTOS[fin.getDay()]} ${fin.getDate()}`;
}

function semanasDelMes(anio: number, mes: number): SemanaRango[] {
  const primerDiaMes = new Date(anio, mes, 1);
  const ultimoDiaMes = new Date(anio, mes + 1, 0);
  const semanas: SemanaRango[] = [];

  const inicioSemana = new Date(primerDiaMes);
  const dia = inicioSemana.getDay();
  const diasDesdeLunes = dia === 0 ? 6 : dia - 1;
  inicioSemana.setDate(inicioSemana.getDate() - diasDesdeLunes);

  while (inicioSemana <= ultimoDiaMes) {
    const finSemana = new Date(inicioSemana);
    finSemana.setDate(finSemana.getDate() + 6);
    semanas.push({
      start: new Date(inicioSemana),
      end: finSemana,
      label: etiquetaSemana(inicioSemana, finSemana),
    });
    inicioSemana.setDate(inicioSemana.getDate() + 7);
  }

  return semanas;
}

function formatearFechaTabla(fecha: string) {
  const d = new Date(fecha);
  const dia = DIAS_CORTOS[d.getDay()];
  const diaCap = `${dia.charAt(0).toUpperCase()}${dia.slice(1).toLowerCase()}`;
  const mes = d.getMonth() + 1;
  const day = d.getDate();
  const anio = d.getFullYear() % 100;
  const hora = d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
  return `${diaCap} ${day}/${mes}/${anio} ${hora}`;
}

export function useMensajesFiltros() {
  const hoy = new Date();
  const [anioMes, setAnioMes] = useState({ anio: hoy.getFullYear(), mes: hoy.getMonth() });
  const [semanaIndex, setSemanaIndex] = useState<number | null>(null);
  const [mesPickerAbierto, setMesPickerAbierto] = useState(false);
  const [semanaAbierta, setSemanaAbierta] = useState(false);
  const [anioPicker, setAnioPicker] = useState(hoy.getFullYear());

  const mesPickerRef = useRef<HTMLDivElement>(null);
  const mesPickerPanelRef = useRef<HTMLDivElement>(null);
  const semanaRef = useRef<HTMLDivElement>(null);
  const semanaPanelRef = useRef<HTMLDivElement>(null);
  const [mesPanelPos, setMesPanelPos] = useState<PanelPos | null>(null);
  const [semanaPanelPos, setSemanaPanelPos] = useState<PanelPos | null>(null);

  const semanas = useMemo(
    () => semanasDelMes(anioMes.anio, anioMes.mes),
    [anioMes.anio, anioMes.mes],
  );

  useEffect(() => {
    setSemanaIndex(null);
  }, [anioMes.anio, anioMes.mes]);

  useEffect(() => {
    if (mesPickerAbierto) setAnioPicker(anioMes.anio);
  }, [mesPickerAbierto, anioMes.anio]);

  useEffect(() => {
    if (!mesPickerAbierto || !mesPickerRef.current) {
      setMesPanelPos(null);
      return;
    }
    const update = () => {
      const el = mesPickerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const width = Math.min(window.innerWidth - 32, 280);
      let left = rect.left + rect.width / 2 - width / 2;
      left = Math.max(16, Math.min(left, window.innerWidth - width - 16));
      setMesPanelPos({ top: rect.bottom + 8, left, width });
    };
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [mesPickerAbierto]);

  useEffect(() => {
    if (!semanaAbierta || !semanaRef.current) {
      setSemanaPanelPos(null);
      return;
    }
    const update = () => {
      const el = semanaRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      setSemanaPanelPos({ top: rect.bottom + 8, left: rect.left, width: rect.width });
    };
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [semanaAbierta]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      const enMes =
        mesPickerRef.current?.contains(target) || mesPickerPanelRef.current?.contains(target);
      const enSemana =
        semanaRef.current?.contains(target) || semanaPanelRef.current?.contains(target);
      if (!enMes) setMesPickerAbierto(false);
      if (!enSemana) setSemanaAbierta(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const cambiarMes = (delta: number) => {
    setAnioMes((prev) => {
      const d = new Date(prev.anio, prev.mes + delta, 1);
      return { anio: d.getFullYear(), mes: d.getMonth() };
    });
  };

  const etiquetaSemanaActual =
    semanaIndex === null ? "Semana" : semanas[semanaIndex]?.label ?? "Semana";

  return {
    anioMes,
    setAnioMes,
    semanaIndex,
    setSemanaIndex,
    semanas,
    mesPickerAbierto,
    setMesPickerAbierto,
    semanaAbierta,
    setSemanaAbierta,
    anioPicker,
    setAnioPicker,
    mesPickerRef,
    mesPickerPanelRef,
    semanaRef,
    semanaPanelRef,
    mesPanelPos,
    semanaPanelPos,
    cambiarMes,
    etiquetaSemanaActual,
  };
}

export type MensajesFiltrosApi = ReturnType<typeof useMensajesFiltros>;

export function MensajesFiltrosBar({
  filtros,
  className = "",
}: {
  filtros: MensajesFiltrosApi;
  className?: string;
}) {
  const {
    anioMes,
    setAnioMes,
    semanaIndex,
    setSemanaIndex,
    semanas,
    mesPickerAbierto,
    setMesPickerAbierto,
    semanaAbierta,
    setSemanaAbierta,
    anioPicker,
    setAnioPicker,
    mesPickerRef,
    mesPickerPanelRef,
    semanaRef,
    semanaPanelRef,
    mesPanelPos,
    semanaPanelPos,
    cambiarMes,
    etiquetaSemanaActual,
  } = filtros;

  return (
    <>
      <div className={`flex flex-wrap items-center justify-center gap-2 ${className}`}>
        <div className="relative" ref={mesPickerRef}>
          <div className="inline-flex items-center border border-gray-200 dark:border-neutral-700 rounded-xl overflow-hidden bg-white dark:bg-neutral-900 shadow-sm">
            <button
              type="button"
              onClick={() => cambiarMes(-1)}
              className="px-2.5 py-2 text-gray-600 dark:text-neutral-300 hover:bg-gray-50 dark:hover:bg-neutral-800 border-r border-gray-200 dark:border-neutral-700 transition-colors"
              aria-label="Mes anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                setSemanaAbierta(false);
                setMesPickerAbierto((v) => !v);
              }}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-bold text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors whitespace-nowrap"
            >
              <Calendar className="w-4 h-4 shrink-0 text-gray-500 dark:text-neutral-400" />
              <span>
                {MESES_LARGOS[anioMes.mes]} {anioMes.anio}
              </span>
              <ChevronDown
                className={`w-4 h-4 shrink-0 text-gray-400 transition-transform ${mesPickerAbierto ? "rotate-180" : ""}`}
              />
            </button>
            <button
              type="button"
              onClick={() => cambiarMes(1)}
              className="px-2.5 py-2 text-gray-600 dark:text-neutral-300 hover:bg-gray-50 dark:hover:bg-neutral-800 border-l border-gray-200 dark:border-neutral-700 transition-colors"
              aria-label="Mes siguiente"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="relative" ref={semanaRef}>
          <button
            type="button"
            onClick={() => {
              setMesPickerAbierto(false);
              setSemanaAbierta((v) => !v);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm font-bold text-gray-900 dark:text-gray-100 shadow-sm hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors whitespace-nowrap"
          >
            <span>{etiquetaSemanaActual}</span>
            <ChevronDown
              className={`w-4 h-4 shrink-0 text-gray-400 transition-transform ${semanaAbierta ? "rotate-180" : ""}`}
            />
          </button>
        </div>
      </div>

      {mesPickerAbierto &&
        mesPanelPos &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={mesPickerPanelRef}
            className="fixed z-[200] p-3 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 shadow-xl"
            style={{ top: mesPanelPos.top, left: mesPanelPos.left, width: mesPanelPos.width }}
          >
            <div className="flex items-center justify-between mb-3 px-1">
              <button
                type="button"
                onClick={() => setAnioPicker((y) => y - 1)}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800 text-gray-600 dark:text-neutral-300"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-bold text-base text-gray-900 dark:text-gray-100">{anioPicker}</span>
              <button
                type="button"
                onClick={() => setAnioPicker((y) => y + 1)}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800 text-gray-600 dark:text-neutral-300"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {MESES_CORTOS.map((nombre, idx) => {
                const activo = anioPicker === anioMes.anio && idx === anioMes.mes;
                return (
                  <button
                    key={nombre}
                    type="button"
                    onClick={() => {
                      setAnioMes({ anio: anioPicker, mes: idx });
                      setMesPickerAbierto(false);
                    }}
                    className={`py-2 rounded-lg text-sm font-bold transition-colors ${
                      activo
                        ? "bg-blue-600 text-white"
                        : "text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-neutral-800"
                    }`}
                  >
                    {nombre}
                  </button>
                );
              })}
            </div>
          </div>,
          document.body,
        )}

      {semanaAbierta &&
        semanaPanelPos &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={semanaPanelRef}
            className="fixed z-[200] py-1 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 shadow-xl max-h-60 overflow-y-auto"
            style={{ top: semanaPanelPos.top, left: semanaPanelPos.left, minWidth: semanaPanelPos.width }}
          >
            <button
              type="button"
              onClick={() => {
                setSemanaIndex(null);
                setSemanaAbierta(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm font-semibold text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-neutral-800 whitespace-nowrap"
            >
              {semanaIndex === null ? (
                <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              ) : (
                <span className="w-3.5 shrink-0" />
              )}
              Semana
            </button>
            {semanas.map((s, idx) => (
              <button
                key={s.label}
                type="button"
                onClick={() => {
                  setSemanaIndex(idx);
                  setSemanaAbierta(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm font-medium text-gray-700 dark:text-neutral-300 hover:bg-gray-50 dark:hover:bg-neutral-800 whitespace-nowrap"
              >
                {semanaIndex === idx ? (
                  <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                ) : (
                  <span className="w-3.5 shrink-0" />
                )}
                {s.label}
              </button>
            ))}
          </div>,
          document.body,
        )}
    </>
  );
}

export default function MensajesEnviados({
  lideres,
  filtros,
  ocultarBarraFiltros = false,
  puedeEliminar = false,
}: {
  lideres: any[];
  filtros?: MensajesFiltrosApi;
  ocultarBarraFiltros?: boolean;
  puedeEliminar?: boolean;
}) {
  if (filtros) {
    return (
      <MensajesEnviadosLista
        lideres={lideres}
        filtros={filtros}
        ocultarBarraFiltros={ocultarBarraFiltros}
        puedeEliminar={puedeEliminar}
      />
    );
  }

  return (
    <MensajesEnviadosConFiltros
      lideres={lideres}
      ocultarBarraFiltros={ocultarBarraFiltros}
      puedeEliminar={puedeEliminar}
    />
  );
}

function MensajesEnviadosConFiltros({
  lideres,
  ocultarBarraFiltros,
  puedeEliminar,
}: {
  lideres: any[];
  ocultarBarraFiltros: boolean;
  puedeEliminar: boolean;
}) {
  const filtros = useMensajesFiltros();
  return (
    <MensajesEnviadosLista
      lideres={lideres}
      filtros={filtros}
      ocultarBarraFiltros={ocultarBarraFiltros}
      puedeEliminar={puedeEliminar}
    />
  );
}

function MensajesEnviadosLista({
  lideres,
  filtros,
  ocultarBarraFiltros = false,
  puedeEliminar = false,
}: {
  lideres: any[];
  filtros: MensajesFiltrosApi;
  ocultarBarraFiltros?: boolean;
  puedeEliminar?: boolean;
}) {
  const {
    anioMes,
    semanaIndex,
    semanas,
  } = filtros;

  const [mensajeSeleccionado, setMensajeSeleccionado] = useState<any | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [eliminandoId, setEliminandoId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: mensajes = [], isLoading } = useQuery({
    queryKey: ["historial-mensajes"],
    queryFn: () => obtenerHistorialMensajesAction(),
  });

  useEffect(() => {
    setPage(1);
  }, [anioMes.anio, anioMes.mes, semanaIndex]);

  const mensajesFiltrados = useMemo(() => {
    return mensajes.filter((m: { created_at: string }) => {
      const d = new Date(m.created_at);
      if (d.getFullYear() !== anioMes.anio || d.getMonth() !== anioMes.mes) return false;
      if (semanaIndex === null) return true;
      const semana = semanas[semanaIndex];
      if (!semana) return true;
      return d >= inicioDia(semana.start) && d <= finDia(semana.end);
    });
  }, [mensajes, anioMes, semanaIndex, semanas]);

  const totalPages = Math.max(1, Math.ceil(mensajesFiltrados.length / pageSize));

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const mensajesPagina = useMemo(() => {
    const start = (page - 1) * pageSize;
    return mensajesFiltrados.slice(start, start + pageSize);
  }, [mensajesFiltrados, page, pageSize]);

  const getNombreUsuario = (id: string) => {
    const user = lideres.find((l) => l.id === id);
    return user ? user.nombres : "Usuario Desconocido";
  };

  const formatearFecha = (fecha: string) => {
    const d = new Date(fecha);
    const opciones: Intl.DateTimeFormatOptions = {
      weekday: "short",
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    };

    let formateada = d.toLocaleString("es-ES", opciones);
    formateada = formateada.replace(",", " a las");
    formateada = formateada.charAt(0).toUpperCase() + formateada.slice(1);

    return formateada;
  };

  const confirmarEliminar = async (m: { id: string; mensaje: string }) => {
    const preview =
      m.mensaje.length > 80 ? `${m.mensaje.slice(0, 80)}…` : m.mensaje;
    const isDark =
      typeof document !== "undefined" &&
      document.documentElement.classList.contains("dark");

    const confirmacion = await Swal.fire({
      ...swalThemeOptions({
        confirmButtonClass: isDark ? "swal-btn-outline-red" : "swal-btn-outline-red-light",
        cancelButtonClass: isDark ? "swal-btn-outline-blue" : "swal-btn-outline-blue-light",
      }),
      title: "¿Eliminar mensaje?",
      text: `Se eliminará permanentemente: "${preview}"`,
      icon: "warning",
      showCancelButton: true,
      reverseButtons: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });

    if (!confirmacion.isConfirmed) return;

    setEliminandoId(m.id);
    const result = await eliminarMensajeAction(m.id);
    setEliminandoId(null);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success(result.success || "Mensaje eliminado.");
    if (mensajeSeleccionado?.id === m.id) {
      setMensajeSeleccionado(null);
    }
    queryClient.invalidateQueries({ queryKey: ["historial-mensajes"] });
  };

  const colSpan = puedeEliminar ? 7 : 6;

  return (
    <div className={`w-full ${ocultarBarraFiltros ? "" : "mt-6"}`}>
      {!ocultarBarraFiltros && (
        <div className="flex justify-center mb-6">
          <MensajesFiltrosBar filtros={filtros} />
        </div>
      )}

      <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-neutral-700">
            <thead className="bg-gray-50 dark:bg-neutral-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider w-12">
                  No.
                </th>
                <th className="px-4 py-3 text-left text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider w-24">
                  Estado
                </th>
                <th className="px-4 py-3 text-left text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[11rem]">
                  Fecha
                </th>
                <th className="px-4 py-3 text-left text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Mensaje
                </th>
                <th className="px-4 py-3 text-left text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider w-36">
                  Público
                </th>
                <th className="px-4 py-3 text-left text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider w-24">
                  Vistas
                </th>
                {puedeEliminar && (
                  <th className="px-4 py-3 text-center text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider w-16">
                    Acciones
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-neutral-900 divide-y divide-gray-200 dark:divide-neutral-700">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="px-4 py-3"><div className="h-4 w-6 bg-gray-200 dark:bg-neutral-700 rounded" /></td>
                    <td className="px-4 py-3"><div className="h-5 w-16 bg-gray-200 dark:bg-neutral-700 rounded-full" /></td>
                    <td className="px-4 py-3"><div className="h-4 w-20 bg-gray-200 dark:bg-neutral-700 rounded" /></td>
                    <td className="px-4 py-3"><div className="h-4 w-full max-w-xs bg-gray-200 dark:bg-neutral-700 rounded" /></td>
                    <td className="px-4 py-3"><div className="h-5 w-20 bg-gray-200 dark:bg-neutral-700 rounded-md" /></td>
                    <td className="px-4 py-3"><div className="h-4 w-12 bg-gray-200 dark:bg-neutral-700 rounded" /></td>
                    {puedeEliminar && (
                      <td className="px-4 py-3"><div className="h-8 w-8 bg-gray-200 dark:bg-neutral-700 rounded mx-auto" /></td>
                    )}
                  </tr>
                ))
              ) : mensajesFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={colSpan} className="px-4 py-10 text-center text-gray-500 dark:text-neutral-400 font-semibold">
                    {mensajes.length === 0
                      ? "No hay mensajes enviados."
                      : "No hay mensajes en este periodo."}
                  </td>
                </tr>
              ) : (
                mensajesPagina.map((m: any, index: number) => (
                  <tr
                    key={m.id}
                    onClick={() => setMensajeSeleccionado(m)}
                    className="hover:bg-gray-50 dark:hover:bg-neutral-800/50 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3 text-sm font-bold text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      {(page - 1) * pageSize + index + 1}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-full ${
                          m.activo
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-gray-100 text-gray-600 dark:bg-neutral-800 dark:text-gray-400"
                        }`}
                      >
                        {m.activo ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-neutral-400 whitespace-nowrap">
                      {formatearFechaTabla(m.created_at)}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-800 dark:text-gray-200 max-w-xs md:max-w-md lg:max-w-lg truncate">
                      {m.mensaje}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-xs font-bold bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-neutral-300 px-2 py-1 rounded-md">
                        {m.publico_objetivo}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="flex items-center text-sm font-bold text-gray-600 dark:text-neutral-300">
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-blue-500" />
                        {m.sis_mensajes_lecturas?.length || 0}
                      </span>
                    </td>
                    {puedeEliminar && (
                      <td className="px-4 py-3 whitespace-nowrap text-center">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            void confirmarEliminar(m);
                          }}
                          disabled={eliminandoId === m.id}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors disabled:opacity-50"
                          aria-label="Eliminar mensaje"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {!isLoading && mensajesFiltrados.length > 0 && (
        <div className="flex justify-center items-center py-5">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              className="w-10 h-10 rounded-xl border-gray-200 dark:border-neutral-700 shadow-sm text-blue-500 dark:text-blue-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center justify-center min-w-[100px] h-10 px-4 rounded-xl border border-gray-200 dark:border-neutral-700 shadow-sm bg-white dark:bg-neutral-900">
              <span className="text-base font-black text-slate-900 dark:text-slate-100">
                {page} / {totalPages}
              </span>
            </div>
            <Button
              variant="outline"
              size="icon"
              className="w-10 h-10 rounded-xl border-gray-200 dark:border-neutral-700 shadow-sm text-blue-500 dark:text-blue-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <div className="relative">
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                className="appearance-none outline-none h-10 pl-4 pr-9 rounded-xl border border-gray-200 dark:border-neutral-700 shadow-sm bg-white dark:bg-neutral-900 text-blue-600 dark:text-blue-400 font-black text-sm hover:bg-gray-50 dark:hover:bg-neutral-800 cursor-pointer"
              >
                {PAGE_SIZE_OPTIONS.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-600 dark:text-blue-400 pointer-events-none" />
            </div>
          </div>
        </div>
      )}

      <Transition show={!!mensajeSeleccionado} as={Fragment}>
        <Dialog as="div" className="relative z-[200]" onClose={() => setMensajeSeleccionado(null)}>
          <TransitionChild
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" />
          </TransitionChild>

          <div className="fixed inset-0 flex items-center justify-center p-0 md:p-4">
            <TransitionChild
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 md:translate-y-0 md:scale-95"
              enterTo="opacity-100 translate-y-0 md:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 md:scale-100"
              leaveTo="opacity-0 translate-y-4 md:translate-y-0 md:scale-95"
            >
              <DialogPanel className="w-full h-full md:h-[90vh] max-w-4xl bg-gray-50 dark:bg-neutral-950 md:rounded-2xl flex flex-col shadow-2xl overflow-hidden">
                <div className="flex justify-between items-center px-6 py-4 border-b dark:border-neutral-800 bg-white dark:bg-neutral-900 shrink-0 z-10 shadow-sm">
                  <div>
                    <h3 className="text-lg md:text-xl font-bold text-gray-900 dark:text-gray-100">
                      Detalles del Mensaje
                    </h3>
                    <p className="text-xs text-gray-500 font-semibold mt-0.5">
                      Enviado el {mensajeSeleccionado && formatearFecha(mensajeSeleccionado.created_at)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMensajeSeleccionado(null)}
                    className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
                  >
                    <X className="w-6 h-6 text-gray-500" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 md:p-8">
                  {mensajeSeleccionado && (
                    <div className="max-w-3xl mx-auto relative">
                      <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-neutral-800 mb-8">
                        <div className="mb-6">
                          <span className="text-xs font-bold uppercase tracking-wider text-gray-400 block mb-3">
                            Contenido del mensaje:
                          </span>
                          <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap text-lg md:text-xl font-medium leading-relaxed">
                            {mensajeSeleccionado.mensaje}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-3">
                          <div className="bg-blue-50 border border-blue-100 dark:border-blue-900/50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-4 py-2 rounded-xl text-sm font-bold flex items-center">
                            Público: {mensajeSeleccionado.publico_objetivo}
                          </div>
                          <div className="bg-gray-50 border border-gray-100 dark:border-neutral-800 dark:bg-neutral-800/50 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-xl text-sm font-bold flex items-center">
                            Vistas Totales: {mensajeSeleccionado.sis_mensajes_lecturas?.length || 0}
                          </div>
                        </div>
                      </div>

                      <h4 className="text-lg font-black text-gray-800 dark:text-gray-200 mb-4 px-2">
                        Reporte de Vistas
                      </h4>

                      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-200 dark:border-neutral-800 overflow-hidden shadow-sm">
                        {(() => {
                          const lecturas = mensajeSeleccionado.sis_mensajes_lecturas || [];

                          if (mensajeSeleccionado.publico_objetivo === "Usuarios Específicos") {
                            const especificos = mensajeSeleccionado.usuarios_especificos || [];
                            return (
                              <ul className="divide-y divide-gray-100 dark:divide-neutral-800">
                                {especificos.map((uid: string) => {
                                  const lecturaInfo = lecturas.find((l: any) => l.user_id === uid);
                                  return (
                                    <li
                                      key={uid}
                                      className="flex justify-between items-center p-4 md:p-5 hover:bg-gray-50 dark:hover:bg-neutral-800/50 transition-colors"
                                    >
                                      <span className="font-bold text-gray-800 dark:text-gray-200 text-sm md:text-base">
                                        {getNombreUsuario(uid)}
                                      </span>
                                      {lecturaInfo ? (
                                        <div className="flex flex-col items-end">
                                          <div className="flex items-center text-green-600 dark:text-green-400 text-sm font-bold mb-0.5">
                                            <CheckCircle2 className="w-4 h-4 mr-1.5" />
                                            Visto
                                          </div>
                                          <span className="text-[11px] text-gray-500 font-medium">
                                            el {formatearFecha(lecturaInfo.leido_en)}
                                          </span>
                                        </div>
                                      ) : (
                                        <div className="flex items-center text-gray-400 text-sm font-bold bg-gray-100 dark:bg-neutral-800 px-3 py-1.5 rounded-lg">
                                          <Clock className="w-4 h-4 mr-1.5" />
                                          No visto aún
                                        </div>
                                      )}
                                    </li>
                                  );
                                })}
                              </ul>
                            );
                          }

                          if (lecturas.length === 0) {
                            return (
                              <div className="p-12 text-center text-gray-500 font-semibold">
                                Nadie ha visto este mensaje aún.
                              </div>
                            );
                          }

                          return (
                            <ul className="divide-y divide-gray-100 dark:divide-neutral-800">
                              {lecturas.map((l: any, idx: number) => (
                                <li
                                  key={idx}
                                  className="flex justify-between items-center p-4 md:p-5 hover:bg-gray-50 dark:hover:bg-neutral-800/50 transition-colors"
                                >
                                  <span className="font-bold text-gray-800 dark:text-gray-200 text-sm md:text-base">
                                    {getNombreUsuario(l.user_id)}
                                  </span>
                                  <div className="flex flex-col items-end">
                                    <div className="flex items-center text-green-600 dark:text-green-400 text-sm font-bold mb-0.5">
                                      <CheckCircle2 className="w-4 h-4 mr-1.5" />
                                      Visto
                                    </div>
                                    <span className="text-[11px] text-gray-500 font-medium">
                                      el {formatearFecha(l.leido_en)}
                                    </span>
                                  </div>
                                </li>
                              ))}
                            </ul>
                          );
                        })()}
                      </div>

                      <div className="h-16 md:h-8" />
                    </div>
                  )}
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
}
