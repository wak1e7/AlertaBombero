import { Accessibility, ArrowLeft, Contrast, Eye, Rows3, Settings2, Type } from "lucide-react";
import { Link } from "react-router-dom";
import type React from "react";
import { AppShell } from "../components/AppShell";
import { defaultAccessibilitySettings, loadAccessibilitySettings, saveAccessibilitySettings, type AccessibilitySettings, type ColorFilter } from "../services/accessibility";
import { useState } from "react";

export function AccessibilitySettingsScreen({ backTo, navItems }: { backTo: string; navItems: Parameters<typeof AppShell>[0]["navItems"] }) {
  const [settings, setSettings] = useState(loadAccessibilitySettings);
  function update(next: AccessibilitySettings) { setSettings(next); saveAccessibilitySettings(next); }
  function toggle(key: keyof Pick<AccessibilitySettings, "boldText" | "highContrast" | "reduceTransparency" | "readingMask" | "dyslexiaFont" | "reduceMotion" | "largerTouchTargets">) { update({ ...settings, [key]: !settings[key] }); }

  return <AppShell navItems={navItems}>
    <header className="screen-header flex items-center gap-3 pt-5"><Link aria-label="Volver al perfil" className="icon-button" to={backTo}><ArrowLeft className="h-5 w-5" /></Link><div><p className="section-kicker">Configuracion</p><h1 className="text-xl font-black text-ink">Accesibilidad</h1></div></header>
    <section className="mt-5 space-y-4 pb-3">
      <div className="rounded-lg bg-emergency-600 p-4 text-white"><div className="flex items-center gap-3"><Accessibility className="h-7 w-7" /><div><h2 className="font-black">Personaliza tu experiencia</h2><p className="mt-1 text-xs text-white/85">Lectura, contraste, movimiento y controles tactiles.</p></div></div></div>
      <SettingsGroup icon={<Type />} title="Pantalla y texto" description="Ajusta la lectura y el tamaño.">
        <RangeRow label="Tamano de texto" value={settings.textScale} min={0.9} max={1.25} step={0.05} onChange={(textScale) => update({ ...settings, textScale })} suffix="%" />
        <ToggleRow label="Texto en negrita" description="Refuerza etiquetas y contenido importante." checked={settings.boldText} onChange={() => toggle("boldText")} />
        <ToggleRow label="Objetivos tactiles grandes" description="Aumenta el area de botones y controles." checked={settings.largerTouchTargets} onChange={() => toggle("largerTouchTargets")} />
      </SettingsGroup>
      <SettingsGroup icon={<Contrast />} title="Color y contraste" description="Mejora la legibilidad visual.">
        <ToggleRow label="Alto contraste" description="Acentua texto, bordes y acciones." checked={settings.highContrast} onChange={() => toggle("highContrast")} />
        <ToggleRow label="Reducir transparencias" description="Usa superficies solidas." checked={settings.reduceTransparency} onChange={() => toggle("reduceTransparency")} />
        <label className="block text-sm font-bold text-ink">Filtro de color<select className="field-control" value={settings.colorFilter} onChange={(event) => update({ ...settings, colorFilter: event.target.value as ColorFilter })}><option value="none">Sin filtro</option><option value="grayscale">Escala de grises</option><option value="protanopia">Contraste rojo</option><option value="deuteranopia">Contraste verde</option><option value="tritanopia">Contraste azul</option></select></label>
      </SettingsGroup>
      <SettingsGroup icon={<Rows3 />} title="Lectura y enfoque" description="Reduce distracciones al leer.">
        <ToggleRow label="Mascara de lectura" description="Resalta una franja central de lectura." checked={settings.readingMask} onChange={() => toggle("readingMask")} />
        <ToggleRow label="Fuente amigable para dislexia" description="Aumenta espaciado entre letras y palabras." checked={settings.dyslexiaFont} onChange={() => toggle("dyslexiaFont")} />
        <RangeRow label="Interlineado" value={settings.lineSpacing} min={1} max={1.5} step={0.1} onChange={(lineSpacing) => update({ ...settings, lineSpacing })} suffix="%" />
      </SettingsGroup>
      <SettingsGroup icon={<Eye />} title="Movimiento" description="Evita efectos que puedan marear."><ToggleRow label="Reducir movimiento" description="Desactiva transiciones no esenciales." checked={settings.reduceMotion} onChange={() => toggle("reduceMotion")} /></SettingsGroup>
      <button className="btn-secondary" onClick={() => update(defaultAccessibilitySettings)} type="button"><Settings2 className="h-4 w-4" /> Restablecer preferencias</button>
    </section>
  </AppShell>;
}

function SettingsGroup({ children, description, icon, title }: { children: React.ReactNode; description: string; icon: React.ReactNode; title: string }) { return <section className="app-card overflow-hidden"><div className="flex items-center gap-3 border-b border-slate-100 p-3.5"><span className="grid h-9 w-9 place-items-center rounded-lg bg-emergency-50 text-emergency-600 [&>svg]:h-4 [&>svg]:w-4">{icon}</span><div><h2 className="text-sm font-black text-ink">{title}</h2><p className="mt-0.5 text-[11px] text-muted">{description}</p></div></div><div className="divide-y divide-slate-100">{children}</div></section>; }
function ToggleRow({ checked, description, label, onChange }: { checked: boolean; description: string; label: string; onChange: () => void }) { return <label className="flex min-h-16 cursor-pointer items-center justify-between gap-3 p-3.5"><span><span className="block text-sm font-bold text-ink">{label}</span><span className="mt-0.5 block text-[11px] leading-relaxed text-muted">{description}</span></span><input aria-label={label} checked={checked} className="accessibility-toggle" onChange={onChange} type="checkbox" /></label>; }
function RangeRow({ label, max, min, onChange, step, suffix, value }: { label: string; max: number; min: number; onChange: (value: number) => void; step: number; suffix: string; value: number }) { return <label className="block p-3.5 text-sm font-bold text-ink">{label}<span className="float-right text-emergency-700">{Math.round(value * 100)}{suffix}</span><input className="mt-3 w-full accent-red-600" max={max} min={min} onChange={(event) => onChange(Number(event.target.value))} step={step} type="range" value={value} /></label>; }
