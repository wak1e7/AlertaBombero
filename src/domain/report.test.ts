import { describe, expect, it } from "vitest";
import {
  EVIDENCE_MAX_BYTES,
  buildCountdownValues,
  buildReportStoragePath,
  isAllowedEvidenceFile,
  validateReportDraft
} from "./report";

const validFile = {
  name: "foto emergencia.jpg",
  size: 1024,
  type: "image/jpeg"
};

describe("report domain", () => {
  it("requires type, location, and evidence before sending", () => {
    const result = validateReportDraft({
      description: "",
      evidence: null,
      location: null,
      type: ""
    });

    expect(result.ok).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining(["Selecciona el tipo de emergencia.", "Confirma tu ubicacion.", "Adjunta una evidencia."])
    );
  });

  it("accepts an image or video evidence within the size limit", () => {
    expect(isAllowedEvidenceFile(validFile)).toBe(true);
    expect(isAllowedEvidenceFile({ ...validFile, type: "video/mp4" })).toBe(true);
  });

  it("rejects unsupported or oversized evidence", () => {
    expect(isAllowedEvidenceFile({ ...validFile, type: "application/pdf" })).toBe(false);
    expect(isAllowedEvidenceFile({ ...validFile, size: EVIDENCE_MAX_BYTES + 1 })).toBe(false);
  });

  it("builds a sanitized storage path scoped by report id", () => {
    expect(buildReportStoragePath("report-123", { ...validFile, name: "foto #1.JPG" }, 1700000000000)).toBe(
      "report-123/1700000000000-foto-1.jpg"
    );
  });

  it("builds countdown values that finish at one second", () => {
    expect(buildCountdownValues(5)).toEqual([5, 4, 3, 2, 1]);
  });
});
