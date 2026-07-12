import { AiIcon, type AiIconName } from "./AiIcon";

const icons: Record<string, AiIconName> = { accidente: "accident", incendio: "fire", rescate: "rescue", medico: "medical" };

export function ReportTypeIcon({ type, size = "default" }: { type: string; size?: "small" | "default" }) {
  const normalized = type.toLowerCase();
  const icon = Object.entries(icons).find(([key]) => normalized.includes(key))?.[1] ?? "siren";
  const container = size === "small" ? "h-9 w-9" : "h-11 w-11";
  const iconSize = size === "small" ? "h-7 w-7" : "h-9 w-9";

  return (
    <span className={`grid shrink-0 place-items-center rounded-lg bg-emergency-50 text-emergency-600 ${container}`} aria-hidden="true">
      <AiIcon className={iconSize} name={icon} />
    </span>
  );
}
