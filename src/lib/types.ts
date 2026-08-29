export const ROLES = [
  "FARMER",
  "EQUIPMENT_OWNER",
  "OPERATOR",
  "VILLAGE_ADMIN",
  "BLOCK_ADMIN",
  "DISTRICT_ADMIN",
] as const;

export type Role = (typeof ROLES)[number];

export type AccountStatus = "PENDING_APPROVAL" | "APPROVED" | "REJECTED";

export interface Block {
  id: number;
  name: string;
  name_hi: string;
}
export interface Panchayat {
  id: number;
  block_id: number;
  name: string;
}
export interface Village {
  id: number;
  panchayat_id: number;
  name: string;
  ward?: string | null;
  tola?: string | null;
}

export interface AppUser {
  id: string;
  user_id: string;
  full_name: string;
  role: Role;
  account_status: AccountStatus;
  block_id: number;
  panchayat_id: number | null;
  village_id: number | null;
  latitude?: number | null;
  longitude?: number | null;
  submitted_at: string;
  reviewed_at?: string | null;
  rejection_reason?: string | null;
  verifier_role: Role | null;
}

export interface LandPlot {
  id: string;
  plot_name: string;
  bigha: number;
  katha: number;
  dhur: number;
  soil_type: string;
  latitude?: number | null;
  longitude?: number | null;
}

export interface Enterprise {
  business_name: string;
  registration_number?: string;
  gst_number?: string;
  latitude?: number | null;
  longitude?: number | null;
}

export interface Machine {
  id: string;
  category: string;
  sub_category?: string;
  make_model: string;
  hp_rating?: number;
  hourly_rate?: number;
  acre_rate?: number;
  implements?: string[];
  photos: string[];
}

export interface OperatorProfile {
  driving_license_no: string;
  experience_years: number;
  preferred_equipment_types: string[];
  daily_wage: number;
}

export interface AuthResponse {
  user: AppUser;
  token: string;
}

/** Which authority verifies a given applicant role. */
export const VERIFIER_OF: Record<Role, Role | null> = {
  FARMER: "VILLAGE_ADMIN",
  EQUIPMENT_OWNER: "VILLAGE_ADMIN",
  OPERATOR: "VILLAGE_ADMIN",
  VILLAGE_ADMIN: "BLOCK_ADMIN",
  BLOCK_ADMIN: "DISTRICT_ADMIN",
  DISTRICT_ADMIN: null,
};
