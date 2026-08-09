"use client";

import { useState } from "react";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Eye,
  EyeOff,
  Check,
  AlertTriangle,
  XCircle,
  CheckCircle2,
} from "lucide-react";

type Props = {
  password: string;
  confirmar: string;
  onPasswordChange: (val: string) => void;
  onConfirmarChange: (val: string) => void;
};

const REQUISITOS = [
  { key: "length", label: "Mínimo 8 caracteres", test: (p: string) => p.length >= 8 },
  { key: "upper", label: "Una mayúscula", test: (p: string) => /[A-Z]/.test(p) },
  { key: "lower", label: "Una minúscula", test: (p: string) => /[a-z]/.test(p) },
  { key: "number", label: "Un número", test: (p: string) => /\d/.test(p) },
  {
    key: "symbol",
    label: "Un símbolo (!@#$%)",
    test: (p: string) => /[^A-Za-z0-9]/.test(p),
  },
] as const;

export default function PasswordSection({
  password,
  confirmar,
  onPasswordChange,
  onConfirmarChange,
}: Props) {
  const [mostrarPass, setMostrarPass] = useState(false);
  const [mostrarConfirm, setMostrarConfirm] = useState(false);

  const contraseñasCoinciden = password.length > 0 && password === confirmar;
  const confirmIniciado = confirmar.length > 0;

  return (
    <div className="flex flex-col gap-3">
      <div>
        <Label htmlFor="password" className="sr-only">
          Contraseña
        </Label>
        <div className="relative">
          <Input
            id="password"
            type={mostrarPass ? "text" : "password"}
            name="password"
            value={password}
            onChange={(e) => onPasswordChange(e.target.value)}
            placeholder="Contraseña"
            required
            className="h-11 rounded-xl border-gray-200 bg-white pr-11 text-sm dark:border-neutral-700 dark:bg-neutral-900"
          />
          <button
            type="button"
            onClick={() => setMostrarPass(!mostrarPass)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-gray-700 dark:hover:text-gray-200"
            aria-label={mostrarPass ? "Ocultar contraseña" : "Mostrar contraseña"}
          >
            {mostrarPass ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>

      <div>
        <div className="mb-1.5 flex items-center justify-between gap-2">
          <Label htmlFor="confirmar" className="sr-only">
            Confirmar contraseña
          </Label>
          {contraseñasCoinciden ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 size={13} />
              Coinciden
            </span>
          ) : confirmIniciado ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-500">
              <XCircle size={13} />
              No coinciden
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
              <AlertTriangle size={13} />
              Confirma la contraseña
            </span>
          )}
        </div>
        <div className="relative">
          <Input
            id="confirmar"
            type={mostrarConfirm ? "text" : "password"}
            name="confirmar"
            value={confirmar}
            onChange={(e) => onConfirmarChange(e.target.value)}
            placeholder="Confirmar contraseña"
            required
            className="h-11 rounded-xl border-gray-200 bg-white pr-11 text-sm dark:border-neutral-700 dark:bg-neutral-900"
          />
          <button
            type="button"
            onClick={() => setMostrarConfirm(!mostrarConfirm)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-gray-700 dark:hover:text-gray-200"
            aria-label={
              mostrarConfirm ? "Ocultar confirmación" : "Mostrar confirmación"
            }
          >
            {mostrarConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>

      <div className="mt-1 flex items-start gap-3">
        <div className="shrink-0">
          <Image
            src="/gif/afiliados/gif0.gif"
            alt="Validación"
            width={110}
            height={110}
            unoptimized
            className="rounded-full"
          />
        </div>
        <ul className="grid flex-1 grid-cols-2 gap-1.5">
          {REQUISITOS.map((req) => {
            const ok = req.test(password);
            return (
              <li
                key={req.key}
                className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-colors ${
                  ok
                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                    : "bg-gray-50 text-gray-500 dark:bg-neutral-800/80 dark:text-neutral-400"
                }`}
              >
                <span
                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${
                    ok
                      ? "bg-emerald-500 text-white"
                      : "bg-gray-200 text-transparent dark:bg-neutral-700"
                  }`}
                >
                  <Check size={10} strokeWidth={3} />
                </span>
                {req.label}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
