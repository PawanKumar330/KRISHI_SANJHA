import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function toAuthEmail(userId: string): string {
  return `${userId.toLowerCase()}@jamui.local`;
}

const VERIFIER_OF: Record<string, string | null> = {
  FARMER: "VILLAGE_ADMIN",
  EQUIPMENT_OWNER: "VILLAGE_ADMIN",
  OPERATOR: "VILLAGE_ADMIN",
  VILLAGE_ADMIN: "BLOCK_ADMIN",
  BLOCK_ADMIN: "DISTRICT_ADMIN",
  DISTRICT_ADMIN: null,
};

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
      phone,
      father_name,
      aadhaar_last4,
      equipment,
      operator,
    } = body;

    if (!user_id || !password || !full_name || !role || !block_id || !phone) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const email = toAuthEmail(user_id);

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
        phone,
        father_name: father_name || null,
        aadhaar_last4: aadhaar_last4 || null,
      })
      .select()
      .single();

    if (profileError) {
      await admin.auth.admin.deleteUser(authUser.id);
      return new Response(JSON.stringify({ error: profileError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Role-specific rows. If either of these fails, we don't roll back the
    // whole registration (the profile itself is valid) — we just report the
    // partial failure so the frontend can inform the user, since they can
    // always add/edit equipment or operator details later from their profile.
    let roleDataWarning: string | null = null;

    if (role === "EQUIPMENT_OWNER" && equipment) {
      // A CHC enterprise row is required as the parent for equipment listings
      // per the schema. Auto-create a minimal one using the owner's own name
      // if they haven't set up a formal business yet — they can rename it later.
      const { data: chc, error: chcError } = await admin
        .from("chc_enterprises")
        .insert({
          owner_id: authUser.id,
          business_name: `${full_name}'s Equipment`,
          verification_status: "PENDING_APPROVAL",
        })
        .select()
        .single();

      if (chcError) {
        roleDataWarning = `Profile created, but equipment setup failed: ${chcError.message}`;
      } else {
        const { error: eqError } = await admin.from("equipment").insert({
          owner_id: authUser.id,
          chc_id: chc.id,
          category: equipment.category,
          sub_category: equipment.sub_category || null,
          make_model: equipment.make_model,
          hp_rating: equipment.hp_rating ?? null,
          fuel_type: equipment.fuel_type || null,
          reg_number: equipment.reg_number || null,
          hourly_rate: equipment.hourly_rate ?? null,
          acre_rate: equipment.acre_rate ?? null,
          implements: equipment.implements ?? [],
          transport_available: equipment.transport_available ?? false,
          has_insurance: equipment.has_insurance ?? false,
          is_active: false, // stays inactive until the profile itself is approved
        });
        if (eqError) {
          roleDataWarning = `Profile created, but equipment setup failed: ${eqError.message}`;
        }
      }
    }

    if (role === "OPERATOR" && operator) {
      const { error: opError } = await admin.from("operator_profiles").insert({
        user_id: authUser.id,
        driving_license_no: operator.driving_license_no,
        experience_years: operator.experience_years,
        preferred_equipment_types: operator.preferred_equipment_types,
        daily_wage: operator.daily_wage,
        verification_status: "PENDING_APPROVAL",
      });
      if (opError) {
        roleDataWarning = `Profile created, but operator setup failed: ${opError.message}`;
      }
    }

    const { data: signInData } = await admin.auth.signInWithPassword({ email, password });

    return new Response(
      JSON.stringify({
        user: profileRow,
        token: signInData?.session?.access_token ?? "",
        session: signInData?.session ?? null,
        warning: roleDataWarning,
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