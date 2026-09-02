import { supabase } from "./supabase";
import { getMockBackend, persistMockBackend, ApiError, type RegisterInput } from "./mock-backend";
import type { AppUser, AuthResponse, Block, LandPlot, Machine, NearbyOwner, Panchayat, Village } from "./types";

/**
 * True when no Supabase project is configured — falls back to the
 * in-memory mock backend (useful for local preview / tests without
 * hitting a real database).
 */
export const OFFLINE_MODE = !import.meta.env["VITE_SUPABASE_URL"];

/**
 * Bearer-token helpers. Only used by the offline mock backend, which has
 * no real session mechanism of its own. In online mode, Supabase Auth
 * manages the session internally and these are not used.
 */
export const TOKEN_KEY = "jamui.token";

export function readToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY) ?? window.sessionStorage.getItem(TOKEN_KEY);
}

export function writeToken(token: string, remember: boolean) {
  if (typeof window === "undefined") return;
  clearToken();
  (remember ? window.localStorage : window.sessionStorage).setItem(TOKEN_KEY, token);
}

export function clearToken() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(TOKEN_KEY);
  window.sessionStorage.removeItem(TOKEN_KEY);
}

/** Internal email Supabase Auth uses under the hood. Never shown to the user. */
function toAuthEmail(userId: string): string {
  return `${userId.toLowerCase()}@jamui.local`;
}

/** Small latency so loading states are visible in offline mode. */
const tick = <T,>(value: T): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(value), 180));

function mockCall<T>(fn: (m: ReturnType<typeof getMockBackend>) => T): Promise<T> {
  try {
    const result = fn(getMockBackend());
    persistMockBackend();
    return tick(result);
  } catch (err) {
    return Promise.reject(err);
  }
}

/** Maps a Supabase `profiles` row back into the app's AppUser shape. */
function rowToAppUser(row: any): AppUser {
  return {
    id: row.id,
    user_id: row.user_id,
    full_name: row.full_name,
    role: row.role,
    account_status: row.account_status,
    block_id: row.block_id,
    panchayat_id: row.panchayat_id,
    village_id: row.village_id,
    latitude: row.latitude,
    longitude: row.longitude,
    phone: row.phone,
    father_name: row.father_name,
    aadhaar_last4: row.aadhaar_last4,
    submitted_at: row.submitted_at,
    reviewed_at: row.reviewed_at,
    rejection_reason: row.rejection_reason,
    verifier_role: row.verifier_role,
  };
}

async function currentSessionUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new ApiError(401, "Please sign in again");
  return data.user.id;
}

async function fetchProfile(authUserId: string): Promise<AppUser> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", authUserId)
    .single();
  if (error || !data) throw new ApiError(404, "Profile not found");
  return rowToAppUser(data);
}

