/**
 * Offline mock of the Day 1 Express API.
 *
 * The web client talks to the real backend whenever VITE_API_BASE_URL is set.
 * Without it (preview / tests) every request is served by this in-memory
 * implementation so the full registration -> approval lifecycle is demoable.
 * It is written as a pure factory so unit tests can spin up a fresh instance.
 */
import { JAMUI_BLOCKS, JAMUI_PANCHAYATS, JAMUI_VILLAGES } from "./jamui";
import { VERIFIER_OF, type AppUser, type AuthResponse, type Role } from "./types";

export interface RegisterInput {
  user_id: string;
  password: string;
  full_name: string;
  role: Role;
  block_id: number;
  panchayat_id?: number | null;
  village_id?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  phone: string;
  father_name?: string | null;
  aadhaar_last4?: string | null;
  equipment?: {
    category: string;
    sub_category?: string;
    make_model: string;
    hp_rating?: number;
    hourly_rate?: number;
    acre_rate?: number;
    implements?: string[];
  } | null;
  operator?: {
    driving_license_no: string;
    experience_years: number;
    preferred_equipment_types: string[];
    daily_wage: number;
  } | null;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

interface Record_ extends AppUser {
  password: string;
}

let counter = 0;
const uid = () => `u_${Date.now().toString(36)}_${++counter}`;

export function createMockBackend(initial: Record_[] = []) {
  const users: Record_[] = [...initial];

  function publicUser(u: Record_): AppUser {
    const { password: _p, ...rest } = u;
    return rest;
  }

  function scopeMatches(admin: AppUser, applicant: AppUser): boolean {
    if (admin.role === "DISTRICT_ADMIN") return true;
    if (admin.role === "BLOCK_ADMIN") return admin.block_id === applicant.block_id;
    if (admin.role === "VILLAGE_ADMIN") return admin.panchayat_id === applicant.panchayat_id;
    return false;
  }

  return {
    users,
    listBlocks: () => JAMUI_BLOCKS,
    listPanchayats: (blockId: number) => JAMUI_PANCHAYATS.filter((p) => p.block_id === blockId),
    listVillages: (panchayatId: number) =>
      JAMUI_VILLAGES.filter((v) => v.panchayat_id === panchayatId),

    register(input: RegisterInput): AuthResponse {
      if (users.some((u) => u.user_id.toLowerCase() === input.user_id.toLowerCase())) {
        throw new ApiError(409, "This User ID is already registered");
      }
      const user: Record_ = {
        id: uid(),
        user_id: input.user_id,
        password: input.password,
        full_name: input.full_name,
        role: input.role,
        // District admins are provisioned, not self-approved.
        account_status: "PENDING_APPROVAL",
        block_id: input.block_id,
        panchayat_id: input.panchayat_id ?? null,
        village_id: input.village_id ?? null,
        latitude: input.latitude ?? null,
        longitude: input.longitude ?? null,
        submitted_at: new Date().toISOString(),
        reviewed_at: null,
        rejection_reason: null,
        verifier_role: VERIFIER_OF[input.role],
      };
      users.push(user);
      return { user: publicUser(user), token: `mock.${user.id}` };
    },

    login(userId: string, password: string): AuthResponse {
      const user = users.find((u) => u.user_id.toLowerCase() === userId.toLowerCase());
      if (!user || user.password !== password) throw new ApiError(401, "Invalid User ID or password");
      return { user: publicUser(user), token: `mock.${user.id}` };
    },

    me(token: string): AppUser {
      const user = users.find((u) => `mock.${u.id}` === token);
      if (!user) throw new ApiError(401, "Session expired");
      return publicUser(user);
    },

    /** Pending applicants this admin is entitled to review. */
    queue(token: string): AppUser[] {
      const admin = this.me(token);
      return users
        .filter(
          (u) =>
            u.account_status === "PENDING_APPROVAL" &&
            u.verifier_role === admin.role &&
            scopeMatches(admin, u),
        )
        .map(publicUser);
    },

    decide(token: string, applicantId: string, approve: boolean, reason?: string): AppUser {
      const admin = this.me(token);
      const applicant = users.find((u) => u.id === applicantId);
      if (!applicant) throw new ApiError(404, "Applicant not found");
      if (applicant.verifier_role !== admin.role || !scopeMatches(admin, applicant)) {
        throw new ApiError(403, "Outside your jurisdiction");
      }
      if (!approve && !reason?.trim()) throw new ApiError(400, "A rejection reason is required");
      applicant.account_status = approve ? "APPROVED" : "REJECTED";
      applicant.reviewed_at = new Date().toISOString();
      applicant.rejection_reason = approve ? null : reason!.trim();
      return publicUser(applicant);
    },

    /** All users in the district — district admin audit view. */
    audit(token: string): AppUser[] {
      const admin = this.me(token);
      if (admin.role !== "DISTRICT_ADMIN") throw new ApiError(403, "District admins only");
      return users.map(publicUser);
    },
  };
}

export type MockBackend = ReturnType<typeof createMockBackend>;

const STORAGE_KEY = "jamui.mock.users.v1";

function seed(): Record_[] {
  const now = new Date().toISOString();
  const base = { submitted_at: now, reviewed_at: now, rejection_reason: null } as const;
  return [
    {
      ...base,
      id: "seed_district",
      user_id: "district.admin",
      password: "jamui@2026",
      full_name: "Jila Prashasak, Jamui",
      role: "DISTRICT_ADMIN",
      account_status: "APPROVED",
      block_id: 1,
      panchayat_id: null,
      village_id: null,
      verifier_role: null,
    },
    {
      ...base,
      id: "seed_block",
      user_id: "block.jamui",
      password: "jamui@2026",
      full_name: "Prakhand Adhikari, Jamui",
      role: "BLOCK_ADMIN",
      account_status: "APPROVED",
      block_id: 1,
      panchayat_id: null,
      village_id: null,
      verifier_role: "DISTRICT_ADMIN",
    },
    {
      ...base,
      id: "seed_village",
      user_id: "mitra.jamui",
      password: "jamui@2026",
      full_name: "Grameen Mitra, Jamui Uttar",
      role: "VILLAGE_ADMIN",
      account_status: "APPROVED",
      block_id: 1,
      panchayat_id: 101,
      village_id: 1011,
      verifier_role: "BLOCK_ADMIN",
    },
    {
      ...base,
      reviewed_at: null,
      id: "seed_farmer",
      user_id: "ramesh.kisan",
      password: "kisan@2026",
      full_name: "Ramesh Yadav",
      role: "FARMER",
      account_status: "PENDING_APPROVAL",
      block_id: 1,
      panchayat_id: 101,
      village_id: 1011,
      verifier_role: "VILLAGE_ADMIN",
    },
  ];
}

let singleton: MockBackend | null = null;

/** Browser-side singleton, persisted to localStorage between reloads. */
export function getMockBackend(): MockBackend {
  if (singleton) return singleton;
  let start = seed();
  if (typeof window !== "undefined") {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) start = JSON.parse(raw) as Record_[];
    } catch {
      /* ignore corrupt cache */
    }
  }
  singleton = createMockBackend(start);
  return singleton;
}

export function persistMockBackend() {
  if (typeof window === "undefined" || !singleton) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(singleton.users));
  } catch {
    /* quota */
  }
}
