"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Building2,
  ChevronsRight,
  ChevronLeft,
  ChevronRight,
  Download,
  Medal,
  Users,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import * as XLSX from "xlsx";
import type { Afiliado, Lider } from "./esquemas";
import { esRolEmpleado, esUsuarioSede } from "./esquemas";
import { formatearDpi, TelefonoInline } from "./contacto";
import { etiquetaEdadNacimiento } from "./fechaNacimiento";
import { Button } from "@/components/ui/button";
import PanelListaPestana from "./PanelListaPestana";
import { TEMA_MIEMBROS, type TemaLista } from "./temaPestana";

interface Props {
  afiliados: Afiliado[];
  lideres: Lider[];
  onEditar: (afiliado: Afiliado) => void;
  onDataChange: () => void;
  searchTerm: string;
  onSearchChange?: (value: string) => void;
  isLoading?: boolean;
  tema?: TemaLista;
}

type GrupoTipo = "todos" | "sede" | "lider";

type GrupoAfiliados = {
  lider: Lider;
  afiliados: Afiliado[];
  tipo: Exclude<GrupoTipo, "todos">;
};

const CATEGORIAS: Array<{
  tipo: GrupoTipo;
  titulo: string;
  icon: typeof Building2;
  active: string;
  idle: string;
  rowActive: string;
}> = [
  {
    tipo: "todos",
    titulo: "Todos",
    icon: Users,
    active:
      "bg-sky-600 text-white border-sky-600 shadow-md shadow-sky-200/50 dark:shadow-none",
    idle: "bg-white dark:bg-neutral-900 text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-800 hover:bg-sky-50 dark:hover:bg-sky-950/40",
    rowActive: "bg-sky-50 dark:bg-sky-950/40",
  },
  {
    tipo: "sede",
    titulo: "Sede",
    icon: Building2,
    active:
      "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-200/50 dark:shadow-none",
    idle: "bg-white dark:bg-neutral-900 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-950/40",
    rowActive: "bg-blue-50 dark:bg-blue-950/40",
  },
  {
    tipo: "lider",
    titulo: "Enlaces",
    icon: Medal,
    active:
      "bg-orange-500 text-white border-orange-500 shadow-md shadow-orange-200/50 dark:shadow-none",
    idle: "bg-white dark:bg-neutral-900 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800 hover:bg-orange-50 dark:hover:bg-orange-950/40",
    rowActive: "bg-orange-50 dark:bg-orange-950/30",
  },
];

function tipoDeLider(lider: Lider): Exclude<GrupoTipo, "todos"> {
  if (esUsuarioSede(lider)) return "sede";
  return "lider";
}

function etiquetaGrupo(tipo: Exclude<GrupoTipo, "todos">) {
  if (tipo === "sede") return "Sede";
  return "Líder de enlace";
}

function normalizarNombre(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function compararNombres(a: string, b: string) {
  return normalizarNombre(a).localeCompare(normalizarNombre(b), "es");
}

function calcularEdad(fechaNacimiento: string) {
  return etiquetaEdadNacimiento(fechaNacimiento);
}

function filaExcel(
  afiliado: Afiliado,
  liderNombre: string,
  grupo: string,
) {
  return {
    Nombre: `${afiliado.nombres} ${afiliado.apellidos}`.trim(),
    DPI: afiliado.dpi || "",
    Teléfono: afiliado.telefono || "",
    Edad: calcularEdad(afiliado.nacimiento),
    Sexo: afiliado.sexo || "",
    Ubicación: afiliado.lugar_nombre || "",
    Empadronado: afiliado.empadronado ? "Sí" : "No",
    "No. Padrón": afiliado.no_padron || "",
    "Líder de enlace": liderNombre,
    Grupo: grupo,
  };
}

function AfiliadosSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="flex gap-2">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-12 w-36 bg-gray-100 dark:bg-neutral-800 rounded-xl"
          />
        ))}
      </div>
      <div className="h-64 bg-gray-100 dark:bg-neutral-800 rounded-xl" />
    </div>
  );
}

