import type { OtpPurpose } from "./auth";

export type SimulatedOtpChallenge = {
  code: string;
  expiresAt: number;
  purpose: OtpPurpose;
  userIdentifier: string;
};

export type OtpVerificationResult =
  | { ok: true }
  | { ok: false; reason: "expired" | "invalid" | "missing" };

export const DEMO_OTP_CODE = "116116";

export function createSimulatedOtpChallenge(
  purpose: OtpPurpose,
  userIdentifier: string,
  ttlMs = 5 * 60 * 1000,
  now = Date.now()
): SimulatedOtpChallenge {
  return {
    code: DEMO_OTP_CODE,
    expiresAt: now + ttlMs,
    purpose,
    userIdentifier
  };
}

export function verifySimulatedOtp(
  challenge: SimulatedOtpChallenge | null,
  code: string,
  now = Date.now()
): OtpVerificationResult {
  if (!challenge) {
    return { ok: false, reason: "missing" };
  }

  if (now > challenge.expiresAt) {
    return { ok: false, reason: "expired" };
  }

  if (code.trim() !== challenge.code) {
    return { ok: false, reason: "invalid" };
  }

  return { ok: true };
}
