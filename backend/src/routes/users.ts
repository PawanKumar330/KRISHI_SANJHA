import { Router } from "express";
import { z } from "zod";
import { one, withTransaction } from "../lib/db.js";
import { requireAuth, type AuthedRequest } from "../lib/auth-middleware.js";
import { assertHierarchy, normalizeLandArea, type HierarchyRow } from "../lib/location.js";

export const usersRouter = Router();

const landSchema = z.object({
  plot_name: z.string().trim().max(120).optional(),
  land_area_bigha: z.coerce.number().min(0).max(10000).optional(),
  land_area_katha: z.coerce.number().min(0).max(10000).optional(),
  soil_type: z.string().trim().max(60).optional(),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
  block_id: z.coerce.number().int().positive(),
  panchayat_id: z.coerce.number().int().positive(),
  village_id: z.coerce.number().int().positive(),
});

const enterpriseSchema = z.object({
  business_name: z.string().trim().min(2).max(160),
  registration_number: z.string().trim().max(60).optional(),
  gst_number: z
    .string()
    .trim()
    .regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][0-9A-Z]{3}$/, "Invalid GSTIN")
    .optional(),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
  village_id: z.coerce.number().int().positive().optional(),
});

const operatorSchema = z.object({
  driving_license_no: z.string().trim().max(40).optional(),
  experience_years: z.coerce.number().int().min(0).max(70).optional(),
  preferred_equipment_types: z.array(z.string().trim().max(60)).max(20).optional(),
  daily_wage: z.coerce.number().min(0).max(100000).optional(),
});

const profileSchema = z.object({
  full_name: z.string().trim().min(2).max(120).optional(),
  land_records: z.array(landSchema).max(20).optional(),
  enterprise: enterpriseSchema.optional(),
  operator: operatorSchema.optional(),
});

async function resolveVillage(villageId: number): Promise<HierarchyRow | null> {
  return one<HierarchyRow>(
    `SELECT v.id AS village_id, p.id AS panchayat_id, b.id AS block_id
       FROM admin_village v
       JOIN admin_panchayat p ON p.id = v.panchayat_id
       JOIN admin_block b ON b.id = p.block_id
      WHERE v.id = $1`,
    [villageId],
  );
}

/** POST /api/v1/users/profile — profile completion (land, enterprise, operator). */
usersRouter.post("/profile", requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const body = profileSchema.parse(req.body);
    const userId = req.user!.sub;

    for (const plot of body.land_records ?? []) {
      assertHierarchy(plot, await resolveVillage(plot.village_id));
    }

    const result = await withTransaction(async (client) => {
      if (body.full_name) {
        await client.query("UPDATE users SET full_name = $2, updated_at = now() WHERE id = $1", [
          userId,
          body.full_name,
        ]);
      }

      const plots = [];
      for (const plot of body.land_records ?? []) {
        const area = normalizeLandArea(plot.land_area_bigha ?? 0, plot.land_area_katha ?? 0);
        const { rows } = await client.query(
          `INSERT INTO land_records
             (user_id, plot_name, land_area_bigha, land_area_katha, soil_type, village_id, coordinates)
           VALUES ($1, $2, $3, $4, $5, $6,
                   CASE WHEN $7::float8 IS NULL OR $8::float8 IS NULL THEN NULL
                        ELSE ST_SetSRID(ST_MakePoint($8::float8, $7::float8), 4326) END)
           RETURNING id, plot_name, land_area_bigha, land_area_katha, soil_type, village_id`,
          [
            userId,
            plot.plot_name ?? null,
            area.bigha,
            area.katha,
            plot.soil_type ?? null,
            plot.village_id,
            plot.latitude ?? null,
            plot.longitude ?? null,
          ],
        );
        plots.push(rows[0]);
      }

      let enterprise = null;
      if (body.enterprise) {
        if (req.user!.role !== "CHC_PROVIDER" && req.user!.role !== "ADMIN") {
          const err = new Error("Only CHC providers can add enterprise details") as Error & {
            status?: number;
          };
          err.status = 403;
          throw err;
        }
        const e = body.enterprise;
        const { rows } = await client.query(
          `INSERT INTO chc_enterprise
             (owner_id, business_name, registration_number, gst_number, village_id, center_location)
           VALUES ($1, $2, $3, $4, $5,
                   CASE WHEN $6::float8 IS NULL OR $7::float8 IS NULL THEN NULL
                        ELSE ST_SetSRID(ST_MakePoint($7::float8, $6::float8), 4326) END)
           RETURNING id, business_name, registration_number, gst_number, verification_status`,
          [
            userId,
            e.business_name,
            e.registration_number ?? null,
            e.gst_number ?? null,
            e.village_id ?? null,
            e.latitude ?? null,
            e.longitude ?? null,
          ],
        );
        enterprise = rows[0];
      }

      let operator = null;
      if (body.operator) {
        const o = body.operator;
        const { rows } = await client.query(
          `INSERT INTO operators
             (user_id, driving_license_no, experience_years, preferred_equipment_types, daily_wage)
           VALUES ($1, $2, $3, $4::jsonb, $5)
           ON CONFLICT (user_id) DO UPDATE SET
             driving_license_no = EXCLUDED.driving_license_no,
             experience_years = EXCLUDED.experience_years,
             preferred_equipment_types = EXCLUDED.preferred_equipment_types,
             daily_wage = EXCLUDED.daily_wage
           RETURNING id, driving_license_no, experience_years, preferred_equipment_types, daily_wage, verification_status`,
          [
            userId,
            o.driving_license_no ?? null,
            o.experience_years ?? null,
            JSON.stringify(o.preferred_equipment_types ?? []),
            o.daily_wage ?? null,
          ],
        );
        operator = rows[0];
      }

      return { land_records: plots, enterprise, operator };
    });

    res.status(200).json({ data: result });
  } catch (err) {
    next(err);
  }
});

/** GET /api/v1/users/me */
usersRouter.get("/me", requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const user = await one(
      `SELECT u.id, u.phone, u.full_name, u.role, u.trust_score, u.created_at,
              v.id AS village_id, v.name AS village_name,
              p.id AS panchayat_id, p.name AS panchayat_name,
              b.id AS block_id, b.name AS block_name
         FROM users u
         LEFT JOIN admin_village v ON v.id = u.village_id
         LEFT JOIN admin_panchayat p ON p.id = v.panchayat_id
         LEFT JOIN admin_block b ON b.id = p.block_id
        WHERE u.id = $1`,
      [req.user!.sub],
    );
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ data: user });
  } catch (err) {
    next(err);
  }
});
