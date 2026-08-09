"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/lib/toast";
import Celula from "./Celula";
import Form from "./forms/afiliados/Afiliados";
import type { Afiliado, Lider } from "./esquemas";
import { obtenerAfiliadosAction } from "./actions/afiliados";
import { useCelula } from "@/contexts/celula-context";

type Lugar = {
  id: number;
  nombre: string;
  sector_id: number | null;
  sector_nombre: string | null;
};

export default function CelulaPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const {
    lider,
    afiliadosSimulados,
    hydrated,
    actualizarLider,
    clearCelula,
  } = useCelula();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [afiliadoParaEditar, setAfiliadoParaEditar] = useState<Afiliado | null>(null);
  const [liderParaNuevoAfiliado, setLiderParaNuevoAfiliado] = useState<string | null>(null);
  const [familiarDeIdParaNuevo, setFamiliarDeIdParaNuevo] = useState<string | null>(null);
  const [isFirstMemberAddition, setIsFirstMemberAddition] = useState(false);

  const { data: dashboardData, isPending: isDashboardPending } = useQuery({
    queryKey: ["dashboard-data"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard");
      const data = await res.json();
      if (!res.ok || data.error) {
        toast.error(data.error || "Error al cargar datos");
        return null;
      }
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });
  const isDashboardLoading = isDashboardPending && !dashboardData;

  const rol = dashboardData?.session?.rol || "";
  const allUsers = (dashboardData?.usuarios || []) as Lider[];
  const allLideres = allUsers.filter((u) => u.rol === "LIDER");
  const lugares = (dashboardData?.lugares || []) as Lugar[];

  const { data: afiliados = [] } = useQuery({
    queryKey: ["afiliados-gl"],
    queryFn: () => obtenerAfiliadosAction(),
    enabled: isFormOpen,
    staleTime: 5 * 60_000,
  });

  useEffect(() => {
    if (!hydrated || !dashboardData || !lider || lider.simulado) return;
    const updated = allUsers.find((u) => u.id === lider.id);
    if (updated) actualizarLider(updated);
  }, [hydrated, dashboardData, lider?.id, lider?.simulado]);

  useEffect(() => {
    if (!hydrated || isDashboardLoading) return;
    if (!lider) {
      router.replace("/protected");
    }
  }, [hydrated, isDashboardLoading, lider, router]);

  const fetchData = async () => {
    await queryClient.invalidateQueries({ queryKey: ["dashboard-data"] });
    await queryClient.invalidateQueries({ queryKey: ["afiliados-lider"] });
    await queryClient.invalidateQueries({ queryKey: ["afiliados-gl"] });
    await queryClient.invalidateQueries({ queryKey: ["conteo_padron"] });
  };

  const handleClose = () => {
    clearCelula();
    router.push("/protected");
  };

  const handleOpenAnadirAfiliado = (
    liderId: string,
    isFirstMember = false,
    familiarDeId: string | null = null,
  ) => {
    setAfiliadoParaEditar(null);
    setLiderParaNuevoAfiliado(liderId);
    setIsFirstMemberAddition(isFirstMember);
    setFamiliarDeIdParaNuevo(familiarDeId);
    setIsFormOpen(true);
  };

  const handleOpenEditModal = (afiliado: Afiliado) => {
    setAfiliadoParaEditar(afiliado);
    setLiderParaNuevoAfiliado(null);
    setFamiliarDeIdParaNuevo(null);
    setIsFirstMemberAddition(false);
    setIsFormOpen(true);
  };

  const handleSaveAndCloseForm = async () => {
    setIsFormOpen(false);
    await fetchData();
    if (lider && !lider.simulado) {
      const updated = allLideres.find((l) => l.id === lider.id);
      if (updated) actualizarLider(updated);
    }
  };

  if (!hydrated || !lider) {
    return (
      <div className="flex items-center justify-center min-h-[40vh] text-gray-500 dark:text-neutral-400">
        {isDashboardLoading || !hydrated ? "Cargando célula..." : "Redirigiendo..."}
      </div>
    );
  }

  return (
    <>
      <div className="w-full flex flex-col min-h-[calc(100dvh-8rem)] bg-white dark:bg-neutral-950">
        <Celula
          mode="page"
          lider={lider}
          onClose={handleClose}
          onEditar={handleOpenEditModal}
          onAnadirAfiliado={handleOpenAnadirAfiliado}
          onDataChange={() => void fetchData()}
          rolUsuarioSesion={rol}
          afiliadosSimulados={afiliadosSimulados}
        />
      </div>

      <Form
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSave={handleSaveAndCloseForm}
        afiliadoAEditar={afiliadoParaEditar}
        liderPredefinidoId={liderParaNuevoAfiliado}
        lugares={lugares}
        lideres={allLideres}
        afiliados={afiliados}
        isFirstMember={isFirstMemberAddition}
        familiarDeId={familiarDeIdParaNuevo}
        datosLider={allLideres.find((l) => l.id === liderParaNuevoAfiliado)}
      />
    </>
  );
}
