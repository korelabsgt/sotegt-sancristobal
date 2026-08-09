"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  signUpAction,
  updateUsuarioAction,
  obtenerEmailUsuarioAction,
} from "@/app/actions/usuarios";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ChevronUp, X } from "lucide-react";
import { toast } from "@/lib/toast";
import PasswordSection from "@/components/admin/sign-up/PasswordSection";
import useUserData from "@/hooks/sesion/useUserData";
import { createClient } from "@/utils/supabase/client";
import { NUEVO_LIDER_SIMULADO } from "@/components/afiliados/datosSimulados";
import {
  PiBriefcaseDuotone,
  PiBuildingsDuotone,
  PiCodeDuotone,
  PiMedalDuotone,
  PiShieldCheckDuotone,
} from "react-icons/pi";
import type { IconType } from "react-icons";

interface RolDisponible {
  id: number;
  nombre: string;
}

interface SignupFormProps {
  onSuccess: () => void;
  onClose: () => void;
  isModal?: boolean;
  initialData?: any;
  rolSesion?: string;
  modoCrearSede?: boolean;
  rolInicial?: "LIDER" | "EMPLEADO" | "ADMIN" | "SUPER" | null;
}

type AcentoVisual = {
  Icon: IconType;
  accent: string;
  accentSoft: string;
  ring: string;
  btn: string;
};

function acentoPorContexto(
  modoCrearSede: boolean,
  editandoSede: boolean,
  rolInicial: SignupFormProps["rolInicial"],
  rolNombre?: string,
): AcentoVisual {
  const nombre = (rolNombre || rolInicial || "").toUpperCase();
  if (modoCrearSede || editandoSede || nombre === "SEDE") {
    return {
      Icon: PiBuildingsDuotone,
      accent: "text-blue-700 dark:text-blue-400",
      accentSoft: "bg-blue-50 dark:bg-blue-950/40",
      ring: "focus-visible:ring-blue-500/30",
      btn: "bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500",
    };
  }
  if (nombre === "EMPLEADO" || nombre === "TRABAJADOR") {
    return {
      Icon: PiBriefcaseDuotone,
      accent: "text-violet-700 dark:text-violet-400",
      accentSoft: "bg-violet-50 dark:bg-violet-950/40",
      ring: "focus-visible:ring-violet-500/30",
      btn: "bg-violet-600 hover:bg-violet-700 dark:bg-violet-600 dark:hover:bg-violet-500",
    };
  }
  if (nombre === "ADMIN" || nombre === "ADMINISTRADOR") {
    return {
      Icon: PiShieldCheckDuotone,
      accent: "text-emerald-700 dark:text-emerald-400",
      accentSoft: "bg-emerald-50 dark:bg-emerald-950/40",
      ring: "focus-visible:ring-emerald-500/30",
      btn: "bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500",
    };
  }
  if (nombre === "SUPER") {
    return {
      Icon: PiCodeDuotone,
      accent: "text-neutral-900 dark:text-neutral-100",
      accentSoft: "bg-neutral-100 dark:bg-neutral-800",
      ring: "focus-visible:ring-neutral-500/30",
      btn: "bg-neutral-900 hover:bg-black dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white",
    };
  }
  return {
    Icon: PiMedalDuotone,
    accent: "text-orange-700 dark:text-orange-400",
    accentSoft: "bg-orange-50 dark:bg-orange-950/40",
    ring: "focus-visible:ring-orange-500/30",
    btn: "bg-orange-600 hover:bg-orange-700 dark:bg-orange-600 dark:hover:bg-orange-500",
  };
}

