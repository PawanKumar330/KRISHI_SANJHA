import { z } from "zod";
import { ROLES } from "./types";

/** Govt-portal style handle: 4-24 chars, letters/digits/dot/underscore. */
export const USER_ID_RE = /^[a-z][a-z0-9._]{3,23}$/;
export const PHONE_RE = /^[6-9]\d{9}$/; // Indian mobile: 10 digits, starts 6-9

export const userIdSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(USER_ID_RE, "User ID: 4-24 chars, start with a letter, only a-z 0-9 . _");

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(72)
  .regex(/[A-Za-z]/, "Password must include a letter")
  .regex(/\d/, "Password must include a number");

export const loginSchema = z.object({
  user_id: userIdSchema,
  password: z.string().min(1, "Password is required"),
  remember: z.boolean().optional(),
});
export type LoginValues = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    role: z.enum(ROLES),
    full_name: z.string().trim().min(2, "Full name is required").max(120),
    user_id: userIdSchema,
    password: passwordSchema,
    confirm_password: z.string(),
    block_id: z.coerce.number().int().positive("Select a block"),
    panchayat_id: z.coerce.number().int().positive("Select a panchayat").nullable(),
    village_id: z.coerce.number().int().positive("Select a village").nullable(),
    latitude: z.number().min(-90).max(90).nullable().optional(),
    longitude: z.number().min(-180).max(180).nullable().optional(),
    phone: z
      .string()
      .trim()
      .regex(PHONE_RE, "Enter a valid 10-digit mobile number"),
    father_name: z.string().trim().max(120).optional().or(z.literal("")),
    aadhaar_last4: z
      .string()
      .trim()
      .regex(/^\d{4}$/, "Enter exactly 4 digits")
      .optional()
      .or(z.literal("")),
    equipment: z
      .object({
        category: z.string().min(1, "Select a category"),
        sub_category: z.string().optional().or(z.literal("")),
        make_model: z.string().trim().min(2, "Make / model is required").max(120),
        hp_rating: z.coerce.number().min(0).max(1000).optional(),
        hourly_rate: z.coerce.number().min(0).max(100000).optional(),
        acre_rate: z.coerce.number().min(0).max(100000).optional(),
        implements: z.array(z.string()).optional(),
      })
      .optional()
      .nullable(),
    operator: z
      .object({
        driving_license_no: z.string().trim().min(6, "Driving licence number is required").max(40),
        experience_years: z.coerce.number().int().min(0).max(70),
        preferred_equipment_types: z.array(z.string()).min(1, "Choose at least one machinery type"),
        daily_wage: z.coerce.number().min(0).max(100000),
      })
      .optional()
      .nullable(),
  })
  .refine((v) => v.password === v.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  })
  .refine((v) => v.role === "DISTRICT_ADMIN" || v.panchayat_id != null, {
    message: "Select a panchayat",
    path: ["panchayat_id"],
  })
  .refine(
    (v) => v.role === "DISTRICT_ADMIN" || v.role === "BLOCK_ADMIN" || v.village_id != null,
    { message: "Select a village", path: ["village_id"] },
  )
  .refine((v) => v.role !== "EQUIPMENT_OWNER" || v.equipment != null, {
    message: "Equipment details are required",
    path: ["equipment"],
  })
  .refine((v) => v.role !== "OPERATOR" || v.operator != null, {
    message: "Operator details are required",
    path: ["operator"],
  });
export type RegisterValues = z.infer<typeof registerSchema>;

export const SOIL_TYPES = ["Alluvial", "Loam", "Clay", "Sandy Loam", "Red", "Black"] as const;

export const landPlotSchema = z.object({
  plot_name: z.string().trim().min(1, "Plot name is required").max(120),
  bigha: z.coerce.number().min(0).max(10000),
  katha: z.coerce.number().min(0).max(19.99, "Katha must be less than 20"),
  dhur: z.coerce.number().min(0).max(19.99, "Dhur must be less than 20"),
  soil_type: z.string().min(1, "Select a soil type"),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
});
export type LandPlotValues = z.infer<typeof landPlotSchema>;

export const enterpriseSchema = z.object({
  business_name: z.string().trim().min(2, "Business name is required").max(160),
  registration_number: z.string().trim().max(60).optional().or(z.literal("")),
  gst_number: z
    .string()
    .trim()
    .regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][0-9A-Z]{3}$/, "Invalid GSTIN")
    .optional()
    .or(z.literal("")),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
});
export type EnterpriseValues = z.infer<typeof enterpriseSchema>;

export const machineSchema = z.object({
  category: z.string().min(1, "Select a category"),
  sub_category: z.string().optional().or(z.literal("")),
  make_model: z.string().trim().min(2, "Make / model is required").max(120),
  hp_rating: z.coerce.number().min(0).max(1000).optional(),
  hourly_rate: z.coerce.number().min(0).max(100000).optional(),
  acre_rate: z.coerce.number().min(0).max(100000).optional(),
  implements: z.array(z.string()).optional(),
});
export type MachineValues = z.infer<typeof machineSchema>;

export const operatorSchema = z.object({
  driving_license_no: z
    .string()
    .trim()
    .min(6, "Driving licence number is required")
    .max(40),
  experience_years: z.coerce.number().int().min(0).max(70),
  preferred_equipment_types: z.array(z.string()).min(1, "Choose at least one machinery type"),
  daily_wage: z.coerce.number().min(0).max(100000),
});
export type OperatorValues = z.infer<typeof operatorSchema>;

export const rejectSchema = z.object({
  reason: z.string().trim().min(5, "Give a clear reason (5+ characters)").max(500),
});

/** 1 bigha = 20 katha, 1 katha = 20 dhur (Bihar standard). */
export const KATHA_PER_BIGHA = 20;
export const DHUR_PER_KATHA = 20;

export function toDhur(bigha = 0, katha = 0, dhur = 0): number {
  return (bigha * KATHA_PER_BIGHA + katha) * DHUR_PER_KATHA + dhur;
}

export function normalizeArea(bigha = 0, katha = 0, dhur = 0) {
  const total = toDhur(bigha, katha, dhur);
  const k = Math.floor(total / DHUR_PER_KATHA);
  return {
    bigha: Math.floor(k / KATHA_PER_BIGHA),
    katha: k % KATHA_PER_BIGHA,
    dhur: Number((total % DHUR_PER_KATHA).toFixed(2)),
  };
}
