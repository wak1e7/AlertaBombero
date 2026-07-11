import { Flame, ShieldAlert } from "lucide-react";

export function BrandLogo({ large = false, withName = false }: { large?: boolean; withName?: boolean }) {
  const size = large ? "h-20 w-20" : "h-10 w-10";

  return (
    <div className="flex items-center gap-2.5">
      <span className={`relative grid shrink-0 place-items-center ${size} text-emergency-600`} aria-hidden="true">
        <ShieldAlert className="absolute inset-0 h-full w-full fill-emergency-50 stroke-[2.2]" />
        <Flame className={large ? "h-8 w-8 fill-emergency-600 text-white" : "h-4 w-4 fill-emergency-600 text-white"} />
      </span>
      {withName ? (
        <span className="leading-none">
          <span className="block text-base font-black text-ink">
            Alerta<span className="text-emergency-600">Bombero</span>
          </span>
          <span className="mt-1 block text-[9px] font-medium text-muted">Reportar emergencias en tiempo real</span>
        </span>
      ) : null}
    </div>
  );
}