export function SignupForm({
  onSuccess,
  onClose,
  isModal = false,
  initialData,
  rolSesion,
  modoCrearSede = false,
  rolInicial = null,
}: SignupFormProps) {
  const router = useRouter();
  const isEdit = !!initialData;
  const { rol: rolHook } = useUserData();
  const rolUsuarioSesion = rolSesion ?? rolHook;

  const modoSimulacion =
    !isEdit &&
    !modoCrearSede &&
    rolUsuarioSesion?.toUpperCase() === "DOCUMENTADOR";

  const [simulacionLista, setSimulacionLista] = useState(false);
  const mostrarSkeleton = modoSimulacion && !simulacionLista;

  const [loading, setLoading] = useState(false);
  const [rolesDisponibles, setRolesDisponibles] = useState<RolDisponible[]>([]);
  const [showPasswordAccordion, setShowPasswordAccordion] = useState(!isEdit);

  const [nombres, setNombres] = useState(
    modoCrearSede ? "Sede" : initialData?.nombres || "",
  );
  const [apellidos, setApellidos] = useState(
    modoCrearSede ? "Central" : initialData?.apellidos || "",
  );
  const [email, setEmail] = useState(
    modoCrearSede
      ? "sede"
      : initialData?.email?.replace(/@.*$/, "") || "",
  );
  const [password, setPassword] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [rol_id, setRolId] = useState<string>(
    initialData?.rol_id?.toString() || "",
  );

  const nombresValido = nombres.trim() !== "";
  const apellidosValido = apellidos.trim() !== "";
  const emailValido = email.trim() !== "";
  const rolValido = rol_id !== "";

  const passwordIngresada = password.length > 0;
  const cumpleRequisitos =
    isEdit && !passwordIngresada
      ? true
      : /^.*(?=.{8,})(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W]).*$/.test(
          password,
        );
  const contraseñasCoinciden =
    isEdit && !passwordIngresada
      ? true
      : password === confirmar && passwordIngresada;

  const formularioValido =
    nombresValido &&
    apellidosValido &&
    emailValido &&
    rolValido &&
    contraseñasCoinciden &&
    cumpleRequisitos;

  useEffect(() => {
    if (!initialData) return;
    setNombres(initialData.nombres || "");
    setApellidos(initialData.apellidos || "");
    setRolId(initialData.rol_id?.toString() || "");
    setPassword("");
    setConfirmar("");
    setShowPasswordAccordion(false);
  }, [initialData]);

  useEffect(() => {
    if (!isEdit || !initialData?.id) return;

    let cancelled = false;

    const cargarEmail = async () => {
      const correo =
        (initialData.email as string | undefined)?.replace(/@.*$/, "") ||
        (await obtenerEmailUsuarioAction(initialData.id as string));
      if (!cancelled) setEmail(correo);
    };

    void cargarEmail();

    return () => {
      cancelled = true;
    };
  }, [isEdit, initialData?.id, initialData?.email]);

  useEffect(() => {
    const fetchDatos = async () => {
      const supabase = createClient();
      const { data: r } = await supabase.from("roles").select("id, nombre");
      if (r) {
        setRolesDisponibles(r);
        if (!initialData?.rol_id) {
          if (modoCrearSede) {
            const rolSede = r.find(
              (role) =>
                role.id === 5 || role.nombre.toUpperCase() === "SEDE",
            );
            if (rolSede) setRolId(rolSede.id.toString());
          } else if (rolInicial === "EMPLEADO") {
            const rolEmpleado = r.find((role) => {
              const n = role.nombre.toUpperCase();
              return n === "EMPLEADO" || n === "TRABAJADOR";
            });
            if (rolEmpleado) setRolId(rolEmpleado.id.toString());
          } else if (rolInicial === "ADMIN") {
            const rolAdmin = r.find(
              (role) => role.nombre.toUpperCase() === "ADMIN",
            );
            if (rolAdmin) setRolId(rolAdmin.id.toString());
          } else if (
            rolInicial === "SUPER" &&
            rolUsuarioSesion?.toUpperCase() === "SUPER"
          ) {
            const rolSuper = r.find(
              (role) => role.nombre.toUpperCase() === "SUPER",
            );
            if (rolSuper) setRolId(rolSuper.id.toString());
          } else if (rolInicial === "LIDER" || !rolInicial) {
            const rolLider = r.find(
              (role) =>
                role.nombre.toUpperCase() === "LIDER" ||
                role.nombre.toUpperCase() === "LÍDER",
            );
            if (rolLider) setRolId(rolLider.id.toString());
          }
        }
      }
    };
    fetchDatos();
  }, [initialData, modoCrearSede, rolInicial, rolUsuarioSesion]);

  useEffect(() => {
    if (!modoSimulacion) return;

    const timer = setTimeout(() => {
      setNombres(NUEVO_LIDER_SIMULADO.nombres);
      setApellidos(NUEVO_LIDER_SIMULADO.apellidos);
      setEmail(NUEVO_LIDER_SIMULADO.email);
      setPassword(NUEVO_LIDER_SIMULADO.password);
      setConfirmar(NUEVO_LIDER_SIMULADO.password);
      setSimulacionLista(true);
    }, 1200);

    return () => clearTimeout(timer);
  }, [modoSimulacion]);

  const editandoSede =
    isEdit &&
    ((initialData?.rol || "").toUpperCase() === "SEDE" ||
      Number(initialData?.rol_id) === 5);

  const rolSeleccionado = rolesDisponibles.find(
    (r) => r.id.toString() === rol_id,
  );

  const titulo =
    isEdit
      ? editandoSede
        ? "Editar Usuario Sede"
        : "Editar acceso"
      : modoCrearSede
        ? "Crear Usuario Sede"
        : modoSimulacion
          ? "Nuevo Enlace (simulación)"
          : rolInicial === "EMPLEADO"
            ? "Nuevo Empleado"
            : rolInicial === "ADMIN"
              ? "Nuevo Admin"
              : rolInicial === "SUPER"
                ? "Nuevo Super"
                : "Nuevo Enlace";

  const acento = acentoPorContexto(
    modoCrearSede,
    editandoSede,
    rolInicial,
    rolSeleccionado?.nombre || initialData?.rol,
  );
  const HeaderIcon = acento.Icon;

  const inputClass = `h-11 rounded-xl border-gray-200 bg-white text-sm text-gray-900 shadow-none transition-shadow dark:border-neutral-700 dark:bg-neutral-900 dark:text-gray-100 ${acento.ring}`;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (modoSimulacion) {
      toast.info("Modo simulación: el enlace no se creó realmente.");
      onSuccess();
      return;
    }

    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const localPart = email.trim().replace(/@.*$/, "").replace(/\s/g, "");
    const finalEmail = `${localPart}@app.com`;
    formData.set("email", finalEmail);
    formData.set("nombres", nombres.trim());
    formData.set("apellidos", apellidos.trim());
    formData.set("rol_id", rol_id);
    if (isEdit) {
      formData.set("id", String(initialData.user_id || initialData.id || ""));
    }

    let result;
    if (isEdit) {
      result = await updateUsuarioAction(formData);
    } else {
      result = await signUpAction(formData);
    }

    setLoading(false);

    if (result?.error) {
      toast.error(result.error);
    } else if (result?.success) {
      toast.success(result.success);
      onSuccess();
      if (!isModal) router.refresh();
    }
  };

  return (
    <div className="relative mx-auto flex w-full flex-col gap-5 text-left md:max-w-xl">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span
            className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${acento.accentSoft} ${acento.accent}`}
          >
            <HeaderIcon className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h3
              className={`text-lg font-black tracking-tight md:text-xl ${acento.accent}`}
            >
              {titulo}
            </h3>
            <p className="mt-0.5 text-xs text-gray-500 dark:text-neutral-400">
              {isEdit
                ? "Actualiza los datos de acceso del usuario"
                : "Completa los datos para crear el acceso"}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-neutral-800 dark:hover:text-gray-200"
          aria-label="Cerrar"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {mostrarSkeleton ? (
        <div className="flex animate-pulse flex-col gap-4">
          <div className="h-11 w-full rounded-xl bg-gray-100 dark:bg-neutral-800" />
          <div className="h-11 w-full rounded-xl bg-gray-100 dark:bg-neutral-800" />
          <div className="h-11 w-full rounded-xl bg-gray-100 dark:bg-neutral-800" />
          <p className="text-center text-sm font-semibold text-blue-600 dark:text-blue-400">
            Cargando datos de simulación...
          </p>
        </div>
      ) : (
        <form
          className="flex flex-col gap-4"
          onSubmit={handleSubmit}
          noValidate
        >
          <input type="hidden" name="rol_id" value={rol_id} />

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-neutral-400">
                Nombres
              </Label>
              <Input
                name="nombres"
                value={nombres}
                onChange={(e) => setNombres(e.target.value)}
                readOnly={modoCrearSede}
                className={inputClass}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-neutral-400">
                Apellidos
              </Label>
              <Input
                name="apellidos"
                value={apellidos}
                onChange={(e) => setApellidos(e.target.value)}
                readOnly={modoCrearSede}
                className={inputClass}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-neutral-400">
              Usuario de acceso
            </Label>
            <Input
              name="email"
              type="text"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value.replace(/@.*$/, "").replace(/\s/g, ""))
              }
              readOnly={modoCrearSede}
              placeholder="usuario"
              className={inputClass}
            />
          </div>

          <div className="rounded-2xl border border-gray-200 bg-gray-50/80 p-3 dark:border-neutral-800 dark:bg-neutral-900/50 md:p-4">
            {isEdit ? (
              <button
                type="button"
                onClick={() => setShowPasswordAccordion(!showPasswordAccordion)}
                className={`mb-1 flex w-full items-center justify-between gap-2 rounded-xl px-1 py-1 text-sm font-semibold transition-colors ${acento.accent}`}
              >
                <span>
                  {showPasswordAccordion
                    ? "Datos de contraseña"
                    : "Cambiar contraseña"}
                </span>
                <ChevronUp
                  className={`h-4 w-4 shrink-0 transition-transform duration-300 ${
                    showPasswordAccordion ? "rotate-0" : "rotate-180"
                  }`}
                />
              </button>
            ) : (
              <h4 className="mb-3 px-0.5 text-xs font-bold uppercase tracking-wide text-gray-600 dark:text-neutral-300">
                Seguridad
              </h4>
            )}

            <div
              className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${
                showPasswordAccordion ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
              }`}
            >
              <div className="overflow-hidden">
                <div
                  className={`${isEdit ? "pt-2" : ""} ${
                    !isEdit || showPasswordAccordion
                      ? "opacity-100"
                      : "opacity-0"
                  } transition-opacity duration-300`}
                >
                  <PasswordSection
                    password={password}
                    confirmar={confirmar}
                    onPasswordChange={setPassword}
                    onConfirmarChange={setConfirmar}
                  />
                </div>
              </div>
            </div>
          </div>

          <Button
            type="submit"
            disabled={!formularioValido || loading}
            className={`h-12 w-full rounded-xl text-base font-bold text-white shadow-sm ${acento.btn}`}
          >
            {loading
              ? "Procesando..."
              : isEdit
                ? "Guardar cambios"
                : modoCrearSede
                  ? "Crear Sede"
                  : modoSimulacion
                    ? "Simular creación"
                    : "Crear acceso"}
          </Button>
        </form>
      )}
    </div>
  );
}
