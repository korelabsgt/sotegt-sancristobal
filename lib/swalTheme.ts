import Swal, { type SweetAlertOptions } from "sweetalert2";

export function isDarkModeActive(): boolean {
  return (
    typeof document !== "undefined" &&
    document.documentElement.classList.contains("dark")
  );
}

export function swalThemeOptions(options?: {
  confirmButtonClass?: string;
  cancelButtonClass?: string;
}): Pick<
  SweetAlertOptions,
  "background" | "color" | "buttonsStyling" | "customClass"
> {
  const isDark = isDarkModeActive();
  const confirmDefault = isDark ? "swal-btn-outline-blue" : "swal-btn-outline-blue-light";
  const cancelDefault = isDark ? "swal-btn-outline-blue" : "swal-btn-outline-blue-light";

  return {
    background: isDark ? "#0a0a0a" : "#ffffff",
    color: isDark ? "#f5f5f5" : "#171717",
    buttonsStyling: false,
    customClass: {
      popup: isDark ? "swal-dark-popup" : "swal-light-popup",
      title: isDark ? "swal-dark-title" : "swal-light-title",
      htmlContainer: isDark ? "swal-dark-html" : "swal-light-html",
      confirmButton: options?.confirmButtonClass ?? confirmDefault,
      cancelButton: options?.cancelButtonClass ?? cancelDefault,
      actions: "swal-actions-spaced",
    },
  };
}

export function swalNoEliminarCelula() {
  return Swal.fire({
    ...swalThemeOptions(),
    icon: "error",
    title: "No se puede eliminar",
    text: "No se puede eliminar porque hay afiliados en el sistema asignados a esta célula.",
    confirmButtonText: "OK",
  });
}

export function swalConfirmarEliminacion(nombreCompleto: string) {
  const isDark = isDarkModeActive();

  return Swal.fire({
    ...swalThemeOptions({
      confirmButtonClass: isDark ? "swal-btn-outline-red" : "swal-btn-outline-red-light",
      cancelButtonClass: isDark ? "swal-btn-outline-blue" : "swal-btn-outline-blue-light",
    }),
    title: "¿Está seguro?",
    text: `Se eliminará permanentemente a "${nombreCompleto}".`,
    icon: "warning",
    showCancelButton: true,
    reverseButtons: true,
    confirmButtonText: "Sí, ¡eliminar!",
    cancelButtonText: "Cancelar",
  });
}
