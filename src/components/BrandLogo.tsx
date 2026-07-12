import brandLogo from "../assets/alertabombero-logo.png";

export function BrandLogo({ large = false, withName = false }: { large?: boolean; withName?: boolean }) {
  const size = large ? "h-28 w-28" : "h-10 w-10";

  return (
    <div className="flex items-center gap-2.5">
      <span className={`grid shrink-0 place-items-center ${size}`}>
        <img alt="" className="h-full w-full object-contain drop-shadow-sm" src={brandLogo} />
      </span>
      {withName ? (
        <span className="leading-none">
          <span className={`block font-black tracking-[-0.02em] text-ink ${large ? "text-[2rem]" : "text-base"}`}>
            Alerta<span className="text-emergency-600">Bombero</span>
          </span>
          <span className={`mt-1 block font-medium text-muted ${large ? "text-xs" : "text-[9px]"}`}>Reportar emergencias en tiempo real</span>
        </span>
      ) : null}
    </div>
  );
}
