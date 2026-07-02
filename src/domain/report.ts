export const EVIDENCE_MAX_BYTES = 20 * 1024 * 1024;

export const emergencyTypes = [
  { label: "Incendio", value: "INCENDIO" },
  { label: "Accidente", value: "ACCIDENTE" },
  { label: "Rescate", value: "RESCATE" },
  { label: "Emergencia medica", value: "EMERGENCIA_MEDICA" },
  { label: "Otro", value: "OTRO" }
] as const;

export type EmergencyType = (typeof emergencyTypes)[number]["value"];

export type ReportLocation = {
  addressText: string;
  latitude: number;
  longitude: number;
};

export type EvidenceLike = {
  name: string;
  size: number;
  type: string;
};

export type ReportDraft = {
  description: string;
  evidence: EvidenceLike | null;
  location: ReportLocation | null;
  type: string;
};

export function validateReportDraft(draft: ReportDraft): { errors: string[]; ok: boolean } {
  const errors: string[] = [];

  if (!draft.type) errors.push("Selecciona el tipo de emergencia.");
  if (!draft.location || !Number.isFinite(draft.location.latitude) || !Number.isFinite(draft.location.longitude)) {
    errors.push("Confirma tu ubicacion.");
  }
  if (!draft.evidence) {
    errors.push("Adjunta una evidencia.");
  } else if (!isAllowedEvidenceFile(draft.evidence)) {
    errors.push("La evidencia debe ser imagen o video y pesar maximo 20 MB.");
  }

  return { errors, ok: errors.length === 0 };
}

export function isAllowedEvidenceFile(file: EvidenceLike): boolean {
  const allowedType = file.type.startsWith("image/") || file.type.startsWith("video/");
  return allowedType && file.size > 0 && file.size <= EVIDENCE_MAX_BYTES;
}

export function buildReportStoragePath(reportId: string, file: EvidenceLike, timestamp = Date.now()): string {
  const extension = file.name.includes(".") ? file.name.split(".").pop()?.toLowerCase() : "";
  const baseName = file.name.replace(/\.[^.]+$/, "");
  const safeBaseName =
    baseName
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "evidencia";

  return `${reportId}/${timestamp}-${safeBaseName}${extension ? `.${extension}` : ""}`;
}

export function buildCountdownValues(seconds: number): number[] {
  return Array.from({ length: Math.max(0, seconds) }, (_, index) => seconds - index);
}
