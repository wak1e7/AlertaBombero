import { Siren } from "lucide-react";

export function EmergencyButton({ onClick }: { onClick?: () => void }) {
  return (
    <button
      aria-label="Reportar emergencia"
      className="grid h-48 w-48 place-items-center rounded-full border-[10px] border-emergency-100 bg-emergency-600 text-white shadow-[0_16px_32px_rgba(221,23,20,0.3)] transition duration-150 hover:bg-emergency-700 active:scale-95"
      onClick={onClick}
      type="button"
    >
      <span className="grid place-items-center gap-2 text-center">
        <Siren className="h-12 w-12" />
        <span className="text-[15px] font-black leading-tight">
          REPORTAR
          <br />
          EMERGENCIA
        </span>
      </span>
    </button>
  );
}
