import "jsr:@supabase/functions-js/edge-runtime.d.ts";

Deno.serve((req) => {
  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  return json({ error: "El autoaprovisionamiento de bomberos esta deshabilitado." }, 410);
});

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    headers: { "Content-Type": "application/json" },
    status
  });
}
