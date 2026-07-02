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
    const firefighterCode = stringField(body.firefighterCode).toUpperCase();
    const password = stringField(body.password);

    if (!firefighterCode || password.length < 6) {
      return json({ error: "Datos de bombero invalidos." }, 400);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceRoleKey) {
      return json({ error: "Server auth configuration missing." }, 500);
    }

    const admin = createClient(supabaseUrl, serviceRoleKey);
    const profile = await admin
      .from("profiles")
      .select("id, auth_user_id, role, active")
      .eq("firefighter_code", firefighterCode)
      .maybeSingle();

    if (profile.error || !profile.data || profile.data.role !== "firefighter" || !profile.data.active) {
      return json({ error: "Bombero precargado no encontrado." }, 404);
    }

    if (profile.data.auth_user_id) {
      return json({ error: "La cuenta del bombero ya fue provisionada." }, 409);
    }

    const email = buildTechnicalEmail(firefighterCode);
    const createdUser = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });

    if (createdUser.error || !createdUser.data.user) {
      return json({ error: createdUser.error?.message ?? "No se pudo crear el usuario." }, 400);
    }

    const linked = await admin
      .from("profiles")
      .update({ auth_user_id: createdUser.data.user.id })
      .eq("id", profile.data.id)
      .select("id, role")
      .single();

    if (linked.error) {
      await admin.auth.admin.deleteUser(createdUser.data.user.id);
      return json({ error: linked.error.message }, 400);
    }

    return json({
      email,
      profileId: linked.data.id,
      role: "firefighter"
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

function buildTechnicalEmail(identifier: string) {
  return `${identifier.trim().toLowerCase().replace(/\s+/g, "-")}@bombero.alertabombero.app`;
}
