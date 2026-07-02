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

type AuthStartResult = {
  nextStep: "otp";
  profileId: string;
  role: "citizen" | "firefighter";
  otp: SimulatedOtpChallenge;
  welcomePath: string;
};

export function createAuthService(client: AuthClient) {
  return {
    async registerCitizen(input: CitizenRegistrationInput): Promise<AuthStartResult> {
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
        .select("id, role, phone, active")
        .eq("phone", data.phone)
        .maybeSingle();

      if (profileError) throw profileError;
      if (!profile || profile.role !== "citizen" || !profile.active) {
        throw new Error("No encontramos una cuenta ciudadana activa.");
      }

      return {
        nextStep: "otp",
        profileId: profile.id,
        role: "citizen",
        otp: createSimulatedOtpChallenge(otpPurposeForFlow("citizen-login"), data.phone),
        welcomePath: "/ciudadano/bienvenida"
      };
    },

    async loginFirefighter(input: FirefighterLoginInput): Promise<AuthStartResult> {
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

      if (authError) {
        const { error: provisionError } = await invokeFunction(client, "provision-firefighter", {
          firefighterCode: code,
          password: data.password
        });

        if (provisionError) throw authError;

        const retry = await client.auth.signInWithPassword({
          email,
          password: data.password
        });

        if (retry.error) throw retry.error;
      }

      const { data: profile, error: profileError } = await rpc(client, "link_firefighter_profile", {
        target_firefighter_code: code
      });

      if (profileError) throw profileError;
      if (!profile || profile.role !== "firefighter" || !profile.active) {
        throw new Error("No encontramos un bombero activo con ese codigo.");
      }

      return {
        nextStep: "otp",
        profileId: profile.id,
        role: "firefighter",
        otp: createSimulatedOtpChallenge(otpPurposeForFlow("firefighter-login"), code),
        welcomePath: "/bombero/bienvenida"
      };
    },

    async markPhoneVerified(profileId: string, activeSessionId: string) {
      const { error } = await rpc(client, "complete_demo_otp", {
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
