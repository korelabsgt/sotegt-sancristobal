import HeaderAuth from "@/components/header-auth";
import LogoLink from "@/components/ui/LogoLink";
import FechaHoraActual from "@/components/ui/FechaHoraActual";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <nav className="w-full flex min-h-[3.5rem] py-2 overflow-visible">
        <div className="w-full flex items-center justify-between gap-2 pl-2 pr-3 sm:pr-5 text-xs min-w-0">
          <div className="flex items-center gap-3 shrink-0">
            <LogoLink />
          </div>
          <div className="shrink-0 min-w-0 overflow-visible">
            <HeaderAuth />
          </div>
        </div>
      </nav>

      <main className="flex flex-col gap-5 flex-grow w-full self-center overflow-x-hidden">
        {children}
      </main>

      <footer className="pt-5 mt-auto border-t border-foreground/10 bg-gray-100 dark:bg-neutral-900 text-gray-700 dark:text-gray-300 px-6 pb-6">
        <div className="mx-auto flex flex-col md:flex-row items-center justify-between gap-4 md:gap-0">
          <div className="text-left">
            <FechaHoraActual />
            <p className="mt-2 text-sm md:text-base">
              Powered by{" "}
              <a
                href="https://www.oscar27jimenez.com"
                target="_blank"
                rel="noreferrer"
                className="font-semibold hover:underline text-[#06c]"
              >
                Ing. Oscar Jiménez
              </a>
            </p>
          </div>

          <div className="text-right text-xs md:text-sm leading-tight">
            <p>© {new Date().getFullYear()} - Todos los derechos reservados.</p>
            <p className="text-[10px] md:text-xs mt-1">Versión 3.4.1</p>
          </div>
        </div>
      </footer>
    </>
  );
}
