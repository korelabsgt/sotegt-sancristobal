"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogPanel } from "@headlessui/react";
import { Download, Printer, X } from "lucide-react";
import { toast } from "@/lib/toast";
import { createClient } from "@/utils/supabase/client";
import { obtenerConfiguracionAction } from "@/components/dashboard/actions/configuracion";
import type { Afiliado } from "./esquemas";
import { formatearDpi } from "./contacto";
import {
  etiquetaEdadNacimiento,
  formatearFechaNacimiento,
} from "./fechaNacimiento";

interface Props {
  afiliado: Afiliado | null;
  open: boolean;
  onClose: () => void;
}

const CARNET_WIDTH_MM = 85.6;
const CARNET_HEIGHT_MM = 53.98;
const CARNET_DISPLAY_PX = 400;
const CARNET_EXPORT_SCALE = 3;
const BUCKET_SETTINGS = "settings";
const BUCKET_DPIS = "dpis";
const DPI_FOTO_LEFT = 0.71;
const DPI_FOTO_TOP = 0.38;
const DPI_FOTO_W = 0.25;
const DPI_FOTO_H = 0.25 * (4 / 3) * (85.6 / 53.98);

function slugNombreArchivo(nombre: string) {
  return (
    nombre
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "afiliado"
  );
}

function etiquetaGenero(sexo: string | null | undefined): string {
  if (sexo === "M") return "Masculino";
  if (sexo === "F") return "Femenino";
  return sexo || "—";
}

async function urlADataUrl(src: string): Promise<string> {
  if (src.startsWith("data:")) return src;
  const res = await fetch(src, { mode: "cors", credentials: "omit", cache: "no-store" });
  if (!res.ok) throw new Error(`No se pudo cargar imagen (${res.status})`);
  const blob = await res.blob();
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error("FileReader"));
    reader.readAsDataURL(blob);
  });
}

const VALOR_PRIMARY = "#1898A1";
const VALOR_DARK = "#0f6369";
const VALOR_MID = "#147880";
const VALOR_LIGHT = "#22a8b0";
const VALOR_ACCENT = "#1a7a82";

function OndaCarnet({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 856 540"
      preserveAspectRatio="none"
      aria-hidden
    >
      <rect width="856" height="540" fill="#ffffff" />
      <path
        d="M0 455 C160 435 260 480 400 458 C520 440 620 425 856 412 L856 540 L0 540 Z"
        fill={VALOR_PRIMARY}
      />
      <path
        d="M0 468 C150 450 250 490 390 472 C520 455 630 442 856 430"
        fill="none"
        stroke={VALOR_DARK}
        strokeWidth="3"
        opacity="0.4"
      />
      <path
        d="M0 480 C140 462 240 498 380 484 C520 470 640 458 856 448"
        fill="none"
        stroke={VALOR_MID}
        strokeWidth="2.5"
        opacity="0.35"
      />
      <path
        d="M0 450 C160 430 260 475 400 453 C520 435 620 420 856 407"
        fill="none"
        stroke={VALOR_LIGHT}
        strokeWidth="4"
        opacity="0.55"
      />
      <path
        d="M400 458 C520 440 620 425 856 412 L856 540 L480 540 C440 520 410 490 400 458 Z"
        fill={VALOR_DARK}
      />
      <path
        d="M460 462 C560 440 680 425 856 418 L856 540 L510 540 C475 515 450 485 460 462 Z"
        fill={VALOR_ACCENT}
        opacity="0.95"
      />
    </svg>
  );
}

