import { Router } from "express";
import { z } from "zod";
import { one, withTransaction } from "../lib/db.js";
import {
  hashSecret,
  isAcceptableMpin,
  isStrongPassword,
  PHONE_RE,
  signToken,
  verifySecret,
} from "../lib/crypto.js";
import { assertHierarchy, type HierarchyRow } from "../lib/location.js";
import { storeSession } from "../lib/redis.js";

export const authRouter = Router();

const ROLES = ["FARMER", "CHC_PROVIDER", "OPERATOR", "AGENT", "ADMIN"] as const;

const registerSchema = z.object({
  phone: z.string().regex(PHONE_RE, "Enter a valid 10-digit mobile number"),
  full_name: z.string().trim().min(2).max(120),
  role: z.enum(ROLES).default("FARMER"),
  password: z.string().refine(isStrongPassword, "Password needs 8+ chars with a letter and a number"),
  mpin: z.string().refine(isAcceptableMpin, "MPIN must be 6 non-sequential digits").optional(),
  block_id: z.coerce.number().int().positive(),
  panchayat_id: z.coerce.number().int().positive(),
  village_id: z.coerce.number().int().positive(),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
});

/** Resolve the full hierarchy row for a village id. */
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

/** POST /api/v1/auth/register */
authRouter.post("/register", async (req, res, next) => {
  try {
    const body = registerSchema.parse(req.body);

    assertHierarchy(body, await resolveVillage(body.village_id));

    const existing = await one("SELECT id FROM users WHERE phone = $1", [body.phone]);
    if (existing) return res.status(409).json({ error: "This mobile number is already registered" });

    const [passwordHash, mpinHash] = await Promise.all([
      hashSecret(body.password),
      body.mpin ? hashSecret(body.mpin) : Promise.resolve(null),
    ]);

    const user = await withTransaction(async (client) => {
      const { rows } = await client.query(
        `INSERT INTO users (phone, password_hash, mpin_hash, full_name, role, village_id, coordinates)
         VALUES ($1, $2, $3, $4, $5::user_role, $6,
                 CASE WHEN $7::float8 IS NULL OR $8::float8 IS NULL THEN NULL
                      ELSE ST_SetSRID(ST_MakePoint($8::float8, $7::float8), 4326) END)
         RETURNING id, phone, full_name, role, village_id, trust_score, created_at`,
        [
          body.phone,
          passwordHash,
          mpinHash,
          body.full_name,
          body.role,
          body.village_id,
          body.latitude ?? null,
          body.longitude ?? null,
        ],
      );
      const created = rows[0];
      if (body.role === "OPERATOR") {
        await client.query("INSERT INTO operators (user_id) VALUES ($1) ON CONFLICT DO NOTHING", [
          created.id,
        ]);
      }
      return created;
    });

    const token = signToken({ sub: user.id, role: user.role, phone: user.phone });
    await storeSession(user.id, token).catch(() => undefined);
    res.status(201).json({ data: { user, token } });
  } catch (err) {
    next(err);
  }
});

const loginSchema = z
  .object({
    phone: z.string().regex(PHONE_RE),
    password: z.string().optional(),
    mpin: z.string().optional(),
  })
  .refine((v) => Boolean(v.password || v.mpin), "Provide either password or MPIN");

/** POST /api/v1/auth/login — phone + password OR phone + MPIN. */
authRouter.post("/login", async (req, res, next) => {
  try {
    const body = loginSchema.parse(req.body);
    const user = await one<{
      id: string;
      phone: string;
      role: string;
      full_name: string;
      password_hash: string;
      mpin_hash: string | null;
      is_active: boolean;
    }>(
      "SELECT id, phone, role, full_name, password_hash, mpin_hash, is_active FROM users WHERE phone = $1",
      [body.phone],
    );

    const ok =
      !!user &&
      user.is_active &&
      (body.password
        ? await verifySecret(body.password, user.password_hash)
        : await verifySecret(body.mpin!, user.mpin_hash));

    if (!ok || !user) return res.status(401).json({ error: "Invalid credentials" });

    const token = signToken({ sub: user.id, role: user.role, phone: user.phone });
    await storeSession(user.id, token).catch(() => undefined);
    res.json({
      data: {
        user: { id: user.id, phone: user.phone, role: user.role, full_name: user.full_name },
        token,
      },
    });
  } catch (err) {
    next(err);
  }
});
