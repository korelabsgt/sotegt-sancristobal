"use client";

import { useState, useMemo, useEffect, useRef, Fragment } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion, LayoutGroup } from "framer-motion";
import {
  Dialog,
  Transition,
  TransitionChild,
  DialogPanel,
} from "@headlessui/react";
import {
  Megaphone,
  X,
  Search,
  Check,
  Users,
  UserPlus,
  Globe2,
  Medal,
  Target,
  UserRoundSearch,
  ArrowLeft,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/lib/toast";
import { enviarMensajeAction } from "../dashboard/actions/mensajes";
import MensajesEnviados, {
  MensajesFiltrosBar,
  useMensajesFiltros,
} from "./MensajesEnviados";

type PublicoTheme = {
  border: string;
  ring: string;
  bg: string;
  text: string;
  iconBg: string;
  hover: string;
};

type PublicoItem = {
  value: string;
  label: string;
  icon: LucideIcon;
  theme: PublicoTheme;
};

type PublicoGrupo = {
  id: string;
  titulo: string;
  cols: string;
  items: PublicoItem[];
};

const GRUPOS_PUBLICO: PublicoGrupo[] = [
  {
    id: "general",
    titulo: "General",
    cols: "grid-cols-1 sm:grid-cols-2",
    items: [
      {
        value: "Todos",
        label: "Todos",
        icon: Globe2,
        theme: {
          border: "border-slate-500",
          ring: "ring-slate-500",
          bg: "bg-slate-50 dark:bg-slate-950/40",
          text: "text-slate-700 dark:text-slate-300",
          iconBg: "bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300",
          hover: "hover:border-slate-400 dark:hover:border-slate-500",
        },
      },
    ],
  },
  {
    id: "roles",
    titulo: "Por rol",
    cols: "grid-cols-2",
    items: [
      {
        value: "Lideres",
        label: "Enlaces",
        icon: Medal,
        theme: {
          border: "border-orange-500",
          ring: "ring-orange-500",
          bg: "bg-orange-50 dark:bg-orange-950/40",
          text: "text-orange-700 dark:text-orange-300",
          iconBg:
            "bg-orange-100 dark:bg-orange-950/70 text-orange-600 dark:text-orange-400",
          hover: "hover:border-orange-400 dark:hover:border-orange-600",
        },
      },
    ],
  },
  {
    id: "nivel",
    titulo: "Por nivel de compromiso",
    cols: "grid-cols-2 sm:grid-cols-4",
    items: [
      {
        value: "Bajo",
        label: "Bajo",
        icon: Target,
        theme: {
          border: "border-red-500",
          ring: "ring-red-500",
          bg: "bg-red-50 dark:bg-red-950/40",
          text: "text-red-700 dark:text-red-300",
          iconBg:
            "bg-red-100 dark:bg-red-950/70 text-red-600 dark:text-red-400",
          hover: "hover:border-red-400 dark:hover:border-red-600",
        },
      },
      {
        value: "Medio",
        label: "Medio",
        icon: Target,
        theme: {
          border: "border-yellow-500",
          ring: "ring-yellow-500",
          bg: "bg-yellow-50 dark:bg-yellow-950/40",
          text: "text-yellow-700 dark:text-yellow-300",
          iconBg:
            "bg-yellow-100 dark:bg-yellow-950/70 text-yellow-600 dark:text-yellow-400",
          hover: "hover:border-yellow-400 dark:hover:border-yellow-600",
        },
      },
      {
        value: "Cumple",
        label: "Cumple",
        icon: Target,
        theme: {
          border: "border-blue-500",
          ring: "ring-blue-500",
          bg: "bg-blue-50 dark:bg-blue-950/40",
          text: "text-blue-700 dark:text-blue-300",
          iconBg:
            "bg-blue-100 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400",
          hover: "hover:border-blue-400 dark:hover:border-blue-600",
        },
      },
      {
        value: "Alto",
        label: "Alto",
        icon: Target,
        theme: {
          border: "border-green-500",
          ring: "ring-green-500",
          bg: "bg-green-50 dark:bg-green-950/40",
          text: "text-green-700 dark:text-green-300",
          iconBg:
            "bg-green-100 dark:bg-green-950/70 text-green-600 dark:text-green-400",
          hover: "hover:border-green-400 dark:hover:border-green-600",
        },
      },
    ],
  },
  {
    id: "manual",
    titulo: "Selección manual",
    cols: "grid-cols-1 sm:grid-cols-2",
    items: [
      {
        value: "Usuarios Específicos",
        label: "Específicos",
        icon: UserRoundSearch,
        theme: {
          border: "border-teal-500",
          ring: "ring-teal-500",
          bg: "bg-teal-50 dark:bg-teal-950/40",
          text: "text-teal-700 dark:text-teal-300",
          iconBg:
            "bg-teal-100 dark:bg-teal-950/70 text-teal-600 dark:text-teal-400",
          hover: "hover:border-teal-400 dark:hover:border-teal-600",
        },
      },
    ],
  },
];

function nombreCompleto(u: { nombres?: string; apellidos?: string }) {
  return `${u.nombres || ""} ${u.apellidos || ""}`.trim();
}

export default function Difusion({
  usuarios,
  puedeEnviar = true,
}: {
  usuarios: any[];
  puedeEnviar?: boolean;
}) {
  const queryClient = useQueryClient();

  const [isOpen, setIsOpen] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [mensajeTexto, setMensajeTexto] = useState("");
  const [publicoObjetivo, setPublicoObjetivo] = useState("Todos");
  const [usuariosEspecificos, setUsuariosEspecificos] = useState<string[]>([]);
  const [busquedaUsuario, setBusquedaUsuario] = useState("");
  const [enviando, setEnviando] = useState(false);
  const especificosRef = useRef<HTMLDivElement>(null);

  const idUsuario = (u: { id?: string; user_id?: string }) =>
    String(u.id || u.user_id || "");

  const termBusqueda = busquedaUsuario.toLowerCase().trim();
  const buscandoUsuarios = termBusqueda.length >= 1;

  const usuariosLista = useMemo(() => {
    if (!buscandoUsuarios) return [];
    const base = (usuarios || []).filter((u) => idUsuario(u));
    const filtrados = base.filter(
      (u) =>
        `${u.nombres || ""} ${u.apellidos || ""}`
          .toLowerCase()
          .includes(termBusqueda) ||
        (u.email || "").toLowerCase().includes(termBusqueda),
    );

    return [...filtrados].sort((a, b) => {
      const aId = idUsuario(a);
      const bId = idUsuario(b);
      const aIdx = usuariosEspecificos.indexOf(aId);
      const bIdx = usuariosEspecificos.indexOf(bId);
      const aSel = aIdx !== -1;
      const bSel = bIdx !== -1;
      if (aSel && bSel) return aIdx - bIdx;
      if (aSel) return -1;
      if (bSel) return 1;
      return nombreCompleto(a).localeCompare(nombreCompleto(b), "es");
    });
  }, [usuarios, termBusqueda, buscandoUsuarios, usuariosEspecificos]);

  const usuariosSeleccionados = useMemo(() => {
    const ids = new Set(usuariosEspecificos);
    return (usuarios || []).filter((u) => ids.has(idUsuario(u)));
  }, [usuarios, usuariosEspecificos]);

  const resetForm = () => {
    setTitulo("");
    setMensajeTexto("");
    setPublicoObjetivo("Todos");
    setUsuariosEspecificos([]);
    setBusquedaUsuario("");
  };

  const handleClose = () => {
    if (enviando) return;
    setIsOpen(false);
  };

  const toggleUsuario = (id: string) => {
    if (!id) return;
    setUsuariosEspecificos((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [id, ...prev],
    );
  };

  const toggleTodosVisibles = () => {
    const idsVisibles = usuariosLista.map((u) => idUsuario(u)).filter(Boolean);
    const todosSeleccionados =
      idsVisibles.length > 0 &&
      idsVisibles.every((id) => usuariosEspecificos.includes(id));
    if (todosSeleccionados) {
      setUsuariosEspecificos((prev) =>
        prev.filter((id) => !idsVisibles.includes(id)),
      );
    } else {
      setUsuariosEspecificos((prev) =>
        Array.from(new Set([...prev, ...idsVisibles])),
      );
    }
  };

  const handleEnviar = async () => {
    if (!mensajeTexto.trim()) {
      toast.warning("Escribe un mensaje para enviar");
      return;
    }
    if (
      publicoObjetivo === "Usuarios Específicos" &&
      usuariosEspecificos.length === 0
    ) {
      toast.warning("Selecciona al menos un usuario específico");
      return;
    }

    setEnviando(true);
    try {
      const { push } = await enviarMensajeAction({
        titulo: titulo.trim() || undefined,
        mensaje: mensajeTexto,
        publico_objetivo: publicoObjetivo,
        usuarios_especificos: usuariosEspecificos,
      });

      const n = push?.enviadas ?? 0;
      toast.success(
        n > 0
          ? `Difusión enviada. Notificación push a ${n} dispositivo${n === 1 ? "" : "s"}.`
          : "Difusión enviada. (Ningún destinatario tiene notificaciones activas en este momento)",
      );
      queryClient.invalidateQueries({ queryKey: ["historial-mensajes"] });
      resetForm();
      setIsOpen(false);
    } catch (error: any) {
      toast.error("Error al enviar la difusión: " + error.message);
    } finally {
      setEnviando(false);
    }
  };

  const esEspecificos = publicoObjetivo === "Usuarios Específicos";
  const filtrosMensajes = useMensajesFiltros();

  useEffect(() => {
    if (!esEspecificos || !isOpen) return;
    const t = window.setTimeout(() => {
      especificosRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }, 80);
    return () => window.clearTimeout(t);
  }, [esEspecificos, isOpen]);

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] gap-3 items-center mt-4 mb-4">
        <div className="min-w-0">
          <h3 className="text-lg font-black text-gray-800 dark:text-gray-100 flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-green-600 dark:text-green-400" />
            Difusión
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {puedeEnviar
              ? "Envía avisos e instrucciones a tus usuarios"
              : "Historial de mensajes dirigidos a ti"}
          </p>
        </div>

        <MensajesFiltrosBar filtros={filtrosMensajes} />

        <div className="flex justify-center lg:justify-end">
          {puedeEnviar && (
            <Button
              onClick={() => setIsOpen(true)}
              variant="outline"
              className="gap-2 border-green-500 dark:border-green-600 text-green-700 dark:text-green-400 bg-green-50/90 dark:bg-green-950/45 hover:bg-green-100 dark:hover:bg-green-950/65 font-bold shadow-none"
            >
              <Megaphone className="w-4 h-4" />
              Nueva Difusión
            </Button>
          )}
        </div>
      </div>

      <MensajesEnviados
        lideres={usuarios}
        filtros={filtrosMensajes}
        ocultarBarraFiltros
        puedeEliminar={puedeEnviar}
      />

      {puedeEnviar && (
      <Transition show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-[150]" onClose={handleClose}>
          <TransitionChild
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
          </TransitionChild>

          <div className="fixed inset-0 flex items-stretch md:items-center justify-center p-0 md:p-4">
            <TransitionChild
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 md:translate-y-0 md:scale-95"
              enterTo="opacity-100 translate-y-0 md:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 md:scale-100"
              leaveTo="opacity-0 translate-y-4 md:translate-y-0 md:scale-95"
            >
              <DialogPanel className="w-full h-full max-h-[100dvh] md:h-auto md:max-h-[90vh] md:max-w-2xl lg:max-w-3xl bg-white dark:bg-neutral-900 flex flex-col shadow-2xl overflow-hidden min-h-0 md:rounded-2xl border-0 md:border md:border-gray-200 md:dark:border-neutral-700">
                <div className="flex justify-between items-center px-4 md:px-5 py-3 md:py-4 border-b dark:border-neutral-800 shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="p-2 rounded-lg bg-green-100 dark:bg-green-950/60 text-green-600 dark:text-green-400">
                      <Megaphone className="w-5 h-5" />
                    </span>
                    <div>
                      <h3 className="text-base md:text-lg font-bold text-gray-900 dark:text-gray-100">
                        Nueva Difusión
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Envía un mensaje a tu público objetivo
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleClose}
                    className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 md:p-5 flex flex-col gap-4 md:gap-5">
                  <div>
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 block">
                      Título{" "}
                      <span className="font-normal text-gray-400">
                        (encabezado de la notificación)
                      </span>
                    </label>
                    <Input
                      value={titulo}
                      onChange={(e) => setTitulo(e.target.value)}
                      maxLength={60}
                      placeholder="Ej. Aviso importante"
                      className="h-10 text-sm"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 block">
                      Mensaje
                    </label>
                    <textarea
                      value={mensajeTexto}
                      onChange={(e) => setMensajeTexto(e.target.value)}
                      className="w-full min-h-[110px] p-3 text-sm border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-y text-gray-900 dark:text-gray-100"
                      placeholder="Escribe un mensaje de motivación, aviso o instrucción importante..."
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <label className="text-sm font-bold text-gray-700 dark:text-gray-300 block">
                        Público objetivo
                      </label>
                      {esEspecificos && (
                        <button
                          type="button"
                          onClick={() => {
                            setPublicoObjetivo("Todos");
                            setUsuariosEspecificos([]);
                            setBusquedaUsuario("");
                          }}
                          className="inline-flex items-center gap-1 text-xs font-bold text-teal-700 dark:text-teal-400 hover:underline"
                        >
                          <ArrowLeft className="h-3.5 w-3.5" />
                          Cambiar público
                        </button>
                      )}
                    </div>
                    <div className="space-y-2.5">
                      <AnimatePresence initial={false} mode="popLayout">
                        {GRUPOS_PUBLICO.filter(
                          (grupo) => !esEspecificos || grupo.id === "manual",
                        ).map((grupo) => (
                          <motion.div
                            key={grupo.id}
                            layout
                            initial={{ opacity: 0, height: 0, y: -8 }}
                            animate={{ opacity: 1, height: "auto", y: 0 }}
                            exit={{ opacity: 0, height: 0, y: -10 }}
                            transition={{
                              duration: 0.32,
                              ease: [0.25, 0.46, 0.45, 0.94],
                            }}
                            className="overflow-hidden"
                          >
                            <div className="rounded-xl border border-gray-200 dark:border-neutral-700 bg-gray-50/70 dark:bg-neutral-900/50 p-2.5 sm:p-3">
                              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                {grupo.titulo}
                              </p>
                              <div className={`grid ${grupo.cols} gap-2`}>
                                {grupo.items.map((p) => {
                                  const activo = publicoObjetivo === p.value;
                                  const t = p.theme;
                                  const Icon = p.icon;
                                  return (
                                    <button
                                      key={p.value}
                                      type="button"
                                      onClick={() => {
                                        setPublicoObjetivo(p.value);
                                        if (p.value !== "Usuarios Específicos") {
                                          setUsuariosEspecificos([]);
                                          setBusquedaUsuario("");
                                        }
                                      }}
                                      className={`group flex items-center gap-2 text-left px-2.5 py-2 sm:px-3 sm:py-2.5 rounded-lg border-2 transition-all min-w-0 ${
                                        activo
                                          ? `${t.border} ${t.bg} ring-2 ${t.ring} shadow-sm`
                                          : `border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-950 ${t.hover}`
                                      }`}
                                    >
                                      <span
                                        className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${t.iconBg}`}
                                      >
                                        <Icon className="h-3.5 w-3.5" />
                                      </span>
                                      <span
                                        className={`min-w-0 flex-1 text-xs sm:text-sm font-bold leading-tight ${t.text}`}
                                      >
                                        {p.label}
                                      </span>
                                      {activo && (
                                        <Check
                                          className={`h-4 w-4 shrink-0 ${t.text}`}
                                        />
                                      )}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  </div>

                  {esEspecificos && (
                    <div
                      ref={especificosRef}
                      className="border border-gray-200 dark:border-neutral-700 rounded-xl overflow-hidden shrink-0"
                    >
                      <div className="flex items-center justify-between px-2 py-2 sm:px-3 sm:py-2.5 bg-gray-50 dark:bg-neutral-800/60 border-b dark:border-neutral-700 gap-2">
                        <span className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-1.5 min-w-0">
                          <Users className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">Destinatarios</span>
                          <span className="text-[10px] font-bold text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-950/60 px-1.5 py-0.5 rounded-full shrink-0">
                            {usuariosEspecificos.length}
                          </span>
                        </span>
                        {buscandoUsuarios && usuariosLista.length > 0 && (
                          <button
                            type="button"
                            onClick={toggleTodosVisibles}
                            className="text-[10px] sm:text-xs font-bold text-green-600 dark:text-green-400 hover:underline shrink-0 whitespace-nowrap"
                          >
                            {usuariosLista.every((u) =>
                              usuariosEspecificos.includes(idUsuario(u)),
                            )
                              ? "Quitar resultados"
                              : "Seleccionar resultados"}
                          </button>
                        )}
                      </div>

                      <div className="p-3 border-b border-gray-100 dark:border-neutral-800">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                          <Input
                            placeholder="Escribe un nombre para buscar..."
                            value={busquedaUsuario}
                            onChange={(e) => setBusquedaUsuario(e.target.value)}
                            className="pl-9 h-9 text-sm"
                            autoComplete="off"
                          />
                        </div>
                      </div>

                      {usuariosSeleccionados.length > 0 && (
                        <div className="px-2 pt-2 sm:px-3 border-b border-gray-100 dark:border-neutral-800 pb-2">
                          <p className="text-[10px] font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1.5 px-0.5">
                            Seleccionados
                          </p>
                          <div className="flex flex-col gap-1 max-h-[20vh] overflow-y-auto">
                            {usuariosSeleccionados.map((u) => {
                              const uid = idUsuario(u);
                              return (
                                <button
                                  key={`sel-${uid}`}
                                  type="button"
                                  onClick={() => toggleUsuario(uid)}
                                  className="flex items-center gap-2 w-full px-2.5 py-2 rounded-md border border-green-500 bg-green-50 dark:bg-green-950/40 text-left"
                                >
                                  <span className="min-w-0 flex-1">
                                    <span className="block text-xs font-bold text-green-800 dark:text-green-200 leading-tight truncate">
                                      {u.nombres || "—"}
                                    </span>
                                    <span className="block text-[11px] text-green-700 dark:text-green-300 leading-tight truncate">
                                      {u.apellidos || ""}
                                    </span>
                                  </span>
                                  <span className="flex items-center justify-center w-4 h-4 rounded border bg-green-600 border-green-600 shrink-0">
                                    <Check
                                      className="w-3 h-3 text-white"
                                      strokeWidth={3}
                                    />
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      <LayoutGroup id="destinatarios-difusion">
                        <div className="max-h-[36vh] min-h-[8rem] overflow-y-auto px-2 py-2 sm:px-3 sm:py-3 flex flex-col gap-1">
                          {!buscandoUsuarios ? (
                            <div className="flex-1 flex items-center justify-center p-6 text-center text-xs text-gray-500 dark:text-gray-400">
                              Escribe un nombre para mostrar usuarios
                            </div>
                          ) : usuariosLista.length === 0 ? (
                            <div className="flex-1 flex items-center justify-center p-6 text-center text-xs text-gray-500 dark:text-gray-400">
                              No se encontraron usuarios
                            </div>
                          ) : (
                            usuariosLista.map((u) => {
                              const uid = idUsuario(u);
                              const isSelected =
                                usuariosEspecificos.includes(uid);
                              return (
                                <motion.button
                                  key={uid}
                                  type="button"
                                  layout
                                  initial={{ opacity: 0, y: 6 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ duration: 0.2 }}
                                  onClick={() => toggleUsuario(uid)}
                                  className={`flex items-center gap-2 w-full px-2.5 py-2 rounded-md border text-left min-w-0 transition-colors duration-200 ${
                                    isSelected
                                      ? "border-green-500 bg-green-50 dark:bg-green-950/40"
                                      : "border-gray-200 dark:border-neutral-700 hover:bg-gray-50 dark:hover:bg-neutral-800"
                                  }`}
                                >
                                  <span className="min-w-0 flex-1">
                                    <span
                                      className={`block text-xs font-bold leading-tight truncate ${
                                        isSelected
                                          ? "text-green-800 dark:text-green-200"
                                          : "text-gray-800 dark:text-gray-100"
                                      }`}
                                    >
                                      {u.nombres || "—"}
                                    </span>
                                    <span
                                      className={`block text-[11px] leading-tight truncate ${
                                        isSelected
                                          ? "text-green-700 dark:text-green-300"
                                          : "text-gray-600 dark:text-gray-400"
                                      }`}
                                    >
                                      {u.apellidos || ""}
                                    </span>
                                  </span>
                                  <span
                                    className={`flex items-center justify-center w-4 h-4 rounded border shrink-0 ${
                                      isSelected
                                        ? "bg-green-600 border-green-600"
                                        : "border-gray-300 dark:border-neutral-600"
                                    }`}
                                  >
                                    {isSelected && (
                                      <Check
                                        className="w-3 h-3 text-white"
                                        strokeWidth={3}
                                      />
                                    )}
                                  </span>
                                </motion.button>
                              );
                            })
                          )}
                        </div>
                      </LayoutGroup>
                    </div>
                  )}

                </div>

                <div className="flex justify-end gap-2 px-4 md:px-5 py-3 md:py-4 border-t dark:border-neutral-800 shrink-0 bg-gray-50/50 dark:bg-neutral-900">
                  <Button
                    variant="ghost"
                    onClick={handleClose}
                    disabled={enviando}
                    className="text-gray-600 dark:text-gray-300"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleEnviar}
                    disabled={enviando || !mensajeTexto.trim()}
                    className="gap-2 bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800 text-white font-bold"
                  >
                    <UserPlus className="w-4 h-4" />
                    {enviando ? "Enviando..." : "Enviar Difusión"}
                  </Button>
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </Dialog>
      </Transition>
      )}
    </div>
  );
}
