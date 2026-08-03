"use server";

import { createClient } from "@/utils/supabase/server";
import supabaseAdmin from "@/utils/supabase/admin";

export async function obtenerConfiguracionAction() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("sis_configuracion")
    .select("*")
    .single();
  if (error) {
    console.error("Error al obtener configuración:", error.message);
    return null;
  }
  return data;
}

async function guardarConfiguracion(payload: Record<string, unknown>) {
  const { data: current } = await supabaseAdmin
    .from("sis_configuracion")
    .select("id")
    .limit(1)
    .maybeSingle();

  const datos = {
    ...payload,
    updated_at: new Date().toISOString(),
  };

  if (current?.id) {
    const { data, error } = await supabaseAdmin
      .from("sis_configuracion")
      .update(datos)
      .eq("id", current.id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  const { data, error } = await supabaseAdmin
    .from("sis_configuracion")
    .insert(datos)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function actualizarConfiguracionGeneralAction(
  nombre_candidato: string,
  lugar: string,
  frase: string,
  meta_celula: number = 15,
  meta_celula_minima: number = 10,
) {
  return guardarConfiguracion({
    nombre_candidato,
    lugar,
    frase,
    meta_celula,
    meta_celula_minima,
  });
}

export async function actualizarConfiguracionAction(
  nombre_candidato: string,
  lugar: string,
  frase: string,
  objetivo_total: number,
  meta_por_lider: number,
  padron: boolean = false,
  meta_celula: number = 15,
  meta_celula_minima: number = 10,
  hay_sede: boolean = true,
) {
  return guardarConfiguracion({
    nombre_candidato,
    lugar,
    frase,
    objetivo_total,
    meta_por_lider,
    padron,
    meta_celula,
    meta_celula_minima,
    hay_sede,
  });
}

export async function actualizarConfiguracionSuperAction(
  padron: boolean,
  hay_sede: boolean,
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("No autenticado");
  }

  const { data: perfil } = await supabase
    .from("info_perfil")
    .select("roles(nombre)")
    .eq("user_id", user.id)
    .single();

  const roles = perfil?.roles as
    | { nombre?: string | null }
    | { nombre?: string | null }[]
    | null
    | undefined;
  const rol = Array.isArray(roles)
    ? (roles[0]?.nombre || "").toUpperCase()
    : (roles?.nombre || "").toUpperCase();

  if (rol !== "SUPER") {
    throw new Error("Solo el rol SUPER puede modificar esta configuración");
  }

  return guardarConfiguracion({ padron, hay_sede });
}
