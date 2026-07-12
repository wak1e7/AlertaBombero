export type ColorFilter = "none" | "grayscale" | "protanopia" | "deuteranopia" | "tritanopia";

export type AccessibilitySettings = {
  boldText: boolean;
  colorFilter: ColorFilter;
  dyslexiaFont: boolean;
  highContrast: boolean;
  largerTouchTargets: boolean;
  lineSpacing: number;
  readingMask: boolean;
  reduceMotion: boolean;
  reduceTransparency: boolean;
  textScale: number;
};

const STORAGE_KEY = "alertabombero.accessibility";

export const defaultAccessibilitySettings: AccessibilitySettings = {
  boldText: false,
  colorFilter: "none",
  dyslexiaFont: false,
  highContrast: false,
  largerTouchTargets: false,
  lineSpacing: 1,
  readingMask: false,
  reduceMotion: false,
  reduceTransparency: false,
  textScale: 1
};

export function loadAccessibilitySettings(): AccessibilitySettings {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? { ...defaultAccessibilitySettings, ...JSON.parse(saved) } : defaultAccessibilitySettings;
  } catch {
    return defaultAccessibilitySettings;
  }
}

export function saveAccessibilitySettings(settings: AccessibilitySettings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  window.dispatchEvent(new Event("alertabombero:accessibility"));
}
