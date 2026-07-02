const ACTIVE_SESSION_KEY = "alertabombero.activeSessionId";
const PENDING_AUTH_KEY = "alertabombero.pendingAuth";

export type PendingAuth = {
  expiresAt: number;
  profileId: string;
  purpose: "citizen_registration" | "citizen_new_device" | "firefighter_login";
  role: "citizen" | "firefighter";
  userIdentifier: string;
  welcomePath: string;
};

export function createActiveSessionId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `session-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function saveActiveSessionId(sessionId: string) {
  localStorage.setItem(ACTIVE_SESSION_KEY, sessionId);
}

export function getActiveSessionId() {
  return localStorage.getItem(ACTIVE_SESSION_KEY);
}

export function clearActiveSessionId() {
  localStorage.removeItem(ACTIVE_SESSION_KEY);
}

export function savePendingAuth(pending: PendingAuth) {
  sessionStorage.setItem(PENDING_AUTH_KEY, JSON.stringify(pending));
}

export function getPendingAuth(): PendingAuth | null {
  const raw = sessionStorage.getItem(PENDING_AUTH_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as PendingAuth;
  } catch {
    return null;
  }
}

export function clearPendingAuth() {
  sessionStorage.removeItem(PENDING_AUTH_KEY);
}
