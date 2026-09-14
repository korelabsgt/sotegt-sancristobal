export function esIOS(): boolean {
  if (typeof window === "undefined") return false;
  const ua = navigator.userAgent;
  return (
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

export function esIOSSinPWA(): boolean {
  if (typeof window === "undefined") return false;
  const esPWA =
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone ===
      true;
  return esIOS() && !esPWA;
}

export function entornoPermiteIntentoPush(): boolean {
  if (typeof window === "undefined") return false;
  if (!window.isSecureContext) return false;
  if (esIOSSinPWA()) return false;
  return (
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

export function esErrorServicioPushNoDisponible(error: unknown): boolean {
  const partes: string[] = [];
  if (error instanceof Error) {
    partes.push(error.name, error.message);
  } else if (error != null) {
    partes.push(String(error));
  }
  const n = partes.join(" ").toLowerCase();
  return (
    n.includes("push service not available") ||
    n.includes("registration failed") ||
    n.includes("aborterror") ||
    n.includes("not supported") ||
    n.includes("operation is insecure")
  );
}

export function mensajeAyudaNotificaciones(): string {
  if (typeof navigator !== "undefined" && esIOS()) {
    return "En iPhone instala la app desde Safari: Compartir → Agregar a inicio. Abre SOTE desde el ícono en tu pantalla y vuelve a tocar la campana.";
  }
  if (
    typeof navigator !== "undefined" &&
    /Android/i.test(navigator.userAgent)
  ) {
    return "En Android instala o abre esta app en Google Chrome y vuelve a tocar la campana.";
  }
  if (typeof navigator !== "undefined") {
    return "Mac/Windows: en Google Chrome pulsa Instalar en la barra de direcciones (o menú Opciones ⋮ → Instalar aplicación). Abre la app instalada y toca la campana.";
  }
  return "iPhone: instala desde Safari. Android y computadora: usa Google Chrome.";
}

export function mensajeAyudaNotificacionesHtml(): string {
  return `<div class="text-left text-sm leading-relaxed space-y-3">
<p><strong>iPhone:</strong> instala la app desde <strong>Safari</strong> (Compartir → Agregar a inicio). Ábrela desde el ícono y toca la campana.</p>
<p><strong>Android:</strong> instala o abre la app en <strong>Google Chrome.</strong></p>
<div>
<p class="mb-2"><strong>Mac / Windows:</strong> instálala en <strong>Google Chrome</strong>:</p>
<ol class="list-decimal pl-5 space-y-1.5">
<li>Instala desde <strong>Google Chrome</strong> </li>
<li>En la barra de direcciones, pulsa el botón <strong>Instalar.</strong> </li>
</ol>
</div>
</div>`;
}
