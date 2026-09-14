"use client";

import { useCallback, useEffect, useState } from "react";
import {
  guardarSubscripcionAction,
  eliminarSubscripcionAction,
} from "@/app/actions/push";
import {
  entornoPermiteIntentoPush,
  esErrorServicioPushNoDisponible,
  esIOSSinPWA,
} from "@/lib/pushAyuda";

const SW_URL = "/push/sw.js";
const SW_SCOPE = "/push/";
const ACTIVATION_TIMEOUT_MS = 20000;

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const buffer = new ArrayBuffer(rawData.length);
  const outputArray = new Uint8Array(buffer);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

async function obtenerVapidPublicKey(): Promise<string> {
  const embebida = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";
  if (embebida) return embebida;

  try {
    const res = await fetch("/api/push/vapid-public-key");
    if (!res.ok) return "";
    const data = await res.json();
    return data.publicKey || "";
  } catch {
    return "";
  }
}

function esperarActivacion(
  reg: ServiceWorkerRegistration,
): Promise<ServiceWorkerRegistration> {
  if (reg.active) return Promise.resolve(reg);

  return new Promise((resolve, reject) => {
    let intervalo: ReturnType<typeof setInterval> | undefined;

    const listo = () => {
      if (reg.active) {
        clearTimeout(timeout);
        if (intervalo) clearInterval(intervalo);
        resolve(reg);
      }
    };

    const timeout = setTimeout(() => {
      if (intervalo) clearInterval(intervalo);
      reject(new Error("timeout activando service worker"));
    }, ACTIVATION_TIMEOUT_MS);

    const worker = reg.installing || reg.waiting;
    if (worker) {
      worker.addEventListener("statechange", listo);
      listo();
    }

    reg.addEventListener("updatefound", () => {
      reg.installing?.addEventListener("statechange", listo);
    });

    intervalo = setInterval(listo, 250);
  });
}

async function ensurePushRegistration(): Promise<ServiceWorkerRegistration> {
  const existente = await navigator.serviceWorker.getRegistration(SW_SCOPE);
  if (existente?.active) return existente;

  if (existente) {
    return esperarActivacion(existente);
  }

  const reg = await navigator.serviceWorker.register(SW_URL, {
    scope: SW_SCOPE,
    updateViaCache: "none",
  });

  return esperarActivacion(reg);
}

async function servicioPushDisponible(
  reg: ServiceWorkerRegistration,
  vapidKey: string,
): Promise<boolean> {
  try {
    await reg.pushManager.permissionState({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey),
    });
    return true;
  } catch {
    return false;
  }
}

async function comprobarSuscripcionActiva(): Promise<boolean> {
  if (Notification.permission !== "granted") return false;

  const regs = await navigator.serviceWorker.getRegistrations();
  for (const reg of regs) {
    try {
      const sub = await reg.pushManager.getSubscription();
      if (sub) return true;
    } catch {
      /* noop */
    }
  }
  return false;
}

export default function usePushNotifications() {
  const [soportado, setSoportado] = useState(false);
  const [activo, setActivo] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [vapidKey, setVapidKey] = useState("");

  useEffect(() => {
    let cancelado = false;

    (async () => {
      if (!entornoPermiteIntentoPush()) {
        if (!cancelado) {
          setSoportado(false);
          setCargando(false);
        }
        return;
      }

      const key = await obtenerVapidPublicKey();
      if (cancelado) return;

      if (!key) {
        if (!cancelado) {
          setSoportado(false);
          setCargando(false);
        }
        return;
      }

      setVapidKey(key);
      setSoportado(true);

      try {
        const yaActivo = await comprobarSuscripcionActiva();
        if (!cancelado) setActivo(yaActivo);
      } catch {
        if (!cancelado) setActivo(false);
      } finally {
        if (!cancelado) setCargando(false);
      }
    })();

    return () => {
      cancelado = true;
    };
  }, []);

  const activar = useCallback(async () => {
    if (procesando) return;

    if (!entornoPermiteIntentoPush() || esIOSSinPWA()) {
      return { ok: false, motivo: "instalar-app" as const };
    }

    if (!soportado || !vapidKey) {
      return { ok: false, motivo: "instalar-app" as const };
    }

    setProcesando(true);
    try {
      const permiso = await Notification.requestPermission();
      if (permiso !== "granted") {
        setActivo(false);
        return { ok: false, motivo: "permiso-denegado" as const };
      }

      const reg = await ensurePushRegistration();

      const pushOk = await servicioPushDisponible(reg, vapidKey);
      if (!pushOk) {
        setSoportado(false);
        setActivo(false);
        return { ok: false, motivo: "instalar-app" as const };
      }

      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey),
        });
      }

      const json = sub.toJSON();
      await guardarSubscripcionAction(
        {
          endpoint: sub.endpoint,
          keys: {
            p256dh: json.keys?.p256dh || "",
            auth: json.keys?.auth || "",
          },
        },
        navigator.userAgent,
      );

      setActivo(true);
      return { ok: true as const };
    } catch (e) {
      setActivo(false);
      if (esErrorServicioPushNoDisponible(e)) {
        setSoportado(false);
        return { ok: false, motivo: "instalar-app" as const };
      }
      return { ok: false, motivo: "instalar-app" as const };
    } finally {
      setProcesando(false);
    }
  }, [soportado, procesando, vapidKey]);

  const desactivar = useCallback(async () => {
    if (!soportado || procesando) return;
    setProcesando(true);
    try {
      const regs = await navigator.serviceWorker.getRegistrations();
      for (const reg of regs) {
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
          const endpoint = sub.endpoint;
          await sub.unsubscribe().catch(() => {});
          await eliminarSubscripcionAction(endpoint).catch(() => {});
        }
      }
      setActivo(false);
      return { ok: true as const };
    } catch {
      return { ok: false as const };
    } finally {
      setProcesando(false);
    }
  }, [soportado, procesando]);

  const toggle = useCallback(async () => {
    if (!activo) return activar();
    if (!soportado) return { ok: false, motivo: "no-soportado" as const };
    return desactivar();
  }, [activo, activar, desactivar, soportado]);

  return {
    soportado,
    activo,
    cargando,
    procesando,
    activar,
    desactivar,
    toggle,
  };
}
