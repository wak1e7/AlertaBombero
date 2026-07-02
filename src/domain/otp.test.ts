import { describe, expect, it } from "vitest";
import { createSimulatedOtpChallenge, verifySimulatedOtp } from "./otp";

describe("simulated OTP", () => {
  it("creates deterministic demo OTP challenges", () => {
    expect(createSimulatedOtpChallenge("citizen_registration", "+51999888777")).toEqual({
      code: "116116",
      expiresAt: expect.any(Number),
      purpose: "citizen_registration",
      userIdentifier: "+51999888777"
    });
  });

  it("accepts matching unexpired codes and rejects invalid codes", () => {
    const challenge = createSimulatedOtpChallenge("firefighter_login", "B-204", 60_000, 1_000);

    expect(verifySimulatedOtp(challenge, "116116", 2_000)).toEqual({ ok: true });
    expect(verifySimulatedOtp(challenge, "000000", 2_000)).toEqual({
      ok: false,
      reason: "invalid"
    });
    expect(verifySimulatedOtp(challenge, "116116", 62_000)).toEqual({
      ok: false,
      reason: "expired"
    });
  });
});
