import { useEffect, useState } from "react";
import type React from "react";
import { NavLink } from "react-router-dom";
import { PhoneCall, RefreshCw, type LucideIcon } from "lucide-react";
import { AiIcon } from "./AiIcon";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export function AppShell({
  children,
  compact = false,
  navItems = []
}: {
  children: React.ReactNode;
  compact?: boolean;
  navItems?: NavItem[];
}) {
  const { online, retry } = useOnlineStatus();

  return (
    <main className="min-h-dvh bg-slate-100 text-ink">
      <div className="mx-auto min-h-dvh w-full max-w-md bg-app shadow-[0_0_0_1px_rgba(15,23,42,0.05)]">
        <div className={compact ? "" : "px-4 pb-[calc(4.75rem+env(safe-area-inset-bottom))] sm:px-5"}>
          {online ? children : <OfflineEmergencyScreen onRetry={retry} />}
        </div>
        {navItems.length > 0 ? (
          <nav aria-label="Navegacion principal" className="fixed bottom-0 left-1/2 z-20 w-full max-w-md -translate-x-1/2 border-x border-t border-slate-200/80 bg-white/95 shadow-[0_-8px_20px_rgba(31,38,51,0.06)] backdrop-blur">
            <div className="mx-auto grid h-[4.5rem] max-w-md grid-cols-3 gap-1 px-4 pb-[max(0.35rem,env(safe-area-inset-bottom))] pt-1.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.href}
                    to={item.href}
                    className={({ isActive }) =>
                        `grid h-14 place-items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold transition ${
                        isActive ? "bg-emergency-50 text-emergency-700" : "text-muted hover:bg-slate-50"
                      }`
                    }
                  >
                    <Icon className="h-5 w-5" />
                    {item.label}
                  </NavLink>
                );
              })}
            </div>
          </nav>
        ) : null}
      </div>
    </main>
  );
}

function OfflineEmergencyScreen({ onRetry }: { onRetry: () => void }) {
  return (
    <section className="grid h-dvh place-items-center overflow-hidden px-5 py-6 text-center">
      <div className="w-full max-w-sm">
        <span className="mx-auto grid h-20 w-20 place-items-center rounded-full border-4 border-emergency-100 bg-white text-emergency-600 shadow-soft">
          <AiIcon name="siren" className="h-12 w-12" />
        </span>
        <p className="mt-5 inline-flex rounded-full bg-amber-50 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wide text-amber-700">Modo sin conexion</p>
        <h1 className="mt-4 text-2xl font-black text-emergency-700">Sin conexion</h1><p className="mt-1 text-sm font-bold text-ink">a internet</p>
        <p className="mx-auto mt-3 max-w-xs text-sm font-medium leading-relaxed text-muted">
          Los reportes, estados y ubicacion en vivo se actualizaran cuando vuelva internet.
        </p>
        <div className="mt-8 rounded-lg border border-amber-200 bg-amber-50 p-4 text-left"><p className="text-xs font-black text-amber-900">Si es una emergencia activa, no esperes la conexion.</p><p className="mt-1 text-xs font-medium text-amber-800">Coordina por radio o llama directamente al 116.</p></div>
        <a className="btn-primary mt-5 inline-flex items-center gap-2" href="tel:116"><PhoneCall className="h-5 w-5" aria-hidden="true" /> Llamar 116</a>
        <button className="btn-secondary mt-3" onClick={onRetry} type="button">
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          Reintentar
        </button>
      </div>
    </section>
  );
}

function useOnlineStatus() {
  const [online, setOnline] = useState(() => navigator.onLine);
  const syncOnlineStatus = () => setOnline(navigator.onLine);

  useEffect(() => {
    window.addEventListener("online", syncOnlineStatus);
    window.addEventListener("offline", syncOnlineStatus);

    return () => {
      window.removeEventListener("online", syncOnlineStatus);
      window.removeEventListener("offline", syncOnlineStatus);
    };
  }, []);

  return { online, retry: syncOnlineStatus };
}