export default function AfiliadosGeneral({
  afiliados,
  lideres,
  searchTerm,
  onSearchChange,
  isLoading = false,
  tema = TEMA_MIEMBROS,
}: Props) {
  const [categoria, setCategoria] = useState<GrupoTipo>("todos");
  const [liderSeleccionadoId, setLiderSeleccionadoId] = useState<string | null>(
    null,
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState<number | "all">(50);

  const grupos = useMemo(() => {
    const term = searchTerm.toLowerCase();
    const grouped = new Map<string, Afiliado[]>();

    afiliados.forEach((afiliado) => {
      if (!afiliado.lider_id) return;
      const fullName =
        `${afiliado.nombres} ${afiliado.apellidos}`.toLowerCase();
      const dpi = afiliado.dpi || "";
      if (searchTerm && !fullName.includes(term) && !dpi.includes(term)) {
        return;
      }
      if (!grouped.has(afiliado.lider_id)) {
        grouped.set(afiliado.lider_id, []);
      }
      grouped.get(afiliado.lider_id)?.push(afiliado);
    });

    const result: GrupoAfiliados[] = [];

    lideres.forEach((lider) => {
      const tipo = tipoDeLider(lider);
      const rol = (lider.rol || "").toUpperCase();

      if (esRolEmpleado(rol)) return;

      if (tipo === "sede") {
        result.push({
          lider,
          afiliados: grouped.get(lider.id) || [],
          tipo: "sede",
        });
        return;
      }
      if (rol === "LIDER") {
        result.push({
          lider,
          afiliados: grouped.get(lider.id) || [],
          tipo: "lider",
        });
      }
    });

    return result.sort((a, b) =>
      compararNombres(
        `${a.lider.nombres} ${a.lider.apellidos}`,
        `${b.lider.nombres} ${b.lider.apellidos}`,
      ),
    );
  }, [afiliados, lideres, searchTerm]);

  const conteosCategoria = useMemo(() => {
    const map: Record<GrupoTipo, number> = {
      todos: 0,
      sede: 0,
      lider: 0,
    };
    grupos.forEach((g) => {
      map[g.tipo] += g.afiliados.length;
      map.todos += g.afiliados.length;
    });
    return map;
  }, [grupos]);

  const gruposDeCategoria = useMemo(() => {
    if (categoria === "todos") return [];
    return grupos.filter((g) => g.tipo === categoria);
  }, [grupos, categoria]);

  const miembrosTodos = useMemo(() => {
    const rows: Array<{
      afiliado: Afiliado;
      liderNombre: string;
      grupo: string;
    }> = [];

    grupos.forEach((g) => {
      const liderNombre = `${g.lider.nombres} ${g.lider.apellidos}`.trim();
      const grupo = etiquetaGrupo(g.tipo);
      g.afiliados.forEach((a) => {
        rows.push({ afiliado: a, liderNombre, grupo });
      });
    });

    return rows.sort((a, b) =>
      compararNombres(
        `${a.afiliado.nombres} ${a.afiliado.apellidos}`,
        `${b.afiliado.nombres} ${b.afiliado.apellidos}`,
      ),
    );
  }, [grupos]);

  useEffect(() => {
    setLiderSeleccionadoId(null);
  }, [categoria, searchTerm]);

  useEffect(() => {
    setCurrentPage(1);
  }, [categoria, searchTerm, itemsPerPage, liderSeleccionadoId]);

  const grupoActivo = useMemo(
    () =>
      gruposDeCategoria.find((g) => g.lider.id === liderSeleccionadoId) || null,
    [gruposDeCategoria, liderSeleccionadoId],
  );

  const listaPaginable = useMemo(() => {
    if (categoria === "todos") return miembrosTodos;
    if (grupoActivo) {
      return [...grupoActivo.afiliados].sort((a, b) =>
        compararNombres(
          `${a.nombres} ${a.apellidos}`,
          `${b.nombres} ${b.apellidos}`,
        ),
      );
    }
    return gruposDeCategoria;
  }, [categoria, miembrosTodos, grupoActivo, gruposDeCategoria]);

  const effectiveItemsPerPage =
    itemsPerPage === "all"
      ? Math.max(listaPaginable.length, 1)
      : itemsPerPage;
  const totalPages = Math.max(
    1,
    Math.ceil(listaPaginable.length / effectiveItemsPerPage),
  );
  const startIndex = (currentPage - 1) * effectiveItemsPerPage;

  const miembrosTodosPaginados = useMemo(() => {
    if (itemsPerPage === "all") return miembrosTodos;
    return miembrosTodos.slice(startIndex, startIndex + effectiveItemsPerPage);
  }, [miembrosTodos, itemsPerPage, startIndex, effectiveItemsPerPage]);

  const gruposPaginados = useMemo(() => {
    if (itemsPerPage === "all") return gruposDeCategoria;
    return gruposDeCategoria.slice(
      startIndex,
      startIndex + effectiveItemsPerPage,
    );
  }, [gruposDeCategoria, itemsPerPage, startIndex, effectiveItemsPerPage]);

  const afiliadosGrupoPaginados = useMemo(() => {
    if (!grupoActivo) return [] as Afiliado[];
    const ordenados = [...grupoActivo.afiliados].sort((a, b) =>
      compararNombres(
        `${a.nombres} ${a.apellidos}`,
        `${b.nombres} ${b.apellidos}`,
      ),
    );
    if (itemsPerPage === "all") return ordenados;
    return ordenados.slice(startIndex, startIndex + effectiveItemsPerPage);
  }, [grupoActivo, itemsPerPage, startIndex, effectiveItemsPerPage]);

  const categoriaCfg =
    CATEGORIAS.find((c) => c.tipo === categoria) || CATEGORIAS[0];

  const paginacionFooter =
    listaPaginable.length > 0 ? (
          <div className="flex flex-row items-center justify-center gap-3 w-full">
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
              {currentPage}/{totalPages}
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
                setItemsPerPage(val === "all" ? "all" : parseInt(val, 10));
              }}
              className="ml-1 h-8 rounded border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 px-2 text-sm text-gray-800 dark:text-gray-100 cursor-pointer"
            >
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={200}>200</option>
              <option value="all">Todos</option>
            </select>
          </div>
        ) : undefined;
  const descargarExcel = () => {
    const porTipo = {
      sede: [] as ReturnType<typeof filaExcel>[],
      lider: [] as ReturnType<typeof filaExcel>[],
    };

    grupos.forEach((g) => {
      const liderNombre = `${g.lider.nombres} ${g.lider.apellidos}`.trim();
      const grupo = etiquetaGrupo(g.tipo);
      const ordenados = [...g.afiliados].sort((a, b) =>
        compararNombres(
          `${a.nombres} ${a.apellidos}`,
          `${b.nombres} ${b.apellidos}`,
        ),
      );
      ordenados.forEach((a) => {
        porTipo[g.tipo].push(filaExcel(a, liderNombre, grupo));
      });
    });

    const todos = [...porTipo.sede, ...porTipo.lider].sort(
      (a, b) => compararNombres(a.Nombre, b.Nombre),
    );

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(todos),
      "Todos",
    );
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(porTipo.sede),
      "Sede",
    );
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(porTipo.lider),
      "Enlaces",
    );

    const fecha = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `miembros_${fecha}.xlsx`);
  };

  if (isLoading) return <AfiliadosSkeleton />;

  const theadClass = `${tema.theadBg} ${tema.theadText}`;

  const toolbarAcciones = (
    <div className="flex w-full items-center gap-2 flex-wrap">
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
        {CATEGORIAS.map((cat) => {
          const Icon = cat.icon;
          const activo = categoria === cat.tipo;
          const total = conteosCategoria[cat.tipo];
          return (
            <button
              key={cat.tipo}
              type="button"
              onClick={() => {
                setCategoria(cat.tipo);
                setLiderSeleccionadoId(null);
              }}
              className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-semibold transition-colors duration-300 sm:gap-2 sm:px-3 sm:text-sm border ${
                activo ? cat.active : cat.idle
              }`}
            >
              <Icon className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
              <span>{cat.titulo}</span>
              <span className="font-bold">{total}</span>
            </button>
          );
        })}
      </div>
      <Button
        type="button"
        variant="outline"
        onClick={descargarExcel}
        className="ml-auto gap-1.5 shrink-0 font-bold border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-950/40"
      >
        <Download className="h-4 w-4" />
        Excel
      </Button>
    </div>
  );

  const sinMiembros =
    grupos.every((g) => g.afiliados.length === 0) && afiliados.length === 0;

  return (
    <PanelListaPestana
      tema={tema}
      placeholder="Buscar por nombre o DPI..."
      value={searchTerm}
      onChange={onSearchChange ?? (() => {})}
      acciones={toolbarAcciones}
      contenidoSinPadding
      footer={sinMiembros ? undefined : paginacionFooter}
    >
      {sinMiembros ? (
        <div className="px-4 py-16 text-center text-sm text-gray-500 dark:text-gray-400">
          No se encontraron miembros.
        </div>
      ) : (
      <AnimatePresence mode="wait" initial={false}>
        {categoria === "todos" ? (
          <motion.div
            key="lista-todos"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.28, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="overflow-x-auto"
          >
            {miembrosTodos.length === 0 ? (
              <div className="px-4 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                No hay miembros{searchTerm ? " para esta búsqueda" : ""}.
              </div>
            ) : (
              <table className="min-w-full text-xs bg-white dark:bg-neutral-900">
                <thead className={`${theadClass} border-b border-black/5 dark:border-white/10`}>
                  <tr>
                    <th className={`px-4 py-2.5 text-left font-bold uppercase ${tema.theadText}`}>
                      No.
                    </th>
                    <th className={`px-4 py-2.5 text-left font-bold uppercase ${tema.theadText}`}>
                      Nombre
                    </th>
                    <th className={`px-4 py-2.5 text-left font-bold uppercase ${tema.theadText}`}>
                      DPI
                    </th>
                    <th className={`px-4 py-2.5 text-left font-bold uppercase ${tema.theadText}`}>
                      Teléfono
                    </th>
                    <th className={`px-4 py-2.5 text-left font-bold uppercase ${tema.theadText}`}>
                      Edad
                    </th>
                    <th className={`px-4 py-2.5 text-left font-bold uppercase ${tema.theadText}`}>
                      Ubicación
                    </th>
                    <th className={`px-4 py-2.5 text-left font-bold uppercase ${tema.theadText}`}>
                      Líder de enlace
                    </th>
                    <th className={`px-4 py-2.5 text-left font-bold uppercase ${tema.theadText}`}>
                      Grupo
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-neutral-700">
                  {miembrosTodosPaginados.map((row, index) => (
                    <tr
                      key={row.afiliado.id}
                      className={`${tema.filaHover} uppercase`}
                    >
                      <td className="px-4 py-2 whitespace-nowrap text-gray-500 dark:text-gray-400">
                        {startIndex + index + 1}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap font-bold text-gray-900 dark:text-gray-100">
                        {row.afiliado.nombres} {row.afiliado.apellidos}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap font-mono">
                        {row.afiliado.dpi
                          ? formatearDpi(row.afiliado.dpi)
                          : "—"}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap font-mono normal-case">
                        <TelefonoInline
                          telefono={row.afiliado.telefono || ""}
                          pillClassName={tema.telefonoPill}
                        />
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap font-bold">
                        {calcularEdad(row.afiliado.nacimiento)}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        {row.afiliado.lugar_nombre || "—"}
                      </td>
                      <td className={`px-4 py-2 whitespace-nowrap font-semibold ${tema.btnText}`}>
                        {row.liderNombre}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        {row.grupo}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </motion.div>
        ) : gruposDeCategoria.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="rounded-xl border border-dashed border-gray-200 dark:border-neutral-700 px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400 m-3"
          >
            No hay {categoriaCfg.titulo.toLowerCase()}
            {searchTerm ? " para esta búsqueda" : ""}.
          </motion.div>
        ) : !grupoActivo ? (
          <motion.div
            key={`lista-${categoria}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.28, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="flex flex-col gap-3 p-3"
          >
            {gruposPaginados.map(({ lider, afiliados: list }, index) => (
              <div
                key={lider.id}
                className={`group flex items-center gap-3 rounded-xl overflow-hidden border-l-4 border-r-4 border-l-gray-200 border-r-gray-200 dark:border-l-neutral-700 dark:border-r-neutral-700 bg-white dark:bg-neutral-900 px-4 py-3 transition-all duration-300 ease-in-out ${tema.hoverBordeLateral}`}
              >
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-lg text-xs font-black shrink-0 border ${tema.theadBg} ${tema.btnText} ${tema.cardBorder}`}
                >
                  {startIndex + index + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-black text-sm uppercase truncate text-gray-900 dark:text-gray-100">
                    {lider.nombres} {lider.apellidos}
                  </h3>
                  <p className="text-xs font-bold text-gray-500 dark:text-gray-400">
                    {list.length} miembro{list.length === 1 ? "" : "s"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setLiderSeleccionadoId(lider.id)}
                  className={`inline-flex h-9 items-center justify-center gap-1 rounded-lg border border-gray-200 bg-gray-100 px-3 text-xs font-bold uppercase whitespace-nowrap shrink-0 text-gray-500 transition-all duration-300 ease-in-out dark:border-neutral-700 dark:bg-neutral-800 dark:text-gray-400 ${tema.hoverEntrar}`}
                >
                  Entrar
                  <ChevronsRight className="h-4 w-4 shrink-0" />
                </button>
              </div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            key={`celula-${grupoActivo.lider.id}`}
            initial={{ opacity: 0, y: 16, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.99 }}
            transition={{ duration: 0.32, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="space-y-3 p-3"
          >
            <button
              type="button"
              onClick={() => setLiderSeleccionadoId(null)}
              className={`inline-flex items-center gap-2 text-sm font-bold hover:underline ${tema.btnText}`}
            >
              <ArrowLeft className="h-4 w-4" />
              Volver a {categoriaCfg.titulo}
            </button>

            <div className={`overflow-hidden rounded-xl border bg-white dark:bg-neutral-900 shadow-sm ${tema.cardBorder}`}>
              <div
                className={`flex items-center justify-between gap-3 px-4 py-3 border-b dark:border-neutral-800 ${tema.theadBg}`}
              >
                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Célula de
                  </p>
                  <h3 className="text-sm md:text-base font-black uppercase truncate text-gray-900 dark:text-gray-100">
                    {grupoActivo.lider.nombres} {grupoActivo.lider.apellidos}
                  </h3>
                </div>
                <span className="shrink-0 text-sm font-black text-gray-800 dark:text-gray-200">
                  {grupoActivo.afiliados.length} miembro
                  {grupoActivo.afiliados.length === 1 ? "" : "s"}
                </span>
              </div>

              {grupoActivo.afiliados.length === 0 ? (
                <div className="px-4 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                  Este líder aún no tiene miembros
                  {searchTerm ? " que coincidan con la búsqueda" : ""}.
                </div>
              ) : (
                <table className="min-w-full text-xs">
                  <thead className={`${theadClass} border-b border-black/5 dark:border-white/10`}>
                    <tr>
                      <th className={`px-4 py-2.5 text-left font-bold uppercase ${tema.theadText}`}>
                        No.
                      </th>
                      <th className={`px-4 py-2.5 text-left font-bold uppercase ${tema.theadText}`}>
                        Nombre
                      </th>
                      <th className={`px-4 py-2.5 text-left font-bold uppercase ${tema.theadText}`}>
                        DPI
                      </th>
                      <th className={`px-4 py-2.5 text-left font-bold uppercase ${tema.theadText}`}>
                        Teléfono
                      </th>
                      <th className={`px-4 py-2.5 text-left font-bold uppercase ${tema.theadText}`}>
                        Edad
                      </th>
                      <th className={`px-4 py-2.5 text-left font-bold uppercase ${tema.theadText}`}>
                        Ubicación
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-neutral-700">
                    {afiliadosGrupoPaginados.map((afiliado, index) => (
                        <motion.tr
                          key={afiliado.id}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{
                            duration: 0.22,
                            delay: Math.min(index * 0.02, 0.24),
                            ease: [0.25, 0.46, 0.45, 0.94],
                          }}
                          className={`${tema.filaHover} uppercase`}
                        >
                          <td className="px-4 py-2 whitespace-nowrap text-gray-500 dark:text-gray-400">
                            {startIndex + index + 1}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap font-bold text-gray-900 dark:text-gray-100">
                            {afiliado.nombres} {afiliado.apellidos}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap font-mono">
                            {afiliado.dpi ? formatearDpi(afiliado.dpi) : "—"}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap font-mono normal-case">
                            <TelefonoInline
                              telefono={afiliado.telefono || ""}
                              pillClassName={tema.telefonoPill}
                            />
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap font-bold">
                            {calcularEdad(afiliado.nacimiento)}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap">
                            {afiliado.lugar_nombre || "—"}
                          </td>
                        </motion.tr>
                      ))}
                  </tbody>
                </table>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      )}
    </PanelListaPestana>
  );
}
