import { Siren } from "lucide-react";

export function EmergencyButton() {
  return (
    <button className="grid h-44 w-44 place-items-center rounded-full bg-emergency-600 text-white shadow-[0_20px_60px_rgba(214,40,40,0.36)] outline outline-8 outline-emergency-100 transition active:scale-95">
      <span className="grid place-items-center gap-2 text-center">
        <Siren className="h-11 w-11" />
        <span className="text-base font-black leading-tight">
          REPORTAR
          <br />
          EMERGENCIA
        </span>
      </span>
    </button>
  );
}
