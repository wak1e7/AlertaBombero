import { z } from "zod";

export type AppRole = "citizen" | "firefighter";
export type AuthFlow = "citizen-registration" | "citizen-login" | "firefighter-login";
export type OtpPurpose = "citizen_registration" | "citizen_new_device" | "firefighter_login";

const passwordSchema = z.string().min(6, "La contrasena debe tener al menos 6 caracteres.");

const phoneSchema = z
  .string()
  .min(1, "Ingresa tu telefono.")
  .transform((value, context) => {
    try {
      return normalizePeruPhone(value);
    } catch {
      context.addIssue({
        code: "custom",
        message: "Ingresa un telefono peruano valido."
      });
      return z.NEVER;
    }
  });

export const citizenRegistrationSchema = z.object({
  name: z.string().trim().min(2, "Ingresa tus nombres."),
  lastName: z.string().trim().min(2, "Ingresa tus apellidos."),
  phone: phoneSchema,
  dni: z.string().trim().regex(/^\d{8}$/, "El DNI debe tener 8 digitos."),
  password: passwordSchema
});

export const phoneLoginSchema = z.object({
  phone: phoneSchema,
  password: passwordSchema
});

export const firefighterLoginSchema = z.object({
  firefighterCode: z.string().trim().min(2, "Ingresa tu codigo de bombero."),
  password: passwordSchema
});

export type CitizenRegistrationInput = z.input<typeof citizenRegistrationSchema>;
export type CitizenRegistration = z.output<typeof citizenRegistrationSchema>;
export type PhoneLoginInput = z.input<typeof phoneLoginSchema>;
export type PhoneLogin = z.output<typeof phoneLoginSchema>;
export type FirefighterLoginInput = z.input<typeof firefighterLoginSchema>;
export type FirefighterLogin = z.output<typeof firefighterLoginSchema>;

export function normalizePeruPhone(value: string) {
  const digits = value.replace(/\D/g, "");

  if (/^9\d{8}$/.test(digits)) {
    return `+51${digits}`;
  }

  if (/^519\d{8}$/.test(digits)) {
    return `+${digits}`;
  }

  throw new Error("Invalid Peru phone number");
}

export function buildTechnicalEmail(identifier: string, role: AppRole) {
  const cleanIdentifier =
    role === "citizen"
      ? `c-${identifier.replace(/\D/g, "")}`
      : identifier.trim().toLowerCase().replace(/\s+/g, "-");
  const domain = role === "citizen" ? "ciudadano" : "bombero";

  return `${cleanIdentifier}@${domain}.alertabombero.app`;
}

export function otpPurposeForFlow(flow: AuthFlow): OtpPurpose {
  const purposes: Record<AuthFlow, OtpPurpose> = {
    "citizen-registration": "citizen_registration",
    "citizen-login": "citizen_new_device",
    "firefighter-login": "firefighter_login"
  };

  return purposes[flow];
}

export function validateCitizenRegistration(input: CitizenRegistrationInput) {
  return citizenRegistrationSchema.safeParse(input);
}

export function validatePhoneLogin(input: PhoneLoginInput) {
  return phoneLoginSchema.safeParse(input);
}

export function validateFirefighterLogin(input: FirefighterLoginInput) {
  return firefighterLoginSchema.safeParse(input);
}
