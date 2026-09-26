"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { Afiliado, Lider } from "./esquemas";
import { esRolCoordinador, esRolEmpleado, esUsuarioSede } from "./esquemas";
import Tabla from "./Tabla";
import EstadisticasTabs from "./estadisticas/EstadisticasTabs";
import TextoAnimado from "@/components/ui/Typeanimation";
import Image from "next/image";
import {
  Users,
  BarChart3,
  UserPlus,
  Search,
  Loader2,
  Megaphone,
  LayoutGrid,
  Table2,
  ArrowLeft,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { obtenerAfiliadosAction } from "./actions/afiliados";
import { obtenerConfiguracionAction } from "../dashboard/actions/configuracion";
import { calcularNivelCompromiso } from "@/lib/nivelCompromiso";
import MensajesEnviados from "./MensajesEnviados";
import type { FormatoVista } from "./Tabla";
import { temaDesdeLider } from "./temaPestana";
import { metasPorRol } from "@/lib/metasAfiliacion";

function etiquetaRolCelula(lider: Lider): string {
  if (esRolEmpleado(lider.rol)) return "Empleado";
  if (esRolCoordinador(lider.rol)) return "Coordinador";
  if (esUsuarioSede(lider)) return "Sede";
  return "Líder de enlace";
}

const familiaEase = [0.25, 0.46, 0.45, 0.94] as const;

interface Props {
  mode?: "embedded" | "page";
  lider: Lider | null;
  onClose?: () => void;
  onEditar: (afiliado: Afiliado) => void;
  onAnadirAfiliado: (liderId: string, isFirstMember?: boolean, familiarDeId?: string) => void;
  onDataChange: () => void;
  rolUsuarioSesion: string;
  afiliadosSimulados?: Afiliado[];
  usuarios?: Lider[];
}

type Vista = "miembros" | "estadisticas" | "mensajes";

export default function Celula({
  mode = "page",
  lider,
  onClose,
  onEditar,
  onAnadirAfiliado,
  onDataChange,
  rolUsuarioSesion,
  afiliadosSimulados,
  usuarios = [],
}: Props) {
  const embedded = mode === "embedded";
  const [vistaActual, setVistaActual] = useState<Vista>("miembros");
  const [busqueda, setBusqueda] = useState("");
  const [formatoVista, setFormatoVista] = useState<FormatoVista>("tabla");
  const [titularFamilia, setTitularFamilia] = useState<Afiliado | null>(null);

  const esSimulado = !!lider?.simulado;
  const esSedeSesion = (rolUsuarioSesion || "").toUpperCase() === "SEDE";
  const celulaEsSede = !!lider && esUsuarioSede(lider);
  const soloLectura = esSedeSesion && !celulaEsSede;

  const { data: afiliadosQuery, isPending: isAfiliadosPending } = useQuery({
    queryKey: ["afiliados-lider", lider?.id],
    queryFn: () => obtenerAfiliadosAction(lider?.id),
    enabled: !!lider?.id && !esSimulado,
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
    refetchOnMount: false,
  });

  const afiliadosDelLider = esSimulado
    ? afiliadosSimulados ?? []
    : afiliadosQuery ?? [];
  const isLoading =
    esSimulado ? false : isAfiliadosPending && afiliadosQuery === undefined;

  const { data: config } = useQuery({
    queryKey: ["config_sistema"],
    queryFn: () => obtenerConfiguracionAction(),
  });

  if (!lider) return null;

  const etiquetaRol = etiquetaRolCelula(lider);
  const tema = temaDesdeLider(lider, celulaEsSede);

  const switchTrackClass =
    "flex bg-gray-100 dark:bg-neutral-800 p-1 rounded-lg border border-gray-200 dark:border-neutral-700";
  const switchActivoClass = tema.activeToggle;
  const switchInactivoClass = "text-gray-500 dark:text-gray-400";

  const liderAfiliado =
    afiliadosDelLider.find((a: Afiliado) => !!a.es_lider) ??
    (afiliadosDelLider.length > 0 ? afiliadosDelLider[0] : null);
  const restantesAfiliados = liderAfiliado
    ? afiliadosDelLider.filter((a: Afiliado) => a.id !== liderAfiliado.id)
    : afiliadosDelLider;

  const miembrosParaTabla = liderAfiliado
    ? [{ ...liderAfiliado, es_lider: true }, ...restantesAfiliados]
    : afiliadosDelLider;

  const totalEnGrupo = afiliadosDelLider.filter((a: Afiliado) => !a.familiar_de).length;
  const { meta: META_CELULA, min: META_MINIMA } = metasPorRol(
    config,
    lider.rol,
  );
  const objetivo = META_CELULA;
  const progreso = Math.min((totalEnGrupo / objetivo) * 100, 100);

  const {
    nivel: nivelCompromiso,
    colorBarra,
    textoColor,
    gifUrl,
    mensaje,
  } = calcularNivelCompromiso(
    totalEnGrupo,
    META_CELULA,
    META_MINIMA,
    lider.nombres,
    etiquetaRol,
  );

  const afiliadosFiltrados =
    busqueda.length >= 2
      ? miembrosParaTabla.filter(
          (a: Afiliado) =>
            a.nombres.toLowerCase().includes(busqueda.toLowerCase()) ||
            a.apellidos.toLowerCase().includes(busqueda.toLowerCase()) ||
            a.dpi.includes(busqueda),
        )
      : miembrosParaTabla;

  const TABS = [
    { id: "miembros", label: "Miembros", icon: Users },
    { id: "estadisticas", label: "Estadísticas", icon: BarChart3 },
    { id: "mensajes", label: "Mensajes", icon: Megaphone },
  ];

  const panelBody = (
    <>
      <div className="px-3 lg:px-6 py-2 border-b border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-950 sticky top-0 z-20">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2 lg:gap-4 w-full min-w-0">
          <div className="flex items-center justify-between gap-2 w-full min-w-0 sm:contents">
            {onClose ? (
              <button
                type="button"
                onClick={onClose}
                className="order-1 inline-flex items-center gap-1.5 shrink-0 text-sm font-bold text-red-600 hover:text-red-700 underline underline-offset-[6px] decoration-red-600/90 hover:decoration-red-700 uppercase tracking-wide bg-transparent border-0 cursor-pointer transition-colors"
              >
                <ArrowLeft className="w-4 h-4 shrink-0" />
                <span className="hidden sm:inline">Volver</span>
              </button>
            ) : null}

            <div className="order-2 sm:order-3 shrink-0 text-right px-1 min-w-0 max-w-[70%] sm:max-w-[12rem] lg:max-w-[16rem]">
              <div className="flex items-center justify-end gap-1 min-w-0">
                <h3 className={`text-[10px] sm:text-xs font-black uppercase leading-tight truncate ${tema.btnText}`}>
                  {lider.nombres} {lider.apellidos}
                </h3>
                {isLoading && (
                  <Loader2 className={`w-3 h-3 animate-spin shrink-0 ${tema.btnText}`} />
                )}
              </div>
            </div>
          </div>

          <div className="order-3 sm:order-2 flex-1 min-w-0 w-full sm:max-w-md mx-auto">
            <div className="flex bg-gray-200 dark:bg-neutral-800 p-1 rounded-lg gap-1 w-full">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setVistaActual(tab.id as Vista);
                    setTitularFamilia(null);
                  }}
                  className={`flex-1 flex items-center justify-center gap-1 min-w-0 py-2 rounded-md text-[10px] sm:text-[11px] font-bold transition-all ${
                    vistaActual === tab.id
                      ? switchActivoClass
                      : switchInactivoClass + " hover:bg-gray-300 dark:hover:bg-neutral-600"
                  }`}
                >
                  <tab.icon className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div
        className={`flex-1 overflow-y-auto px-3 md:px-6 bg-gray-50/50 dark:bg-neutral-950 ${embedded ? "py-2" : "py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]"}`}
      >
        <div className="w-full">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
              <Loader2 className="w-12 h-12 animate-spin text-blue-500 dark:text-blue-400" />
              <p className="text-sm font-bold text-gray-500 dark:text-neutral-400 uppercase">
                Consultando Miembros de Célula...
              </p>
            </div>
          ) : vistaActual === "miembros" ? (
            <AnimatePresence mode="wait" initial={false}>
            {titularFamilia ? (
              <motion.div
                key={`familia-${titularFamilia.id}`}
                className="space-y-4"
                initial={{ opacity: 0, x: 36 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -28 }}
                transition={{ duration: 0.35, ease: familiaEase }}
              >
                <button
                  type="button"
                  onClick={() => setTitularFamilia(null)}
                  className="inline-flex items-center gap-1.5 text-sm font-bold text-red-600 hover:text-red-700 underline underline-offset-[6px] decoration-red-600/90 hover:decoration-red-700 uppercase tracking-wide bg-transparent border-0 cursor-pointer transition-colors"
                >
                  <ArrowLeft className="w-4 h-4 shrink-0" />
                  Volver a miembros
                </button>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl border border-purple-200 dark:border-purple-800 bg-purple-50/70 dark:bg-purple-950/30 px-4 py-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 shrink-0">
                      <Users className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-black uppercase tracking-wide text-purple-600 dark:text-purple-400">
                        Familia de
                      </p>
                      <h3 className="text-sm md:text-base font-black uppercase truncate text-gray-900 dark:text-gray-100">
                        {titularFamilia.nombres} {titularFamilia.apellidos}
                      </h3>
                    </div>
                  </div>
                  {!soloLectura && (
                    <Button
                      type="button"
                      onClick={() =>
                        onAnadirAfiliado(lider.id, false, titularFamilia.id)
                      }
                      className="gap-2 font-bold bg-purple-600 hover:bg-purple-700 text-white shrink-0"
                    >
                      <UserPlus className="w-4 h-4" />
                      Añadir Familiar
                    </Button>
                  )}
                </div>

                <div className="flex justify-end mb-3">
                  <div className={`${switchTrackClass} shrink-0`}>
                    <button
                      type="button"
                      onClick={() => setFormatoVista("tabla")}
                      title="Ver lista"
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-[10px] font-bold uppercase transition-colors ${
                        formatoVista === "tabla"
                          ? switchActivoClass
                          : switchInactivoClass
                      }`}
                    >
                      <Table2 className="w-4 h-4" />
                      <span className="hidden sm:inline">Lista</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormatoVista("tarjetas")}
                      title="Ver tarjetas"
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-[10px] font-bold uppercase transition-colors ${
                        formatoVista === "tarjetas"
                          ? switchActivoClass
                          : switchInactivoClass
                      }`}
                    >
                      <LayoutGrid className="w-4 h-4" />
                      <span className="hidden sm:inline">Tarjetas</span>
                    </button>
                  </div>
                </div>

                <Tabla
                  lider={lider}
                  afiliados={[
                    titularFamilia,
                    ...afiliadosDelLider.filter(
                      (a) => a.familiar_de === titularFamilia.id,
                    ),
                  ]}
                  onEditar={onEditar}
                  onAnadirFamiliar={(titularId) =>
                    onAnadirAfiliado(lider.id, false, titularId)
                  }
                  onDataChange={onDataChange}
                  rolUsuarioSesion={rolUsuarioSesion}
                  config={config}
                  totalEnCelula={totalEnGrupo}
                  isFamilyView
                  formato={formatoVista}
                  tema={tema}
                />
              </motion.div>
            ) : (
              <motion.div
                key="miembros-lista"
                initial={{ opacity: 0, x: -36 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 28 }}
                transition={{ duration: 0.35, ease: familiaEase }}
              >
                <div className="mb-6 p-4 border border-gray-200 dark:border-neutral-800 rounded-xl bg-white dark:bg-neutral-900/80 shadow-sm flex flex-col md:flex-row items-center gap-4">
                  <div className="w-full md:flex-1">
                    <div className="flex justify-between items-center mb-2 gap-2">
                      <span className="text-xs font-bold text-gray-600 dark:text-neutral-300 uppercase">
                        Nivel de compromiso:{" "}
                        <span className={textoColor}>{nivelCompromiso}</span>
                      </span>
                      <span
                        className={`text-sm font-black shrink-0 ${textoColor}`}
                      >
                        {totalEnGrupo} / {objetivo}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-neutral-800 rounded-full h-4 overflow-hidden shadow-inner border border-gray-300/50 dark:border-neutral-700">
                      <div
                        className={`${colorBarra} h-full transition-all duration-1000`}
                        style={{ width: `${progreso}%` }}
                      />
                    </div>
                    <div className="hidden md:block text-center mt-2">
                      <span className="text-xs text-gray-600 dark:text-neutral-300 font-bold bg-gray-100 dark:bg-neutral-800/80 px-4 py-1 rounded-full border border-gray-200 dark:border-neutral-700 inline-block">
                        <TextoAnimado textos={[mensaje]} />
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 bg-gray-100 dark:bg-neutral-800/60 p-2 rounded-lg border border-gray-200 dark:border-neutral-700 w-full md:w-auto shrink-0">
                    <div className="md:hidden flex-1 min-w-0">
                      <span className="text-[10px] text-gray-600 dark:text-neutral-300 font-bold leading-tight uppercase">
                        <TextoAnimado textos={[mensaje]} />
                      </span>
                    </div>
                    <div className="shrink-0 rounded-lg overflow-hidden bg-white/80 dark:bg-neutral-900/50 p-1">
                      <Image
                        src={gifUrl}
                        alt="Status"
                        width={100}
                        height={100}
                        unoptimized
                        className="object-contain"
                      />
                    </div>
                  </div>
                </div>

                <div
                  className={`overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900 border-t-4 ${tema.borderTop}`}
                >
                  <div className="flex flex-col gap-3 border-b border-gray-100 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-900 sm:flex-row sm:items-center">
                    <div className="relative order-2 min-w-0 w-full sm:order-1 sm:min-w-[12rem] sm:flex-1">
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Buscar por nombre o DPI..."
                        className={`h-11 w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 dark:border-neutral-700 dark:bg-neutral-900 ${tema.focusRing}`}
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                      />
                    </div>
                    <div className="order-1 flex w-full min-w-0 gap-2 sm:order-2 sm:w-auto sm:shrink-0 sm:ml-auto">
                      <div
                        className={`${switchTrackClass} flex h-11 w-2/3 min-w-0 items-center sm:w-auto sm:min-w-[15.5rem]`}
                      >
                        <button
                          type="button"
                          onClick={() => setFormatoVista("tabla")}
                          title="Ver lista"
                          className={`inline-flex flex-1 items-center justify-center gap-1 rounded-md px-1.5 py-2 text-[10px] font-bold uppercase whitespace-nowrap transition-all sm:gap-2 sm:px-3 sm:text-xs ${
                            formatoVista === "tabla"
                              ? switchActivoClass
                              : switchInactivoClass
                          }`}
                        >
                          <Table2 className="h-4 w-4 shrink-0" />
                          <span className="shrink-0">Lista</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormatoVista("tarjetas")}
                          title="Ver tarjetas"
                          className={`inline-flex flex-1 items-center justify-center gap-1 rounded-md px-1.5 py-2 text-[10px] font-bold uppercase whitespace-nowrap transition-all sm:gap-2 sm:px-3 sm:text-xs ${
                            formatoVista === "tarjetas"
                              ? switchActivoClass
                              : switchInactivoClass
                          }`}
                        >
                          <LayoutGrid className="h-4 w-4 shrink-0" />
                          <span className="shrink-0">Tarjetas</span>
                        </button>
                      </div>
                      {!esSimulado && !soloLectura && (
                        <button
                          type="button"
                          className={`flex h-11 w-1/3 min-w-0 items-center justify-center gap-1 rounded-lg border px-1.5 text-[10px] font-semibold uppercase whitespace-nowrap transition-all duration-300 ease-in-out sm:w-auto sm:min-w-[6.5rem] sm:px-3 sm:text-xs ${
                            totalEnGrupo === 0 && !celulaEsSede
                              ? "border-green-500 bg-green-50 text-green-700 hover:bg-green-100 dark:border-green-500 dark:bg-green-950/50 dark:text-green-400 dark:hover:bg-green-950/70"
                              : `${tema.btnPrimary}`
                          }`}
                          onClick={() =>
                            onAnadirAfiliado(
                              lider.id,
                              totalEnGrupo === 0 && !celulaEsSede,
                            )
                          }
                        >
                          <UserPlus className="h-4 w-4 shrink-0" />
                          <span className="truncate">
                            {totalEnGrupo === 0 && !celulaEsSede
                              ? "Registrarme"
                              : "Añadir"}
                          </span>
                        </button>
                      )}
                    </div>
                  </div>

                  <div
                    className={
                      formatoVista === "tabla" ? "px-0 pb-0" : "p-3 pt-2"
                    }
                  >
                    <p className="px-3 pt-3 mb-2 text-sm font-bold text-gray-800 dark:text-gray-200">
                      Total:{" "}
                      <span className={`tabular-nums ${tema.btnText}`}>
                        {afiliadosFiltrados.length.toLocaleString()}
                      </span>
                    </p>
                    <Tabla
                      lider={lider}
                      afiliados={afiliadosFiltrados}
                      onEditar={onEditar}
                      onAnadirFamiliar={(titularId) =>
                        onAnadirAfiliado(lider.id, false, titularId)
                      }
                      onVerFamilia={setTitularFamilia}
                      onDataChange={onDataChange}
                      rolUsuarioSesion={rolUsuarioSesion}
                      config={config}
                      totalEnCelula={totalEnGrupo}
                      formato={formatoVista}
                      tema={tema}
                      embebido={formatoVista === "tabla"}
                    />
                  </div>
                </div>
              </motion.div>
            )}
            </AnimatePresence>
          ) : vistaActual === "estadisticas" ? (
            <div className="w-full pt-4">
              <EstadisticasTabs
                afiliados={afiliadosDelLider}
                mostrarOpcionSimular={["ADMIN", "SUPER", "ADMINISTRADOR", "DOCUMENTADOR"].includes(
                  rolUsuarioSesion.toUpperCase(),
                )}
              />
            </div>
          ) : (
            <MensajesEnviados lideres={usuarios} />
          )}
        </div>
      </div>
    </>
  );

  if (embedded) {
    return (
      <div className="w-full flex flex-col bg-white dark:bg-neutral-950 rounded-lg border border-gray-200 dark:border-neutral-800 overflow-hidden min-h-[60vh]">
        {panelBody}
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col flex-1 min-h-0 overflow-hidden">{panelBody}</div>
  );
}
