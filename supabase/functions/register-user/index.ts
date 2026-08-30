import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Admin client — uses the service_role key, bypasses RLS and the public
// signup rate limit entirely. This code only ever runs server-side.
const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function toAuthEmail(userId: string): string {
  return `${userId.toLowerCase()}@jamui.local`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const {
      user_id,
      password,
      full_name,
      role,
      block_id,
      panchayat_id,
      village_id,
      latitude,
      longitude,
    } = body;

    if (!user_id || !password || !full_name || !role || !block_id) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const email = toAuthEmail(user_id);

    // Create the auth user directly via Admin API.
    // email_confirm: true marks it confirmed immediately — no email is sent.
    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (createError) {
      const status = createError.message.toLowerCase().includes("already registered") ? 409 : 400;
      const message = status === 409 ? "This User ID is already registered" : createError.message;
      return new Response(JSON.stringify({ error: message }), {
        status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authUser = created.user;
    if (!authUser) {
      return new Response(JSON.stringify({ error: "User creation failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // VERIFIER_OF mapping, mirrored from src/lib/types.ts
    const VERIFIER_OF: Record<string, string | null> = {
      FARMER: "VILLAGE_ADMIN",
      EQUIPMENT_OWNER: "VILLAGE_ADMIN",
      OPERATOR: "VILLAGE_ADMIN",
      VILLAGE_ADMIN: "BLOCK_ADMIN",
      BLOCK_ADMIN: "DISTRICT_ADMIN",
      DISTRICT_ADMIN: null,
    };

    const { data: profileRow, error: profileError } = await admin
      .from("profiles")
      .insert({
        id: authUser.id,
        user_id,
        full_name,
        role,
        account_status: "PENDING_APPROVAL",
        block_id,
        panchayat_id: panchayat_id ?? null,
        village_id: village_id ?? null,
        latitude: latitude ?? null,
        longitude: longitude ?? null,
        verifier_role: VERIFIER_OF[role] ?? null,
      })
      .select()
      .single();

    if (profileError) {
      // Roll back the auth user so retries don't collide with a half-created account.
      await admin.auth.admin.deleteUser(authUser.id);
      return new Response(JSON.stringify({ error: profileError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate a real session for this user so the frontend can log them in
    // immediately, exactly like a normal signInWithPassword() would.
    const { data: signInData, error: signInError } = await admin.auth.signInWithPassword({
      email,
      password,
    });

    return new Response(
      JSON.stringify({
        user: profileRow,
        token: signInData?.session?.access_token ?? "",
        session: signInData?.session ?? null,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});