import { Router } from "express";
import { z } from "zod";
import { query } from "../lib/db.js";

export const locationsRouter = Router();

/** GET /api/v1/locations/blocks — all Jamui blocks. */
locationsRouter.get("/blocks", async (_req, res, next) => {
  try {
    const rows = await query("SELECT id, name, code FROM admin_block ORDER BY name ASC");
    res.json({ data: rows });
  } catch (err) {
    next(err);
  }
});

/** GET /api/v1/locations/panchayats?block_id=1 */
locationsRouter.get("/panchayats", async (req, res, next) => {
  try {
    const { block_id } = z.object({ block_id: z.coerce.number().int().positive() }).parse(req.query);
    const rows = await query(
      "SELECT id, block_id, name, code FROM admin_panchayat WHERE block_id = $1 ORDER BY name ASC",
      [block_id],
    );
    res.json({ data: rows });
  } catch (err) {
    next(err);
  }
});

/** GET /api/v1/locations/villages?panchayat_id=1 */
locationsRouter.get("/villages", async (req, res, next) => {
  try {
    const { panchayat_id } = z
      .object({ panchayat_id: z.coerce.number().int().positive() })
      .parse(req.query);
    const rows = await query(
      "SELECT id, panchayat_id, name, ward, tola FROM admin_village WHERE panchayat_id = $1 ORDER BY name ASC",
      [panchayat_id],
    );
    res.json({ data: rows });
  } catch (err) {
    next(err);
  }
});
