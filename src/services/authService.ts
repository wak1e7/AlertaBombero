import {
  buildTechnicalEmail,
  otpPurposeForFlow,
  validateCitizenRegistration,
  validateFirefighterLogin,
  validatePhoneLogin,
  type CitizenRegistrationInput,
  type FirefighterLoginInput,
  type PhoneLoginInput
} from "../domain/auth";
import { createSimulatedOtpChallenge, type SimulatedOtpChallenge } from "../domain/otp";
import type { AuthMode } from "../lib/env";

type QueryResult<T = any> = PromiseLike<{ data: T; error: any }>;

type AuthClient = {
  auth: {
    signUp(args: { email: string; password: string }): QueryResult<{ user?: { id?: string } | null }>;
    signInWithPassword(args: { email: string; password: string }): QueryResult;
    signOut(): PromiseLike<{ error: any }>;
  };
  functions?: {
    invoke(fn: string, args: { body: Record<string, unknown> }): QueryResult;
  };
  from(table: string): any;
  rpc?(fn: string, args: Record<string, unknown>): QueryResult;
};

type AuthStartBase = {
  profileId: string;
  role: "citizen" | "firefighter";
  welcomePath: string;
};

type OtpStartResult = AuthStartBase & { nextStep: "otp"; otp: SimulatedOtpChallenge };
type SessionResumeResult = AuthStartBase & { nextStep: "welcome"; otp?: never };
type AuthStartResult = OtpStartResult | SessionResumeResult;

type AuthServiceOptions = {
  authMode?: AuthMode;
};

export function createAuthService(client: AuthClient, options: AuthServiceOptions = {}) {
  const authMode = options.authMode ?? "demo";

  return {
    async registerCitizen(input: CitizenRegistrationInput): Promise<OtpStartResult> {
      ensureDemoAuthMode(authMode);

      const parsed = validateCitizenRegistration(input);
      if (!parsed.success) {
        throw new Error(parsed.error.issues[0]?.message ?? "Datos de registro invalidos.");
      }

      const data = parsed.data;
      const { data: registered, error: registerError } = await invokeFunction(client, "register-citizen", {
        name: data.name,
        lastName: data.lastName,
        phone: data.phone,
        dni: data.dni,
        password: data.password
      });

      if (registerError) throw registerError;
      if (!registered?.email || !registered?.profileId) {
        throw new Error("No se pudo crear el registro ciudadano.");
      }

      const { error: authError } = await client.auth.signInWithPassword({
        email: registered.email,
        password: data.password
      });

      if (authError) throw authError;

      return {
        nextStep: "otp",
        profileId: registered.profileId,
        role: "citizen",
        otp: createSimulatedOtpChallenge(otpPurposeForFlow("citizen-registration"), data.phone),
        welcomePath: "/ciudadano/bienvenida"
      };
    },

    async loginCitizen(input: PhoneLoginInput): Promise<AuthStartResult> {
      ensureDemoAuthMode(authMode);

      const parsed = validatePhoneLogin(input);
      if (!parsed.success) {
        throw new Error(parsed.error.issues[0]?.message ?? "Datos de inicio invalidos.");
      }

      const data = parsed.data;
      const email = buildTechnicalEmail(data.phone, "citizen");
      const { error: authError } = await client.auth.signInWithPassword({
        email,
        password: data.password
      });

      if (authError) throw authError;

      const { data: profile, error: profileError } = await client
        .from("profiles")
        .select("id, role, phone, active, phone_verified")
        .eq("phone", data.phone)
        .maybeSingle();

      if (profileError) throw profileError;
      if (!profile || profile.role !== "citizen" || !profile.active) {
        throw new Error("No encontramos una cuenta ciudadana activa.");
      }

      if (profile.phone_verified) {
        return { nextStep: "welcome", profileId: profile.id, role: "citizen", welcomePath: "/ciudadano/bienvenida" };
      }

      return { nextStep: "otp", profileId: profile.id, role: "citizen", otp: createSimulatedOtpChallenge(otpPurposeForFlow("citizen-login"), data.phone), welcomePath: "/ciudadano/bienvenida" };
    },

    async loginFirefighter(input: FirefighterLoginInput): Promise<AuthStartResult> {
      ensureDemoAuthMode(authMode);

      const parsed = validateFirefighterLogin(input);
      if (!parsed.success) {
        throw new Error(parsed.error.issues[0]?.message ?? "Datos de inicio invalidos.");
      }

      const data = parsed.data;
      const code = data.firefighterCode.trim().toUpperCase();
      const email = buildTechnicalEmail(code, "firefighter");
      const { error: authError } = await client.auth.signInWithPassword({
        email,
        password: data.password
      });

      if (authError) throw authError;

      const { data: profile, error: profileError } = await client
        .from("profiles")
        .select("id, role, firefighter_code, active, phone_verified")
        .eq("firefighter_code", code)
        .maybeSingle();

      if (profileError) throw profileError;
      if (!profile || profile.role !== "firefighter" || !profile.active) {
        throw new Error("No encontramos un bombero activo con ese codigo.");
      }

      if (profile.phone_verified) {
        return { nextStep: "welcome", profileId: profile.id, role: "firefighter", welcomePath: "/bombero/bienvenida" };
      }

      return { nextStep: "otp", profileId: profile.id, role: "firefighter", otp: createSimulatedOtpChallenge(otpPurposeForFlow("firefighter-login"), code), welcomePath: "/bombero/bienvenida" };
    },

    async markPhoneVerified(profileId: string, activeSessionId: string) {
      ensureDemoAuthMode(authMode);

      const { error } = await rpc(client, "complete_demo_otp", {
        target_profile_id: profileId,
        target_active_session_id: activeSessionId
      });

      if (error) throw error;
    },

    async resumeVerifiedSession(profileId: string, activeSessionId: string) {
      ensureDemoAuthMode(authMode);
      const { error } = await rpc(client, "resume_verified_demo_session", {
        target_profile_id: profileId,
        target_active_session_id: activeSessionId
      });
      if (error) throw error;
    },

    async signOut() {
      const { error } = await client.auth.signOut();
      if (error) throw error;
    }
  };
}

function ensureDemoAuthMode(authMode: AuthMode) {
  if (authMode !== "demo") {
    throw new Error("Autenticacion productiva aun no esta configurada.");
  }
}

function rpc(client: AuthClient, name: string, args: Record<string, unknown>) {
  if (!client.rpc) {
    throw new Error("Supabase RPC client is not available.");
  }

  return client.rpc(name, args);
}

function invokeFunction(client: AuthClient, name: string, body: Record<string, unknown>) {
  if (!client.functions) {
    throw new Error("Supabase Functions client is not available.");
  }

  return client.functions.invoke(name, { body });
}
