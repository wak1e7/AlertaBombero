import { Flame, HardHat, MapPin, ShieldAlert } from "lucide-react";

export function BrandLogo({ large = false, withName = false }: { large?: boolean; withName?: boolean }) {
  const size = large ? "h-28 w-28" : "h-10 w-10";

  return (
    <div className="flex items-center gap-2.5">
      <span className={`relative grid shrink-0 place-items-center ${size} text-emergency-600`} aria-hidden="true">
        <ShieldAlert className="absolute inset-0 h-full w-full fill-white stroke-[2.1] drop-shadow-sm" />
        <ShieldAlert className="absolute h-[78%] w-[78%] fill-amber-300 stroke-amber-400" />
        <HardHat className={large ? "relative z-10 h-[4.4rem] w-[4.4rem] fill-emergency-600 text-white stroke-[1.8]" : "relative z-10 h-6 w-6 fill-emergency-600 text-white stroke-[1.8]"} />
        <MapPin className={large ? "absolute z-20 bottom-[16%] h-9 w-9 fill-white text-emergency-600 stroke-[2.5]" : "absolute z-20 bottom-[12%] h-3.5 w-3.5 fill-white text-emergency-600 stroke-[2.5]"} />
        {large ? <Flame className="absolute z-30 bottom-[21%] h-4 w-4 fill-emergency-600 text-emergency-600" /> : null}
      </span>
      {withName ? (
        <span className="leading-none">
          <span className="block text-base font-black tracking-[-0.02em] text-ink">
            Alerta<span className="text-emergency-600">Bombero</span>
          </span>
          <span className="mt-1 block text-[9px] font-medium text-muted">Reportar emergencias en tiempo real</span>
        </span>
      ) : null}
    </div>
  );
}
