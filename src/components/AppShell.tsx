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
      <div className="mx-auto min-h-dvh w-full max-w-md bg-app">
        <div className={compact ? "" : "px-5 pb-28"}>
          {online ? children : <OfflineEmergencyScreen onRetry={retry} />}
        </div>
        {navItems.length > 0 ? (
          <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white/95 backdrop-blur">
            <div className="mx-auto grid max-w-md grid-cols-3 px-4 py-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.href}
                    to={item.href}
                    className={({ isActive }) =>
                      `grid place-items-center gap-1 rounded-lg px-2 py-2 text-xs font-semibold ${
                        isActive ? "bg-emergency-50 text-emergency-700" : "text-muted"
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
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-amber-50 text-amber-700">
          <WifiOff className="h-8 w-8" aria-hidden="true" />
        </span>
        <h1 className="mt-5 text-2xl font-black text-ink">Sin conexion</h1>
        <p className="mt-2 text-sm font-medium text-muted">
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