export const api = {
  blocks: async (): Promise<Block[]> => {
    if (OFFLINE_MODE) return mockCall((m) => m.listBlocks());
    const { data, error } = await supabase.from("admin_blocks").select("id, name, name_hi").order("name");
    if (error) throw new ApiError(0, error.message);
    return data as Block[];
  },

  panchayats: async (blockId: number): Promise<Panchayat[]> => {
    if (OFFLINE_MODE) return mockCall((m) => m.listPanchayats(blockId));
    const { data, error } = await supabase
      .from("admin_panchayats")
      .select("id, block_id, name")
      .eq("block_id", blockId)
      .order("name");
    if (error) throw new ApiError(0, error.message);
    return data as Panchayat[];
  },

  villages: async (panchayatId: number): Promise<Village[]> => {
    if (OFFLINE_MODE) return mockCall((m) => m.listVillages(panchayatId));
    const { data, error } = await supabase
      .from("admin_villages")
      .select("id, panchayat_id, name, ward, tola")
      .eq("panchayat_id", panchayatId)
      .order("name");
    if (error) throw new ApiError(0, error.message);
    return data as Village[];
  },

  register: async (input: RegisterInput): Promise<AuthResponse> => {
    if (OFFLINE_MODE) return mockCall((m) => m.register(input));

    // Registration goes through a Supabase Edge Function using the
    // service_role key server-side. This bypasses the public signup rate
    // limit entirely and never sends a confirmation email, since the user
    // is created and confirmed directly via the Admin API.
    const functionsUrl = `${import.meta.env["VITE_SUPABASE_URL"]}/functions/v1/register-user`;
    const anonKey = import.meta.env["VITE_SUPABASE_ANON_KEY"];

    const res = await fetch(functionsUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${anonKey}`,
      },
      body: JSON.stringify(input),
    });

    const body = await res.json();
    if (!res.ok) throw new ApiError(res.status, body.error ?? "Registration failed");

    // Establish the session on the client so subsequent supabase.auth.getUser()
    // calls (used by me(), decide(), etc.) see this user as signed in.
    if (body.session) {
      await supabase.auth.setSession({
        access_token: body.session.access_token,
        refresh_token: body.session.refresh_token,
      });
    }

    return { user: body.user as AppUser, token: body.token ?? "" };
  },

  login: async (user_id: string, password: string): Promise<AuthResponse> => {
    if (OFFLINE_MODE) return mockCall((m) => m.login(user_id, password));

    const email = toAuthEmail(user_id);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new ApiError(401, "Invalid User ID or password");
    if (!data.session || !data.user) throw new ApiError(401, "Invalid User ID or password");

    const profile = await fetchProfile(data.user.id);
    return { user: profile, token: data.session.access_token };
  },

  me: async (): Promise<AppUser> => {
    if (OFFLINE_MODE) {
      const token = readToken();
      if (!token) throw new ApiError(401, "Please sign in again");
      return mockCall((m) => m.me(token));
    }
    const authUserId = await currentSessionUserId();
    return fetchProfile(authUserId);
  },

  queue: async (): Promise<AppUser[]> => {
    if (OFFLINE_MODE) {
      const token = readToken();
      if (!token) throw new ApiError(401, "Please sign in again");
      return mockCall((m) => m.queue(token));
    }

    // RLS's "Admin jurisdiction view" policy already restricts rows to
    // whatever the signed-in admin is entitled to see.
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("account_status", "PENDING_APPROVAL");
    if (error) throw new ApiError(0, error.message);
    return (data ?? []).map(rowToAppUser);
  },

  decide: async (id: string, approve: boolean, reason?: string): Promise<AppUser> => {
    if (OFFLINE_MODE) {
      const token = readToken();
      if (!token) throw new ApiError(401, "Please sign in again");
      return mockCall((m) => m.decide(token, id, approve, reason));
    }

    if (!approve && !reason?.trim()) throw new ApiError(400, "A rejection reason is required");

    const adminAuthId = await currentSessionUserId();

    const { data, error } = await supabase
      .from("profiles")
      .update({
        account_status: approve ? "APPROVED" : "REJECTED",
        reviewed_at: new Date().toISOString(),
        reviewed_by: adminAuthId,
        rejection_reason: approve ? null : reason!.trim(),
      })
      .eq("id", id)
      .select()
      .single();
    if (error) throw new ApiError(0, error.message);

    await supabase.from("verification_audit_logs").insert({
      applicant_id: id,
      decided_by: adminAuthId,
      action: approve ? "APPROVED" : "REJECTED",
      reason: approve ? null : reason!.trim(),
    });

    return rowToAppUser(data);
  },

  audit: async (): Promise<AppUser[]> => {
    if (OFFLINE_MODE) {
      const token = readToken();
      if (!token) throw new ApiError(401, "Please sign in again");
      return mockCall((m) => m.audit(token));
    }

    // District-only access is enforced client-side here; RLS additionally
    // restricts "profiles" reads to each admin's jurisdiction.
    const me = await api.me();
    if (me.role !== "DISTRICT_ADMIN") throw new ApiError(403, "District admins only");

    const { data, error } = await supabase.from("profiles").select("*");
    if (error) throw new ApiError(0, error.message);
    return (data ?? []).map(rowToAppUser);
  },

  /**
   * Returns all applicant profiles within the signed-in admin's jurisdiction.
   * RLS automatically filters rows to the admin's scope (Village Admin -> Panchayat,
   * Block Admin -> Block, District Admin -> District).
   */
  adminHistory: async (): Promise<AppUser[]> => {
    if (OFFLINE_MODE) {
      const token = readToken();
      if (!token) throw new ApiError(401, "Please sign in again");
      return mockCall((m) => m.audit(token));
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("submitted_at", { ascending: false });
    if (error) throw new ApiError(0, error.message);
    return (data ?? []).map(rowToAppUser);
  },

  /**
   * Fetches equipment, enterprise, and land plot details for a specific applicant.
   */
  applicantDetails: async (userId: string): Promise<{
    equipment: Record<string, any> | null;
    enterprise: Record<string, any> | null;
    landPlots: LandPlot[];
  }> => {
    if (OFFLINE_MODE) {
      return { equipment: null, enterprise: null, landPlots: [] };
    }

    const [eqRes, entRes, landRes] = await Promise.all([
      supabase.from("equipment").select("*").eq("owner_id", userId).maybeSingle(),
      supabase.from("chc_enterprises").select("*").eq("owner_id", userId).maybeSingle(),
      supabase.from("land_records").select("*").eq("user_id", userId),
    ]);

    return {
      equipment: eqRes.data ?? null,
      enterprise: entRes.data ?? null,
      landPlots: (landRes.data ?? []).map((row: any) => ({
        id: row.id,
        plot_name: row.plot_name ?? "",
        bigha: Number(row.land_area_bigha ?? 0),
        katha: Number(row.land_area_katha ?? 0),
        dhur: 0,
        soil_type: row.soil_type ?? "",
        latitude: row.latitude,
        longitude: row.longitude,
      })),
    };
  },

  saveProfile: async (payload: Record<string, unknown>): Promise<{ ok: true }> => {
    if (OFFLINE_MODE) return mockCall(() => ({ ok: true as const }));

    const authUserId = await currentSessionUserId();
    const { error } = await supabase.from("profiles").update(payload).eq("id", authUserId);
    if (error) throw new ApiError(0, error.message);
    return { ok: true };
  },

  /** The signed-in farmer's land plots (Bihar Bigha/Katha units). */
  landPlots: async (): Promise<LandPlot[]> => {
    if (OFFLINE_MODE) return [];

    const authUserId = await currentSessionUserId();
    const { data, error } = await supabase
      .from("land_records")
      .select("id, plot_name, land_area_bigha, land_area_katha, soil_type, latitude, longitude")
      .eq("user_id", authUserId)
      .order("created_at", { ascending: false });
    if (error) throw new ApiError(0, error.message);
    return (data ?? []).map((row: any) => ({
      id: row.id,
      plot_name: row.plot_name ?? "",
      bigha: Number(row.land_area_bigha ?? 0),
      katha: Number(row.land_area_katha ?? 0),
      dhur: 0,
      soil_type: row.soil_type ?? "",
      latitude: row.latitude,
      longitude: row.longitude,
    }));
  },

  /** Save a new land plot for the signed-in farmer. */
  addLandPlot: async (input: {
    plot_name: string;
    bigha: number;
    katha: number;
    soil_type: string;
    village_id?: number | null;
  }): Promise<LandPlot> => {
    if (OFFLINE_MODE) {
      return mockCall((m) => {
        const db = m as any;
        if (typeof db.addLandPlot === "function") return db.addLandPlot(input);
        return { id: crypto.randomUUID(), ...input, dhur: 0 } as LandPlot;
      });
    }

    const authUserId = await currentSessionUserId();
    const { data, error } = await supabase
      .from("land_records")
      .insert({
        user_id: authUserId,
        plot_name: input.plot_name,
        land_area_bigha: input.bigha,
        land_area_katha: input.katha,
        soil_type: input.soil_type || null,
        village_id: input.village_id ?? null,
      })
      .select("id, plot_name, land_area_bigha, land_area_katha, soil_type, latitude, longitude")
      .single();
    if (error) throw new ApiError(0, error.message);
    return {
      id: data.id,
      plot_name: data.plot_name ?? "",
      bigha: Number(data.land_area_bigha ?? 0),
      katha: Number(data.land_area_katha ?? 0),
      dhur: 0,
      soil_type: data.soil_type ?? "",
      latitude: data.latitude,
      longitude: data.longitude,
    };
  },

  /** Active machinery listings visible to any signed-in user. */
  equipmentList: async (): Promise<Machine[]> => {
    if (OFFLINE_MODE) return [];

    const { data, error } = await supabase
      .from("equipment")
      .select("id, category, sub_category, make_model, hp_rating, base_hourly_rate, base_acre_rate, photos")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw new ApiError(0, error.message);
    return (data ?? []).map((row: any) => ({
      id: row.id,
      category: row.category,
      sub_category: row.sub_category ?? undefined,
      make_model: row.make_model ?? "",
      hp_rating: row.hp_rating != null ? Number(row.hp_rating) : undefined,
      hourly_rate: row.base_hourly_rate != null ? Number(row.base_hourly_rate) : undefined,
      acre_rate: row.base_acre_rate != null ? Number(row.base_acre_rate) : undefined,
      implements: [],
      photos: Array.isArray(row.photos) ? row.photos : [],
    })) as Machine[];
  },

  /**
   * Approved equipment owners sorted by distance from the given point.
   * Backed by the SECURITY DEFINER RPC in supabase/nearby_owners_rpc.sql —
   * a plain `profiles` select would be blocked by RLS for non-admin users.
   */
  nearbyOwners: async (lat: number, lng: number, radiusKm = 100): Promise<NearbyOwner[]> => {
    if (OFFLINE_MODE) return [];

    const { data, error } = await supabase.rpc("nearby_equipment_owners", {
      lat,
      lng,
      radius_km: radiusKm,
    });
    if (error) throw new ApiError(0, error.message);
    return (data ?? []).map((row: any) => ({
      owner_id: row.owner_id,
      full_name: row.full_name ?? "",
      phone: row.phone ?? null,
      village_name: row.village_name ?? null,
      panchayat_name: row.panchayat_name ?? null,
      block_name: row.block_name ?? null,
      latitude: row.latitude != null ? Number(row.latitude) : null,
      longitude: row.longitude != null ? Number(row.longitude) : null,
      distance_km: row.distance_km != null ? Number(row.distance_km) : null,
    })) as NearbyOwner[];
  },

  /**
   * The signed-in equipment owner's enterprise (CHC) details, or null if
   * they haven't created one yet (e.g. approved before this data was
   * being collected — see handoff doc §11.5 / §12).
   */
  myEnterprise: async (): Promise<Record<string, any> | null> => {
    if (OFFLINE_MODE) return null;

    const authUserId = await currentSessionUserId();
    const { data, error } = await supabase
      .from("chc_enterprises")
      .select("*")
      .eq("owner_id", authUserId)
      .maybeSingle();
    if (error) throw new ApiError(0, error.message);
    return data;
  },

  /**
   * The signed-in equipment owner's equipment listing, or null if they
   * haven't created one yet.
   */
  myEquipment: async (): Promise<Record<string, any> | null> => {
    if (OFFLINE_MODE) return null;

    const authUserId = await currentSessionUserId();
    const { data, error } = await supabase
      .from("equipment")
      .select("*")
      .eq("owner_id", authUserId)
      .maybeSingle();
    if (error) throw new ApiError(0, error.message);
    return data;
  },

  /**
   * Create or update the signed-in owner's enterprise + equipment rows in
   * a single call. Relies on the existing UNIQUE(owner_id) constraints on
   * both tables (upsert onConflict: "owner_id") — no new RLS policy is
   * needed, since the existing "Owners manage equipment" policy
   * (auth.uid() = owner_id, FOR ALL) already permits this.
   *
   * The enterprise row is saved first so its generated `id` can be used
   * to correctly set `equipment.chc_id`, keeping the two rows linked
   * rather than just coincidentally sharing the same owner_id.
   *
   * Note: `is_active` on the equipment row is intentionally NOT settable
   * here, so a self-service edit can't make an unapproved/incomplete
   * listing public on its own.
   */
  saveMyEquipmentProfile: async (payload: {
    enterprise: {
      business_name: string;
      registration_number?: string;
      gst_number?: string;
      village_id?: number | null;
      latitude?: number | null;
      longitude?: number | null;
    };
    equipment: {
      category: string;
      sub_category?: string;
      make_model?: string;
      hp_rating?: number;
      hourly_rate?: number;
      acre_rate?: number;
      fuel_type?: string;
      reg_number?: string;
      transport_available?: boolean;
      has_insurance?: boolean;
    };
  }): Promise<{ ok: true }> => {
    if (OFFLINE_MODE) return { ok: true };

    const authUserId = await currentSessionUserId();

    const { data: enterprise, error: enterpriseErr } = await supabase
      .from("chc_enterprises")
      .upsert({ ...payload.enterprise, owner_id: authUserId }, { onConflict: "owner_id" })
      .select("id")
      .single();
    if (enterpriseErr) throw new ApiError(0, enterpriseErr.message);

    const { error: equipmentErr } = await supabase
      .from("equipment")
      .upsert(
        { ...payload.equipment, owner_id: authUserId, chc_id: enterprise.id },
        { onConflict: "owner_id" }
      );
    if (equipmentErr) throw new ApiError(0, equipmentErr.message);

    return { ok: true };
  },
};

export { ApiError };