export default function CarnetAfiliacion({ afiliado, open, onClose }: Props) {
  const [generando, setGenerando] = useState(false);
  const [partidoSrc, setPartidoSrc] = useState<string | null>(null);
  const [fotoDpiSrc, setFotoDpiSrc] = useState<string | null>(null);
  const [escalaVista, setEscalaVista] = useState(1);
  const carnetRef = useRef<HTMLDivElement>(null);

  const { data: config } = useQuery({
    queryKey: ["config_sistema"],
    queryFn: () => obtenerConfiguracionAction(),
    enabled: open,
    staleTime: 60_000,
  });

  useEffect(() => {
    if (!open) return;
    const actualizar = () => {
      const margen = 8;
      const maxW = Math.max(120, window.innerWidth - margen);
      setEscalaVista(Math.min(1, maxW / CARNET_DISPLAY_PX));
    };
    actualizar();
    window.addEventListener("resize", actualizar);
    return () => window.removeEventListener("resize", actualizar);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    let cancelado = false;
    const supabase = createClient();
    const firmar = async (
      bucket: string,
      path: string | null | undefined,
    ) => {
      if (!path) return null;
      const { data } = await supabase.storage
        .from(bucket)
        .createSignedUrl(path, 60 * 60);
      return data?.signedUrl ?? null;
    };
    void (async () => {
      const [partidoFirmado, fotoFirmada] = await Promise.all([
        firmar(BUCKET_SETTINGS, config?.partido_url),
        firmar(BUCKET_DPIS, afiliado?.dpi_frontal_url),
      ]);
      if (cancelado) return;
      const [partido, foto] = await Promise.all([
        partidoFirmado
          ? urlADataUrl(partidoFirmado).catch(() => partidoFirmado)
          : Promise.resolve(null),
        fotoFirmada
          ? urlADataUrl(fotoFirmada).catch(() => fotoFirmada)
          : Promise.resolve(null),
      ]);
      if (cancelado) return;
      setPartidoSrc(partido);
      setFotoDpiSrc(foto);
    })();
    return () => {
      cancelado = true;
    };
  }, [open, config?.partido_url, afiliado?.dpi_frontal_url]);

  if (!afiliado) return null;

  const nombreCompleto = `${afiliado.nombres} ${afiliado.apellidos}`.trim();
  const palabrasNombre = nombreCompleto.split(/\s+/).filter(Boolean).length;
  const claseNombre =
    palabrasNombre > 4 ? "text-[11px]" : "text-base";
  const altoCarnetPx = CARNET_DISPLAY_PX * (CARNET_HEIGHT_MM / CARNET_WIDTH_MM);
  const dpi = afiliado.dpi || "—";
  const dpiMostrar = dpi === "—" ? "—" : formatearDpi(dpi);
  const padron =
    afiliado.empadronado && afiliado.no_padron
      ? afiliado.no_padron
      : afiliado.no_padron || "—";
  const dpiNorm = dpi.replace(/\D/g, "");
  const padronNorm = padron.replace(/\D/g, "");
  const mismoDpiPadron =
    !!dpiNorm && !!padronNorm && dpiNorm === padronNorm;
  const lugar = afiliado.lugar_nombre || "—";
  const nombreCandidato = (config?.nombre_candidato || "").trim();
  const genero = etiquetaGenero(afiliado.sexo);
  const fechaNac = formatearFechaNacimiento(afiliado.nacimiento);
  const edad = etiquetaEdadNacimiento(afiliado.nacimiento);

  const esperarImagenes = async (raiz: HTMLElement) => {
    const imgs = Array.from(raiz.querySelectorAll("img"));
    await Promise.all(
      imgs.map(
        (img) =>
          new Promise<void>((resolve) => {
            if (img.complete && img.naturalWidth > 0) {
              resolve();
              return;
            }
            const done = () => resolve();
            img.addEventListener("load", done, { once: true });
            img.addEventListener("error", done, { once: true });
          }),
      ),
    );
  };

    const capturarCarnetPng = async () => {
    const nodo = carnetRef.current;
    if (!nodo) throw new Error("No se encontró el carnet");

    await esperarImagenes(nodo);

    const ancho = CARNET_DISPLAY_PX;
    const alto = Math.round(ancho * (CARNET_HEIGHT_MM / CARNET_WIDTH_MM));
    const anchoOut = Math.round(ancho * CARNET_EXPORT_SCALE);
    const altoOut = Math.round(alto * CARNET_EXPORT_SCALE);

    const host = document.createElement("div");
    host.setAttribute("aria-hidden", "true");
    host.style.cssText = [
      "position:fixed",
      "left:-10000px",
      "top:0",
      "z-index:-1",
      "pointer-events:none",
      "background:#ffffff",
      `width:${anchoOut}px`,
      `height:${altoOut}px`,
      "overflow:hidden",
    ].join(";");

    const clone = nodo.cloneNode(true) as HTMLElement;
    clone.style.width = `${ancho}px`;
    clone.style.height = `${alto}px`;
    clone.style.maxWidth = "none";
    clone.style.transform = `scale(${CARNET_EXPORT_SCALE})`;
    clone.style.transformOrigin = "top left";
    clone.style.margin = "0";
    clone.style.position = "relative";
    clone.style.left = "0";
    clone.style.top = "0";
    host.appendChild(clone);
    document.body.appendChild(host);

    try {
      const imgs = Array.from(clone.querySelectorAll("img"));
      await Promise.all(
        imgs.map(async (img) => {
          const src = img.getAttribute("src") || img.src;
          if (!src) return;
          try {
            const dataUrl = await urlADataUrl(src);
            img.setAttribute("src", dataUrl);
            img.removeAttribute("crossorigin");
          } catch {
            /* keep original */
          }
        }),
      );
      await esperarImagenes(clone);
      await new Promise((r) =>
        requestAnimationFrame(() => requestAnimationFrame(() => r(null))),
      );

      const { toPng } = await import("html-to-image");
      return await toPng(clone, {
        cacheBust: false,
        pixelRatio: 1,
        backgroundColor: "#ffffff",
        width: anchoOut,
        height: altoOut,
        style: {
          width: `${ancho}px`,
          height: `${alto}px`,
          transform: `scale(${CARNET_EXPORT_SCALE})`,
          transformOrigin: "top left",
          margin: "0",
        },
      });
    } finally {
      host.remove();
    }
  };

  const dataUrlABlob = (dataUrl: string) => {
    const [meta, data] = dataUrl.split(",");
    const mime = meta.match(/:(.*?);/)?.[1] || "image/png";
    const bin = atob(data);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new Blob([bytes], { type: mime });
  };

  const esMovil = () =>
    /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

  const esIOS = () =>
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

  const abrirImagenParaGuardar = (url: string, filename: string) => {
    const win = window.open("");
    if (win) {
      win.document.write(
        `<!DOCTYPE html><html><head><title>${filename}</title><meta name="viewport" content="width=device-width, initial-scale=1"/></head><body style="margin:0;background:#0a0a0a;display:flex;flex-direction:column;justify-content:center;align-items:center;min-height:100vh;gap:12px;font-family:system-ui,sans-serif"><img src="${url}" alt="Carnet" style="max-width:100%;height:auto;box-shadow:0 8px 32px rgba(0,0,0,.4)"/><p style="color:#fff;font-size:14px;opacity:.85;padding:0 16px;text-align:center">Mantén pulsada la imagen → Guardar en Fotos</p></body></html>`,
      );
      win.document.close();
      toast.info("Mantén pulsada la imagen y elige Guardar");
      return;
    }
    window.location.href = url;
  };

  const descargarImagen = async () => {
    setGenerando(true);
    try {
      const dataUrl = await capturarCarnetPng();
      const filename = `carnet-${slugNombreArchivo(nombreCompleto)}.png`;
      const blob = dataUrlABlob(dataUrl);
      const file = new File([blob], filename, { type: "image/png" });

      if (
        esMovil() &&
        typeof navigator.canShare === "function" &&
        navigator.canShare({ files: [file] })
      ) {
        try {
          await navigator.share({
            files: [file],
            title: "Carnet de Afiliación",
            text: nombreCompleto,
          });
          return;
        } catch (shareErr) {
          const name =
            shareErr && typeof shareErr === "object" && "name" in shareErr
              ? String((shareErr as { name: string }).name)
              : "";
          if (name === "AbortError") return;
        }
      }

      const url = URL.createObjectURL(blob);

      if (esIOS()) {
        abrirImagenParaGuardar(url, filename);
        setTimeout(() => URL.revokeObjectURL(url), 120_000);
        return;
      }

      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.rel = "noopener";
      a.style.display = "none";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast.success("Imagen descargada");
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (error) {
      console.error("Error generando imagen del carnet:", error);
      toast.error("No se pudo generar la imagen. Intenta de nuevo.");
    } finally {
      setGenerando(false);
    }
  };

  const imprimir = async () => {
    setGenerando(true);
    try {
      const dataUrl = await capturarCarnetPng();
      const ventana = window.open("", "_blank", "width=900,height=600");
      if (!ventana) return;

      ventana.document.write(`<!DOCTYPE html>
<html>
<head>
  <title>Carnet de Afiliación</title>
  <style>
    @page {
      size: 216mm 330mm;
      margin: 12mm;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body {
      background: #fff;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    body {
      padding: 12mm;
      display: flex;
      align-items: flex-start;
      justify-content: flex-start;
    }
    img.carnet {
      width: ${CARNET_WIDTH_MM}mm;
      height: ${CARNET_HEIGHT_MM}mm;
      display: block;
    }
    @media print {
      body { padding: 0; }
      img.carnet {
        width: ${CARNET_WIDTH_MM}mm !important;
        height: ${CARNET_HEIGHT_MM}mm !important;
      }
    }
  </style>
</head>
<body>
  <img class="carnet" src="${dataUrl}" alt="Carnet de Afiliación" />
  <script>
    const img = document.querySelector('img');
    img.onload = function() { window.focus(); window.print(); };
    if (img.complete) { window.focus(); window.print(); }
  </script>
</body>
</html>`);
      ventana.document.close();
    } catch (error) {
      console.error("Error imprimiendo carnet:", error);
    } finally {
      setGenerando(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} className="relative z-[60]">
      <div className="fixed inset-0 bg-black/80" aria-hidden="true" />
      <div className="fixed inset-0 flex items-stretch justify-stretch p-0">
        <DialogPanel className="flex h-full w-full max-w-none flex-col overflow-hidden rounded-none border-0 bg-white shadow-none dark:bg-neutral-900">
          <div className="flex shrink-0 items-center justify-between border-b px-4 py-3 dark:border-neutral-800">
            <h3 className="text-sm font-bold uppercase text-gray-900 dark:text-gray-100">
              Carnet de Afiliación
            </h3>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-9 w-9 rounded-full"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4 bg-neutral-100 p-0 dark:bg-neutral-950">
            <div
              className="relative shrink-0"
              style={{
                width: CARNET_DISPLAY_PX * escalaVista,
                height: altoCarnetPx * escalaVista,
              }}
            >
              <div
                ref={carnetRef}
                className="absolute left-0 top-0 overflow-hidden rounded-none border-[1.5px] border-[#1898A1] bg-white"
                style={{
                  width: CARNET_DISPLAY_PX,
                  height: altoCarnetPx,
                  fontFamily: "Arial, Helvetica, sans-serif",
                  transform: `scale(${escalaVista})`,
                  transformOrigin: "top left",
                }}
              >
                <OndaCarnet className="absolute inset-0 h-full w-full" />

                <div className="relative z-10 h-[72%] px-3.5 pt-2">
                  {partidoSrc && (
                    <img
                      data-carnet-logo
                      src={partidoSrc}
                      alt="Valor"
                      className="pointer-events-none absolute right-4 top-0.5 z-20 h-[5.75rem] w-[6.25rem] object-contain object-bottom"
                      draggable={false}
                    />
                  )}
                  {fotoDpiSrc && (
                    <div className="pointer-events-none absolute right-5 top-[6.35rem] z-20 aspect-[3/4] w-[5.25rem] overflow-hidden rounded-md border-[1.5px] border-[#1898A1]">
                      <img
                        data-carnet-foto
                        src={fotoDpiSrc}
                        alt=""
                        className="absolute max-w-none"
                        draggable={false}
                        style={{
                          left: `${(-DPI_FOTO_LEFT / DPI_FOTO_W) * 100}%`,
                          top: `${(-DPI_FOTO_TOP / DPI_FOTO_H) * 100}%`,
                          width: `${(1 / DPI_FOTO_W) * 100}%`,
                          height: `${(1 / DPI_FOTO_H) * 100}%`,
                        }}
                      />
                    </div>
                  )}

                  <p
                    className={`relative z-10 w-full whitespace-nowrap font-black uppercase leading-none tracking-tight text-[#565659] ${
                      partidoSrc || fotoDpiSrc ? "pr-32" : ""
                    } ${claseNombre}`}
                  >
                    {nombreCompleto}
                  </p>

                  <div
                    className={`mt-2.5 ${partidoSrc || fotoDpiSrc ? "pr-32" : ""}`}
                  >
                    <div className="border-b border-slate-200 pb-1.5">
                      <p className="text-[8px] font-bold uppercase tracking-wider text-slate-400">
                        {mismoDpiPadron ? "DPI y Padrón" : "DPI"}
                      </p>
                      <p className="mt-0.5 font-mono text-sm font-bold leading-none text-[#565659]">
                        {dpiMostrar}
                      </p>
                      {!mismoDpiPadron && (
                        <p className="mt-1 truncate font-mono text-[10px] font-bold leading-none tracking-tight text-[#565659]">
                          <span className="mr-1.5 text-[7px] font-bold uppercase tracking-wider text-slate-400">
                            Padrón
                          </span>
                          {padron}
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-x-3 border-b border-slate-200 py-2">
                      <div>
                        <p className="text-[8px] font-bold uppercase tracking-wider text-slate-400">
                          Género
                        </p>
                        <p className="mt-0.5 text-sm font-bold text-[#565659]">
                          {genero}
                        </p>
                      </div>
                      <div>
                        <p className="text-[8px] font-bold uppercase tracking-wider text-slate-400">
                          Nacimiento
                        </p>
                        <p className="mt-0.5 text-sm font-bold text-[#565659]">
                          {fechaNac}
                        </p>
                      </div>
                      <div>
                        <p className="text-[8px] font-bold uppercase tracking-wider text-slate-400">
                          Edad
                        </p>
                        <p className="mt-0.5 text-sm font-bold text-[#565659]">
                          {edad}
                        </p>
                      </div>
                    </div>

                    <div className="pt-2">
                      <p className="text-[8px] font-bold uppercase tracking-wider text-slate-400">
                        Lugar
                      </p>
                      <p className="mt-0.5 text-sm font-bold text-[#565659]">
                        {lugar}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="absolute bottom-1 left-3 right-3 z-20 flex items-end justify-between gap-2">
                  {nombreCandidato && (
                    <div className="min-w-0 leading-none">
                      <p className="truncate text-[11px] font-black uppercase leading-none tracking-tight text-white">
                        {nombreCandidato}
                      </p>
                      <p className="mt-px truncate text-[8px] font-bold uppercase leading-none tracking-wider text-[#c5d0d2]">
                        Coordinador Municipal
                      </p>
                    </div>
                  )}
                  <p className="mb-0.5 ml-auto shrink-0 whitespace-nowrap text-[11px] font-black uppercase leading-none tracking-wide text-white">
                    Carnet de afiliación
                  </p>
                </div>
              </div>
            </div>

            <div className="flex w-full max-w-[400px] flex-row justify-center gap-2 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
              <Button
                type="button"
                variant="outline"
                onClick={imprimir}
                disabled={generando}
                className="hidden border-blue-300 bg-white text-blue-800 hover:bg-blue-50 dark:border-blue-300 dark:bg-white dark:text-blue-800 dark:hover:bg-blue-50 sm:inline-flex"
              >
                <Printer className="mr-2 h-4 w-4" />
                {generando ? "Preparando..." : "Imprimir"}
              </Button>
              <Button
                type="button"
                onClick={descargarImagen}
                disabled={generando}
                className="bg-blue-700 hover:bg-blue-800"
              >
                <Download className="mr-2 h-4 w-4" />
                {generando ? "Generando..." : "Descargar imagen"}
              </Button>
            </div>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
