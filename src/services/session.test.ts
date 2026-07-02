import { beforeEach, describe, expect, it } from "vitest";
import {
  clearLocalSessionState,
  getActiveSessionId,
  getPendingAuth,
  saveActiveSessionId,
  savePendingAuth
} from "./session";

describe("session storage helpers", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it("clears active and pending session state before logout", () => {
    saveActiveSessionId("session-1");
    savePendingAuth({
      expiresAt: Date.now() + 1000,
      profileId: "profile-1",
      purpose: "citizen_new_device",
      role: "citizen",
      userIdentifier: "+51999888777",
      welcomePath: "/ciudadano/bienvenida"
    });

    clearLocalSessionState();

    expect(getActiveSessionId()).toBeNull();
    expect(getPendingAuth()).toBeNull();
  });
});
