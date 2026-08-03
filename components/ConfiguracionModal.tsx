"use client";

import { useState } from "react";
import { Settings, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogPanel } from "@headlessui/react";
import ConfiguracionSistema from "@/components/dashboard/ConfiguracionSistema";

export default function ConfiguracionModal() {
  const [isOpen, setIsOpen] = useState(false);

  const handleClose = () => setIsOpen(false);

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        className="group h-10 w-10 p-0 rounded-full shrink-0 flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-gray-100/50 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-800/50 transition-colors"
        onClick={() => setIsOpen(true)}
        title="Configuración del Sistema"
      >
        <Settings className="h-5 w-5 transition-transform duration-300 group-hover:rotate-90" />
      </Button>

      <Dialog open={isOpen} onClose={handleClose} className="relative z-[60] font-sans">
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" aria-hidden="true" />
        <div className="fixed inset-0 flex items-stretch justify-center p-0 md:p-4 lg:p-6">
          <DialogPanel className="mx-auto w-full h-full md:h-[96vh] md:max-h-[96vh] lg:w-[60%] max-w-none bg-white dark:bg-neutral-900 md:rounded-3xl shadow-2xl overflow-hidden flex flex-col">
            <div className="px-4 py-3 md:px-6 md:py-4 border-b border-gray-100 dark:border-neutral-800 flex justify-between items-center bg-gray-50/50 dark:bg-neutral-800/50 shrink-0">
              <h2 className="text-base md:text-2xl font-black text-blue-900 dark:text-blue-300 flex items-center gap-2">
                <Settings className="h-5 w-5 md:h-6 md:w-6 shrink-0" />
                Configuración del Sistema
              </h2>
              <button
                type="button"
                onClick={handleClose}
                className="p-2 hover:bg-gray-200 dark:hover:bg-neutral-700 rounded-full transition-colors"
              >
                <X className="h-6 w-6 text-gray-400" />
              </button>
            </div>
            <div className="p-3 md:p-6 flex-1 overflow-y-auto bg-gray-50/30 dark:bg-neutral-950/50 flex flex-col min-h-0">
              {isOpen && <ConfiguracionSistema onClose={handleClose} />}
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    </>
  );
}
