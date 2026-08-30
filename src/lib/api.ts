import { supabase, isSupabaseConfigured } from "./supabase";
import { getMockBackend, persistMockBackend, ApiError, type RegisterInput } from "./mock-backend";
import { VERIFIER_OF, type AppUser, type AuthResponse, type Block, type Panchayat, type Village } from "./types";

/**
 * True when no Supabase project is configured — falls back to the
 * in-memory mock backend (useful for local preview / tests without
 * hitting a real database).
 */
export const OFFLINE_MODE = !isSupabaseConfigured;

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
  blocks: (): Promise<Block[]> =>
    OFFLINE_MODE
      ? mockCall((m) => m.listBlocks())
      : supabase
          .from("admin_blocks")
          .select("id, name, name_hi")
          .order("name")
          .then(({ data, error }) => {
            if (error) throw new ApiError(0, error.message);
            return data as Block[];
          }),

  panchayats: (blockId: number): Promise<Panchayat[]> =>
    OFFLINE_MODE
      ? mockCall((m) => m.listPanchayats(blockId))
      : supabase
          .from("admin_panchayats")
          .select("id, block_id, name")
          .eq("block_id", blockId)
          .order("name")
          .then(({ data, error }) => {
            if (error) throw new ApiError(0, error.message);
            return data as Panchayat[];
          }),

  villages: (panchayatId: number): Promise<Village[]> =>
    OFFLINE_MODE
      ? mockCall((m) => m.listVillages(panchayatId))
      : supabase
          .from("admin_villages")
          .select("id, panchayat_id, name, ward, tola")
          .eq("panchayat_id", panchayatId)
          .order("name")
          .then(({ data, error }) => {
            if (error) throw new ApiError(0, error.message);
            return data as Village[];
          }),

  register: async (input: RegisterInput): Promise<AuthResponse> => {
    if (OFFLINE_MODE) {
      console.log("[Krishi Sanjha] Registering locally in offline mode");
      return mockCall((m) => m.register(input));
    }

    console.log("[Krishi Sanjha] Registering via Supabase Auth:", input.user_id);
    const email = toAuthEmail(input.user_id);

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password: input.password,
      options: {
        data: {
          user_id: input.user_id,
          full_name: input.full_name,
          role: input.role,
        },
      },
    });

    if (signUpError) {
      console.error("[Krishi Sanjha] Supabase signUp error:", signUpError);
      if (signUpError.message.toLowerCase().includes("already registered")) {
        throw new ApiError(409, "This User ID is already registered");
      }
      throw new ApiError(0, signUpError.message);
    }

    const authUser = signUpData.user;
    if (!authUser) throw new ApiError(0, "Sign up did not return a user");

    // Establish session if not immediately available from signUp
    let session = signUpData.session;
    if (!session) {
      const { data: signInData } = await supabase.auth.signInWithPassword({
        email,
        password: input.password,
      });
      session = signInData?.session ?? null;
    }

    const { data: profileRow, error: profileError } = await supabase
      .from("profiles")
      .upsert(
        {
          id: authUser.id,
          user_id: input.user_id,
          full_name: input.full_name,
          role: input.role,
          account_status: "PENDING_APPROVAL",
          block_id: input.block_id,
          panchayat_id: input.panchayat_id ?? null,
          village_id: input.village_id ?? null,
          latitude: input.latitude ?? null,
          longitude: input.longitude ?? null,
          verifier_role: VERIFIER_OF[input.role],
        },
        { onConflict: "id" }
      )
      .select()
      .single();

    if (profileError) {
      console.error("[Krishi Sanjha] Supabase profiles insert/upsert error:", profileError);
      throw new ApiError(0, `Database error: ${profileError.message}`);
    }

    const token = session?.access_token ?? `token.${authUser.id}`;
    return { user: rowToAppUser(profileRow), token };
  },

  login: async (user_id: string, password: string): Promise<AuthResponse> => {
    if (OFFLINE_MODE) {
      console.log("[Krishi Sanjha] Logging in locally in offline mode");
      return mockCall((m) => m.login(user_id, password));
    }

    console.log("[Krishi Sanjha] Logging in via Supabase:", user_id);
    const email = toAuthEmail(user_id);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      console.error("[Krishi Sanjha] Supabase signIn error:", error);
      throw new ApiError(401, "Invalid User ID or password");
    }
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

  saveProfile: async (payload: Record<string, unknown>): Promise<{ ok: true }> => {
    if (OFFLINE_MODE) return mockCall(() => ({ ok: true as const }));

    const authUserId = await currentSessionUserId();
    const { error } = await supabase.from("profiles").update(payload).eq("id", authUserId);
    if (error) throw new ApiError(0, error.message);
    return { ok: true };
  },
};

export { ApiError };