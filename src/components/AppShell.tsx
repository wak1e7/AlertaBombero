import { useEffect, useState } from "react";
import type React from "react";
import { NavLink } from "react-router-dom";
import { PhoneCall, RefreshCw, WifiOff, type LucideIcon } from "lucide-react";

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
    <main className="min-h-dvh bg-app text-ink">
      <div className="mx-auto min-h-dvh w-full max-w-md bg-app shadow-[0_0_0_1px_rgba(15,23,42,0.03)]">
        <div className={compact ? "" : "px-4 pb-28 sm:px-5"}>
          {online ? children : <OfflineEmergencyScreen onRetry={retry} />}
        </div>
        {navItems.length > 0 ? (
          <nav aria-label="Navegacion principal" className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200/80 bg-white/95 backdrop-blur">
            <div className="mx-auto grid max-w-md grid-cols-3 gap-1 px-4 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.href}
                    to={item.href}
                    className={({ isActive }) =>
                      `grid min-h-14 place-items-center gap-1 rounded-lg px-2 py-1.5 text-[11px] font-bold transition ${
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
    <section className="grid min-h-dvh place-items-center px-5 py-8 text-center">
      <div>
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emergency-50 text-emergency-600">
          <WifiOff className="h-8 w-8" aria-hidden="true" />
        </span>
        <p className="section-kicker mt-5">Modo sin conexion</p>
        <h1 className="mt-1 text-2xl font-black text-ink">Sin conexion</h1>
        <p className="mt-1 text-sm font-bold text-ink">a internet</p>
        <p className="mx-auto mt-2 max-w-xs text-sm font-medium leading-relaxed text-muted">
          Los reportes, estados y ubicacion en vivo se actualizaran cuando vuelva internet.
        </p>
        <a className="btn-primary mt-8 inline-flex items-center gap-2" href="tel:116">
          <PhoneCall className="h-5 w-5" aria-hidden="true" />
          Llamar 116
        </a>
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
