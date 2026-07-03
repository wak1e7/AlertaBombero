import type React from "react";
import { NavLink } from "react-router-dom";
import type { LucideIcon } from "lucide-react";

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
  return (
    <main className="min-h-dvh bg-app text-ink">
      <div className="mx-auto min-h-dvh w-full max-w-md bg-app">
        <div className={compact ? "" : "px-5 pb-28"}>{children}</div>
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
