"use client";

import { Bell, BellRing, Loader2 } from "lucide-react";
import { toast } from "@/lib/toast";
import { Button } from "./ui/button";
import usePushNotifications from "@/hooks/usePushNotifications";
import { cn } from "@/lib/utils";
import { mensajeAyudaNotificacionesHtml } from "@/lib/pushAyuda";
import Swal from "sweetalert2";
import { swalThemeOptions } from "@/lib/swalTheme";

type Props = {
  className?: string;
};

function mostrarAyudaInstalacion() {
  const isDark =
    typeof document !== "undefined" &&
    document.documentElement.classList.contains("dark");

  void Swal.fire({
    ...swalThemeOptions({
      confirmButtonClass: isDark
        ? "swal-btn-outline-blue"
        : "swal-btn-outline-blue-light",
    }),
    title: "Instala la app para notificaciones",
    html: mensajeAyudaNotificacionesHtml(),
    icon: "info",
    confirmButtonText: "Entendido",
  });
}

export default function NotificationBell({ className }: Props) {
  const { soportado, activo, cargando, procesando, toggle } =
    usePushNotifications();

  const handleClick = async () => {
    if (!soportado && !activo && !cargando && !procesando) {
      mostrarAyudaInstalacion();
      return;
    }

    const prevActivo = activo;
    const res = await toggle();
    if (!res) return;

    if (res.ok) {
      toast.success(
        prevActivo
          ? "Notificaciones desactivadas en este dispositivo"
          : "Notificaciones activadas en este dispositivo",
      );
    } else if ("motivo" in res && res.motivo === "permiso-denegado") {
      toast.warning(
        "Permiso de notificaciones denegado. Actívalo en los ajustes del navegador.",
      );
    } else if (
      "motivo" in res &&
      (res.motivo === "no-soportado" || res.motivo === "instalar-app")
    ) {
      mostrarAyudaInstalacion();
    }
  };

  return (
    <Button
      type="button"
      variant="ghost"
      onClick={handleClick}
      disabled={cargando || procesando}
      title={
        cargando
          ? "Cargando notificaciones…"
          : !soportado && !activo
            ? "Instalar app para notificaciones"
            : activo
              ? "Notificaciones activadas · click para desactivar"
              : "Activar notificaciones en este dispositivo"
      }
      aria-label="Notificaciones"
      className={cn(
        "relative",
        className,
        activo &&
          "text-yellow-500 hover:text-yellow-600 dark:text-yellow-400 dark:hover:text-yellow-300",
        !soportado &&
          !activo &&
          !cargando &&
          "text-gray-400 dark:text-gray-500",
      )}
    >
      {procesando || cargando ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : activo ? (
        <>
          <BellRing className="h-5 w-5 transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110" />
          <span className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 h-2 w-2 rounded-full bg-yellow-500 ring-2 ring-white dark:ring-neutral-900" />
        </>
      ) : (
        <Bell className="h-5 w-5 transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110" />
      )}
    </Button>
  );
}
