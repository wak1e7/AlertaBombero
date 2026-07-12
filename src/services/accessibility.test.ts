import { afterEach, describe, expect, it } from "vitest";
import { defaultAccessibilitySettings, loadAccessibilitySettings, saveAccessibilitySettings } from "./accessibility";

describe("accessibility settings", () => {
  afterEach(() => localStorage.clear());

  it("uses defaults when no preference is stored", () => {
    expect(loadAccessibilitySettings()).toEqual(defaultAccessibilitySettings);
  });

  it("persists custom preferences", () => {
    saveAccessibilitySettings({ ...defaultAccessibilitySettings, highContrast: true, textScale: 1.2 });
    expect(loadAccessibilitySettings()).toMatchObject({ highContrast: true, textScale: 1.2 });
  });
});
