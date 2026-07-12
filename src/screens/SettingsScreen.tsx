import { Accessibility, ArrowLeft, ChevronRight, Settings2 } from "lucide-react";
import { Link } from "react-router-dom";
import { AppShell } from "../components/AppShell";

export function SettingsScreen({ backTo, navItems, role }: { backTo: string; navItems: Parameters<typeof AppShell>[0]["navItems"]; role: "citizen" | "firefighter" }) {
  const accessibilityPath = `/${role === "citizen" ? "ciudadano" : "bombero"}/configuracion/accesibilidad`;

  return (
    <AppShell navItems={navItems}>
      <header className="screen-header flex items-center gap-3 pt-5">
        <Link aria-label="Volver al perfil" className="icon-button" to={backTo}><ArrowLeft className="h-5 w-5" /></Link>
        <div><p className="section-kicker">Cuenta</p><h1 className="text-xl font-black text-ink">Configuracion</h1></div>
      </header>
      <section className="mt-5 space-y-3">
        <div className="app-card flex items-center gap-3 p-4">
          <span className="grid h-11 w-11 place-items-center rounded-lg bg-emergency-50 text-emergency-600"><Settings2 className="h-5 w-5" /></span>
          <div><h2 className="text-sm font-black text-ink">Preferencias</h2><p className="mt-1 text-xs leading-relaxed text-muted">Personaliza la aplicacion para usarla con comodidad.</p></div>
        </div>
        <Link className="app-card flex min-h-20 items-center justify-between gap-3 p-4 transition active:scale-[0.99]" to={accessibilityPath}>
          <span className="flex min-w-0 items-center gap-3"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-emergency-50 text-emergency-600"><Accessibility className="h-5 w-5" /></span><span><strong className="block text-sm text-ink">Accesibilidad</strong><span className="mt-1 block text-[11px] leading-relaxed text-muted">Texto, contraste, movimiento y controles tactiles.</span></span></span>
          <ChevronRight aria-hidden="true" className="h-5 w-5 shrink-0 text-emergency-600" />
        </Link>
      </section>
    </AppShell>
  );
}
