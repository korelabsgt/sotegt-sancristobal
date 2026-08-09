"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { getUserDataAction } from "./actions";

export default function useUserData() {
  const [userId, setUserId] = useState("");
  const [email, setEmail] = useState("");
  const [nombres, setNombres] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [rol, setRol] = useState("");
  const [rol_id, setRolId] = useState<number | null>(null);
  const [cargando, setCargando] = useState(true);

  const obtenerUsuario = useCallback(async () => {
    try {
      const data = await getUserDataAction();

      if (data) {
        setUserId(data.id || "");
        setEmail(data.email?.replace(/@.*$/, "") || "");
        setNombres(data.nombres || "");
        setApellidos(data.apellidos || "");
        setRol(data.rol || "");
        setRolId(data.rol_id || null);
      } else {
        setUserId("");
        setEmail("");
        setNombres("");
        setApellidos("");
        setRol("");
        setRolId(null);
      }
    } catch (error) {
      console.error("Error al obtener sesión:", error);
      setUserId("");
      setEmail("");
      setNombres("");
      setApellidos("");
      setRol("");
      setRolId(null);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    setCargando(true);
    void obtenerUsuario();

    const supabase = createClient();
    const knownUserIdRef: { current: string | null | undefined } = {
      current: undefined,
    };

    supabase.auth.getSession().then(({ data }) => {
      if (knownUserIdRef.current === undefined) {
        knownUserIdRef.current = data.session?.user?.id ?? null;
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      const nextUserId = session?.user?.id ?? null;

      if (event === "TOKEN_REFRESHED") {
        knownUserIdRef.current = nextUserId;
        return;
      }

      if (event === "SIGNED_IN") {
        if (
          knownUserIdRef.current === undefined ||
          nextUserId === knownUserIdRef.current
        ) {
          knownUserIdRef.current = nextUserId;
          return;
        }
        knownUserIdRef.current = nextUserId;
        setCargando(true);
        void obtenerUsuario();
        return;
      }

      if (event === "SIGNED_OUT" || event === "USER_UPDATED") {
        knownUserIdRef.current = nextUserId;
        setCargando(true);
        void obtenerUsuario();
      }
    });

    return () => subscription.unsubscribe();
  }, [obtenerUsuario]);

  return {
    userId,
    email,
    nombres,
    apellidos,
    rol,
    rol_id,
    cargando,
  };
}
