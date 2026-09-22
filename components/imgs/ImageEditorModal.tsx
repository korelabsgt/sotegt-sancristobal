"use client";

import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogPanel,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import Cropper, { type Area } from "react-easy-crop";
import {
  Check,
  Loader2,
  RotateCcw,
  RotateCw,
  Square,
  ZoomIn,
} from "lucide-react";
import { toast } from "@/lib/toast";

import { getCroppedFile } from "./cropImage";

type AspectKey = "free" | "1:1" | "4:3" | "16:9" | "85:54";

interface AspectOption {
  key: AspectKey;
  label: string;
  value: number | undefined;
}

const ASPECT_OPTIONS: AspectOption[] = [
  { key: "free", label: "Libre", value: undefined },
  { key: "85:54", label: "DPI 85x54", value: 85 / 54 },
  { key: "4:3", label: "4:3", value: 4 / 3 },
  { key: "16:9", label: "16:9", value: 16 / 9 },
  { key: "1:1", label: "1:1", value: 1 },
];

interface Props {
  file: File | null;
  onConfirm: (file: File) => void | Promise<void>;
  onCancel: () => void;
  defaultAspect?: AspectKey;
  lockAspect?: boolean;
  exportMime?: string;
  dpiGuide?: boolean;
}

export default function ImageEditorModal({
  file,
  onConfirm,
  onCancel,
  defaultAspect = "85:54",
  lockAspect = false,
  exportMime,
  dpiGuide = false,
}: Props) {
  const isOpen = !!file;
  const aspectLocked = lockAspect || dpiGuide;
  const aspectDefault = dpiGuide ? "85:54" : defaultAspect;

  const objectUrl = useMemo(
    () => (file ? URL.createObjectURL(file) : null),
    [file],
  );

  useEffect(
    () => () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    },
    [objectUrl],
  );

  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [aspectKey, setAspectKey] = useState<AspectKey>(defaultAspect);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setRotation(0);
      setAspectKey(aspectDefault);
      setCroppedAreaPixels(null);
    }
  }, [isOpen, aspectDefault]);

  const aspect = ASPECT_OPTIONS.find((o) => o.key === aspectKey)?.value;

  const handleCropComplete = useCallback(
    (_: Area, areaPixels: Area) => setCroppedAreaPixels(areaPixels),
    [],
  );

  const rotate = (delta: number) =>
    setRotation((r) => {
      const next = (r + delta) % 360;
      return next < 0 ? next + 360 : next;
    });

  const reset = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
  };

  const handleConfirm = async () => {
    if (!file || !croppedAreaPixels) {
      toast.error("Selecciona el área a recortar.");
      return;
    }
    setIsProcessing(true);
    try {
      const cropped = await getCroppedFile(
        file,
        croppedAreaPixels,
        rotation,
        exportMime,
      );
      await onConfirm(cropped);
    } catch (e: unknown) {
      const message =
        e instanceof Error ? e.message : "No se pudo recortar la imagen.";
      toast.error(message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = () => {
    if (isProcessing) return;
    onCancel();
  };

  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-[80]" onClose={handleCancel}>
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" />
        </TransitionChild>

        <div className="fixed inset-0 flex items-center justify-center p-2 sm:p-4">
          <TransitionChild
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <DialogPanel className="relative w-full max-w-3xl bg-white dark:bg-neutral-900 text-gray-900 dark:text-gray-100 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95dvh] border border-gray-200 dark:border-neutral-800">
              <div className="sticky top-0 z-20 shrink-0 flex items-center justify-between px-4 sm:px-5 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 sm:py-3 border-b border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-950">
                <h3 className="text-sm font-black uppercase text-gray-800 dark:text-gray-100">
                  {dpiGuide ? "Alinear DPI" : "Editar imagen"}
                </h3>
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={isProcessing}
                  className="shrink-0 bg-transparent border-0 p-0 cursor-pointer text-sm font-bold text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 underline underline-offset-2 decoration-red-600/90 hover:decoration-red-700 uppercase tracking-wide disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cerrar
                </button>
              </div>

              <div
                className={`relative h-[50vh] sm:h-[55vh] min-h-[280px] sm:min-h-[320px] ${
                  exportMime === "image/png"
                    ? "bg-[length:16px_16px] bg-[linear-gradient(45deg,#d4d4d4_25%,transparent_25%),linear-gradient(-45deg,#d4d4d4_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#d4d4d4_75%),linear-gradient(-45deg,transparent_75%,#d4d4d4_75%)] bg-[position:0_0,0_8px,8px_-8px,-8px_0] bg-white"
                    : "bg-black"
                }`}
              >
                {objectUrl && (
                  <Cropper
                    image={objectUrl}
                    crop={crop}
                    zoom={zoom}
                    minZoom={0.1}
                    maxZoom={10}
                    rotation={rotation}
                    aspect={aspect}
                    onCropChange={setCrop}
                    onZoomChange={setZoom}
                    onRotationChange={setRotation}
                    onCropComplete={handleCropComplete}
                    restrictPosition={false}
                    showGrid={!dpiGuide}
                    classes={
                      dpiGuide
                        ? { cropAreaClassName: "dpi-cara-guide" }
                        : undefined
                    }
                  />
                )}
                {dpiGuide && (
                  <style>{`
                    .dpi-cara-guide::before {
                      content: "Cara";
                      position: absolute;
                      left: 71%;
                      top: 38%;
                      transform: translateY(-100%);
                      background: #fbbf24;
                      color: #000;
                      font-size: 9px;
                      font-weight: 900;
                      text-transform: uppercase;
                      letter-spacing: 0.04em;
                      padding: 2px 6px;
                      border-radius: 2px 2px 0 0;
                      z-index: 3;
                      line-height: 1.2;
                    }
                    .dpi-cara-guide::after {
                      content: "";
                      position: absolute;
                      left: 71%;
                      top: 38%;
                      width: 25%;
                      aspect-ratio: 3 / 4;
                      border: 2.5px dashed #fbbf24;
                      border-radius: 2px;
                      box-sizing: border-box;
                      pointer-events: none;
                      z-index: 3;
                    }
                  `}</style>
                )}
              </div>

              {dpiGuide && (
                <p className="shrink-0 border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-[11px] font-bold text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/40 dark:text-amber-200 sm:px-5">
                  Recorta el DPI completo. La cara va en el recuadro amarillo (3:4).
                </p>
              )}

              <div className="px-4 sm:px-5 py-3 border-t border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-950 flex flex-col gap-3 shrink-0">
                {!aspectLocked && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-black uppercase text-gray-500 dark:text-neutral-400">
                    Aspecto
                  </span>
                  {ASPECT_OPTIONS.map((opt) => (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => setAspectKey(opt.key)}
                      disabled={isProcessing}
                      className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full border transition shadow-none ${
                        aspectKey === opt.key
                          ? "border-blue-500 dark:border-blue-600 text-blue-700 dark:text-blue-400 bg-blue-50/90 dark:bg-blue-950/45"
                          : "border-gray-300 dark:border-neutral-600 text-gray-600 dark:text-neutral-400 bg-white/70 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-neutral-800"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                )}

                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex items-center gap-2 flex-1">
                    <ZoomIn className="w-4 h-4 text-gray-500 dark:text-neutral-400 shrink-0" />
                    <input
                      type="range"
                      min={0.1}
                      max={10}
                      step={0.05}
                      value={zoom}
                      onChange={(e) => setZoom(Number(e.target.value))}
                      disabled={isProcessing}
                      className="w-full accent-blue-600 dark:accent-blue-500"
                    />
                    <span className="text-[10px] font-bold w-10 text-right text-gray-600 dark:text-neutral-300">
                      {zoom.toFixed(2)}x
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => rotate(-90)}
                      disabled={isProcessing}
                      title="Rotar -90°"
                      className="p-2 rounded-md border border-gray-300 dark:border-neutral-600 bg-white/70 dark:bg-neutral-800 text-gray-700 dark:text-neutral-200 hover:bg-gray-100 dark:hover:bg-neutral-700 disabled:opacity-50 transition-colors"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => rotate(90)}
                      disabled={isProcessing}
                      title="Rotar +90°"
                      className="p-2 rounded-md border border-gray-300 dark:border-neutral-600 bg-white/70 dark:bg-neutral-800 text-gray-700 dark:text-neutral-200 hover:bg-gray-100 dark:hover:bg-neutral-700 disabled:opacity-50 transition-colors"
                    >
                      <RotateCw className="w-4 h-4" />
                    </button>
                    <span className="text-[10px] font-bold w-10 text-center text-gray-600 dark:text-neutral-300">
                      {rotation.toFixed(1)}°
                    </span>
                    <button
                      type="button"
                      onClick={reset}
                      disabled={isProcessing}
                      title="Restablecer"
                      className="p-2 rounded-md border border-gray-300 dark:border-neutral-600 bg-white/70 dark:bg-neutral-800 text-gray-700 dark:text-neutral-200 hover:bg-gray-100 dark:hover:bg-neutral-700 disabled:opacity-50 transition-colors"
                    >
                      <Square className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-stretch gap-2 px-4 sm:px-5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] border-t border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shrink-0">
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={isProcessing}
                  className="flex-1 px-4 py-2.5 rounded-md border border-gray-300 dark:border-neutral-600 text-gray-700 dark:text-neutral-300 text-xs font-bold uppercase bg-white/70 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-neutral-800 transition disabled:opacity-50 shadow-none"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  disabled={isProcessing || !croppedAreaPixels}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-md border border-blue-500 dark:border-blue-600 text-blue-700 dark:text-blue-400 bg-blue-50/90 dark:bg-blue-950/45 text-xs font-bold uppercase hover:bg-blue-100 dark:hover:bg-blue-950/65 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-none"
                >
                  {isProcessing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  {isProcessing ? "Procesando..." : "Aplicar y subir"}
                </button>
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </Dialog>
    </Transition>
  );
}
