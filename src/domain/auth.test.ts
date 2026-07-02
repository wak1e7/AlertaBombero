import { describe, expect, it } from "vitest";
import {
  buildTechnicalEmail,
  normalizePeruPhone,
  otpPurposeForFlow,
  validateCitizenRegistration,
  validateFirefighterLogin,
  validatePhoneLogin
} from "./auth";

describe("auth domain helpers", () => {
  it("normalizes Peru phone numbers and builds technical auth emails", () => {
    expect(normalizePeruPhone("999 888 777")).toBe("+51999888777");
    expect(normalizePeruPhone("+51 999 888 777")).toBe("+51999888777");
    expect(buildTechnicalEmail("+51999888777", "citizen")).toBe(
      "c-51999888777@ciudadano.alertabombero.app"
    );
    expect(buildTechnicalEmail("B-204", "firefighter")).toBe(
      "b-204@bombero.alertabombero.app"
    );
  });

  it("validates citizen registration inputs", () => {
    const result = validateCitizenRegistration({
      name: "Juan",
      lastName: "Perez",
      phone: "999888777",
      dni: "12345678",
      password: "seguro123"
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.phone).toBe("+51999888777");
    }
  });

  it("rejects weak or incomplete auth inputs", () => {
    expect(validatePhoneLogin({ phone: "123", password: "123" }).success).toBe(false);
    expect(validateFirefighterLogin({ firefighterCode: "", password: "123" }).success).toBe(false);
  });

  it("maps auth flows to simulated OTP purposes", () => {
    expect(otpPurposeForFlow("citizen-registration")).toBe("citizen_registration");
    expect(otpPurposeForFlow("citizen-login")).toBe("citizen_new_device");
    expect(otpPurposeForFlow("firefighter-login")).toBe("firefighter_login");
  });
});
