import { Ambulance, CarFront, Flame, MoreHorizontal, PersonStanding, type LucideIcon } from "lucide-react";

const icons: Record<string, LucideIcon> = {
  accidente: CarFront,
  incendio: Flame,
  rescate: PersonStanding,
  medico: Ambulance
};

export function ReportTypeIcon({ type, size = "default" }: { type: string; size?: "small" | "default" }) {
  const normalized = type.toLowerCase();
  const Icon = Object.entries(icons).find(([key]) => normalized.includes(key))?.[1] ?? MoreHorizontal;
  const container = size === "small" ? "h-9 w-9" : "h-11 w-11";
  const icon = size === "small" ? "h-4 w-4" : "h-5 w-5";

  return (
    <span className={`grid shrink-0 place-items-center rounded-lg bg-emergency-50 text-emergency-600 ${container}`} aria-hidden="true">
      <Icon className={icon} />
    </span>
  );
}
