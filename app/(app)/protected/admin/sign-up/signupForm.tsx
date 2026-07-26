"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signUpAction } from "@/app/actions/usuarios";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "@/lib/toast";
import PasswordSection from "@/components/admin/sign-up/PasswordSection";
import useUserData from "@/hooks/sesion/useUserData";
import { createClient } from "@/utils/supabase/client";

interface RolDisponible {
  id: number;
  nombre: string;
}

function etiquetaRolVisible(nombre: string): string {
  const n = nombre.toUpperCase();
  if (n === "LIDER" || n === "LÍDER") return "Enlace";
  return nombre;
}

export function SignupForm() {
  const router = useRouter();
  const { rol: rolUsuarioSesion } = useUserData();

  const [loading, setLoading] = useState(false);
  const [rolesDisponibles, setRolesDisponibles] = useState<RolDisponible[]>([]);

  const [nombres, setNombres] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [rol_id, setRolId] = useState<string>("");

  const cumpleRequisitos =
    /^.*(?=.{8,})(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W]).*$/.test(password);
  const contraseñasCoinciden = password === confirmar;

  const nombresValido = nombres.trim() !== "";
  const apellidosValido = apellidos.trim() !== "";
  const emailValido = email.trim() !== "";
  const rolValido = rol_id !== "";

  const camposCompletos =
    nombresValido &&
    apellidosValido &&
    emailValido &&
    password &&
    confirmar &&
    rolValido;
  const formularioValido =
    camposCompletos && contraseñasCoinciden && cumpleRequisitos;

  useEffect(() => {
    const fetchRoles = async () => {
      const supabase = createClient();
      const { data: rolesData } = await supabase
        .from("roles")
        .select("id, nombre");
      if (rolesData) setRolesDisponibles(rolesData);
    };
    fetchRoles();
  }, []);

  const rolesParaSelector = rolesDisponibles.filter(
    (r) => rolUsuarioSesion === "SUPER" || r.nombre !== "SUPER",
  );

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const finalEmail = `${email.trim()}@app.com`;
    formData.set("email", finalEmail);

    const result = await signUpAction(formData);

    setLoading(false);

    if (result?.error) {
      const errorMsg = result.error.toLowerCase();
      let displayMsg = result.error;

      if (errorMsg.includes("already registered"))
        displayMsg = "El usuario ya está registrado.";
      else if (errorMsg.includes("email rate limit"))
        displayMsg = "Demasiados intentos. Espere unos minutos.";

      toast.error(displayMsg);
    } else if (result?.success) {
      toast.success(result.success);
      router.push("/protected");
    }
  };

  return (
    <div className="flex flex-col w-full mx-auto md:max-w-xl gap-4 p-4 md:p-6 text-gray-900 dark:text-gray-100">
      <div className="flex justify-start items-center gap-4">
        <Button
          variant="ghost"
          onClick={() => router.push("/protected")}
          className="text-blue-600 dark:text-blue-400 text-base underline"
        >
          Volver
        </Button>
        <h1 className="text-3xl font-semibold">Nuevo Enlace</h1>
      </div>

      <p className="text-gray-600 dark:text-neutral-400">
        Registra el acceso para el nuevo enlace. Los datos personales (DPI,
        Teléfono, etc.) se completarán cuando el enlace inicie su grupo.
      </p>

      <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
        <div className="flex flex-col md:flex-row gap-4 w-full">
          <div className="w-full md:w-1/2">
            <Label htmlFor="nombres">Nombres</Label>
            <Input
              name="nombres"
              placeholder="Ingrese sus nombres"
              value={nombres}
              onChange={(e) => setNombres(e.target.value)}
              className="h-12 text-lg mt-1 bg-white dark:bg-neutral-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-neutral-600"
            />
          </div>
          <div className="w-full md:w-1/2">
            <Label htmlFor="apellidos">Apellidos</Label>
            <Input
              name="apellidos"
              placeholder="Ingrese sus apellidos"
              value={apellidos}
              onChange={(e) => setApellidos(e.target.value)}
              className="h-12 text-lg mt-1 bg-white dark:bg-neutral-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-neutral-600"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="email">Usuario de acceso</Label>
          <Input
            name="email"
            type="text"
            placeholder="Igrese el usuario"
            value={email}
            onChange={(e) =>
              setEmail(e.target.value.replace(/@.*$/, "").replace(/\s/g, ""))
            }
            className="h-12 text-lg mt-1 bg-white dark:bg-neutral-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-neutral-600"
          />
        </div>

        <div>
          <Label htmlFor="rol-selector">Asignar Rol</Label>
          <select
            id="rol-selector"
            name="rol_id"
            value={rol_id}
            onChange={(e) => setRolId(e.target.value)}
            className="w-full border border-gray-300 dark:border-neutral-600 rounded px-3 py-2 h-12 text-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-gray-100 mt-1"
            disabled={rolesDisponibles.length === 0}
          >
            <option value="">-- Seleccione un rol --</option>
            {rolesParaSelector.map((r) => (
              <option key={r.id} value={r.id.toString()}>
                {etiquetaRolVisible(r.nombre)}
              </option>
            ))}
          </select>
        </div>

        <PasswordSection
          password={password}
          confirmar={confirmar}
          onPasswordChange={setPassword}
          onConfirmarChange={setConfirmar}
        />

        <Button
          type="submit"
          disabled={!formularioValido || loading}
          className="h-14 text-xl bg-blue-700 hover:bg-blue-800 mt-4"
        >
          {loading ? "Creando Acceso..." : "Crear Usuario"}
        </Button>
      </form>
    </div>
  );
}
