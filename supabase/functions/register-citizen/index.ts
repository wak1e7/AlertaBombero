import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  try {
    const body = await req.json();
    const name = stringField(body.name);
    const lastName = stringField(body.lastName);
    const phone = normalizePeruPhone(stringField(body.phone));
    const dni = stringField(body.dni);
    const password = stringField(body.password);

    if (!name || !lastName || !/^\d{8}$/.test(dni) || password.length < 6) {
      return json({ error: "Datos de registro invalidos." }, 400);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceRoleKey) {
      return json({ error: "Server auth configuration missing." }, 500);
    }

    const admin = createClient(supabaseUrl, serviceRoleKey);
    const email = buildTechnicalEmail(phone, "citizen");
    const existingProfile = await admin
      .from("profiles")
      .select("id")
      .or(`phone.eq.${phone},dni.eq.${dni}`)
      .maybeSingle();

    if (existingProfile.data) {
      return json({ error: "El telefono o DNI ya esta registrado." }, 409);
    }

    const createdUser = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });

    if (createdUser.error || !createdUser.data.user) {
      return json({ error: createdUser.error?.message ?? "No se pudo crear el usuario." }, 400);
    }

    const profile = await admin
      .from("profiles")
      .insert({
        auth_user_id: createdUser.data.user.id,
        role: "citizen",
        name,
        last_name: lastName,
        phone,
        dni,
        phone_verified: false,
        active: true
      })
      .select("id, role")
      .single();

    if (profile.error) {
      await admin.auth.admin.deleteUser(createdUser.data.user.id);
      return json({ error: profile.error.message }, 400);
    }

    return json({
      email,
      phone,
      profileId: profile.data.id,
      role: "citizen"
    });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Error inesperado." }, 400);
  }
});

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status
  });
}

function stringField(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizePeruPhone(value: string) {
  const digits = value.replace(/\D/g, "");
  if (/^9\d{8}$/.test(digits)) return `+51${digits}`;
  if (/^519\d{8}$/.test(digits)) return `+${digits}`;
  throw new Error("Ingresa un telefono peruano valido.");
}

function buildTechnicalEmail(identifier: string, role: "citizen" | "firefighter") {
  const cleanIdentifier =
    role === "citizen"
      ? `c-${identifier.replace(/\D/g, "")}`
      : identifier.trim().toLowerCase().replace(/\s+/g, "-");
  const domain = role === "citizen" ? "ciudadano" : "bombero";
  return `${cleanIdentifier}@${domain}.alertabombero.app`;
}
