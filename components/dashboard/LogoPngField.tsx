"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Trash2, Upload } from "lucide-react";
import { toast } from "@/lib/toast";
import { createClient } from "@/utils/supabase/client";
import ImageEditorModal from "@/components/imgs/ImageEditorModal";
import { actualizarImagenConfigAction } from "./actions/configuracion";

const BUCKET = "settings";
const MAX_BYTES = 200 * 1024;

interface Props {
  campo: "logo_url" | "partido_url";
  titulo: string;
  path: string | null;
  onChange: (path: string | null) => void;
}

function cargarImagen(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("No se pudo leer el PNG."));
    img.src = src;
  });
}

function renderPng(img: HTMLImageElement, lado: number): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = lado;
  canvas.height = lado;
  const ctx = canvas.getContext("2d", { alpha: true });
  if (!ctx) return Promise.reject(new Error("No se pudo crear el canvas."));
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.clearRect(0, 0, lado, lado);
  ctx.drawImage(img, 0, 0, lado, lado);
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) =>
        blob ? resolve(blob) : reject(new Error("No se pudo exportar el PNG.")),
      "image/png",
    );
  });
}

async function pngMaximoBajoLimite(file: File): Promise<File> {
  const url = URL.createObjectURL(file);
  try {
    const img = await cargarImagen(url);
    const maximo = Math.min(img.width, img.height, 2048);
    let menor = 32;
    let mayor = maximo;
    let elegido: Blob | null = null;
    while (menor <= mayor) {
      const lado = Math.floor((menor + mayor) / 2);
      const blob = await renderPng(img, lado);
      if (blob.size <= MAX_BYTES) {
        elegido = blob;
        menor = lado + 1;
      } else {
        mayor = lado - 1;
      }
    }
    if (!elegido) {
      throw new Error("El PNG no cabe en 200 KB ni en el tamaño mínimo.");
    }
    return new File([elegido], `${Date.now()}.png`, { type: "image/png" });
  } finally {
    URL.revokeObjectURL(url);
  }
}

export default function LogoPngField({ campo, titulo, path, onChange }: Props) {
  const supabase = useMemo(() => createClient(), []);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [editingFile, setEditingFile] = useState<File | null>(null);
  const [procesando, setProcesando] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;
    const cargar = async () => {
      if (!path) {
        setPreviewUrl(null);
        return;
      }
      const { data, error } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(path, 60 * 60);
      if (cancelado) return;
      setPreviewUrl(error ? null : data.signedUrl);
    };
    void cargar();
    return () => {
      cancelado = true;
    };
  }, [path, supabase]);

  const subir = async (recortado: File) => {
    setProcesando(true);
    let subido: string | null = null;
    try {
      const png = await pngMaximoBajoLimite(recortado);
      const nuevo = `${campo}/${png.name}`;
      const { error } = await supabase.storage.from(BUCKET).upload(nuevo, png, {
        cacheControl: "3600",
        upsert: false,
        contentType: "image/png",
      });
      if (error) throw error;
      subido = nuevo;
      if (path) {
        await supabase.storage.from(BUCKET).remove([path]);
      }
      const result = await actualizarImagenConfigAction(campo, nuevo);
      onChange(result?.[campo] ?? nuevo);
      setEditingFile(null);
      toast.success(`${titulo} guardado`);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "No se pudo subir el PNG.";
      toast.error(message);
      if (subido) await supabase.storage.from(BUCKET).remove([subido]);
    } finally {
      setProcesando(false);
    }
  };

  const eliminar = async () => {
    if (!path || procesando) return;
    setProcesando(true);
    try {
      await supabase.storage.from(BUCKET).remove([path]);
      await actualizarImagenConfigAction(campo, null);
      onChange(null);
      toast.success(`${titulo} eliminado`);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "No se pudo eliminar.";
      toast.error(message);
    } finally {
      setProcesando(false);
    }
  };

  return (
    <div className="flex flex-col gap-2 rounded-xl border-2 border-violet-200 bg-white p-4 dark:border-violet-700 dark:bg-neutral-900">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-xs font-black uppercase text-violet-800 dark:text-violet-300">
            {titulo}
          </p>
          <p className="text-[10px] font-semibold text-violet-500 dark:text-violet-400">
            PNG 1:1, transparencia, máx. 200 KB
          </p>
        </div>
        {path ? (
          <button
            type="button"
            onClick={() => void eliminar()}
            disabled={procesando}
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-black uppercase text-red-600 hover:bg-red-50 disabled:opacity-40 dark:text-red-400 dark:hover:bg-red-950/40"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Quitar
          </button>
        ) : null}
      </div>
      <button
        type="button"
        disabled={procesando}
        onClick={() => inputRef.current?.click()}
        className="relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-violet-300 bg-[length:14px_14px] bg-[linear-gradient(45deg,#e5e7eb_25%,transparent_25%),linear-gradient(-45deg,#e5e7eb_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#e5e7eb_75%),linear-gradient(-45deg,transparent_75%,#e5e7eb_75%)] bg-[position:0_0,0_7px,7px_-7px,-7px_0] bg-white dark:border-violet-600"
      >
        {procesando ? (
          <Loader2 className="h-6 w-6 animate-spin text-violet-600" />
        ) : previewUrl ? (
          <img
            src={previewUrl}
            alt={titulo}
            className="h-full w-full object-contain"
          />
        ) : (
          <span className="flex flex-col items-center gap-1 text-[10px] font-black uppercase text-violet-600">
            <Upload className="h-5 w-5" />
            Subir PNG
          </span>
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/png"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (!file) return;
          if (file.type !== "image/png") {
            toast.error("Solo se acepta PNG para conservar la transparencia.");
            return;
          }
          setEditingFile(file);
        }}
      />
      <ImageEditorModal
        file={editingFile}
        defaultAspect="1:1"
        lockAspect
        exportMime="image/png"
        onConfirm={subir}
        onCancel={() => setEditingFile(null)}
      />
    </div>
  );
}
