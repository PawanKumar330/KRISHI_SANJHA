/**
 * Seed loader for the Jamui district Block -> Panchayat -> Village hierarchy.
 *
 * Usage:
 *   npm run seed:locations -- ./seed/jamui_locations.csv
 *   npm run seed:locations -- ./seed/jamui_locations.json
 *
 * Expected CSV header (see seed/jamui_locations.sample.csv):
 *   block,panchayat,village,ward,tola
 * Expected JSON shape (see seed/jamui_locations.sample.json):
 *   [{ "block": "...", "panchayat": "...", "village": "...", "ward": null, "tola": null }]
 *
 * The loader is idempotent (ON CONFLICT DO NOTHING) — re-running with an
 * updated file only inserts the new rows. NO real location data is bundled;
 * drop your official Jamui list into ./seed and point the script at it.
 */
import "dotenv/config";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { pool } from "../src/lib/db.js";

export type LocationRow = {
  block: string;
  panchayat: string;
  village: string;
  ward?: string | null;
  tola?: string | null;
};

/** Minimal RFC4180-ish CSV parser (handles quoted fields and embedded commas). */
export function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let field = "";
  let row: string[] = [];
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else quoted = false;
      } else field += ch;
      continue;
    }
    if (ch === '"') quoted = true;
    else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (ch !== "\r") field += ch;
  }
  if (field.length || row.length) {
    row.push(field);
    rows.push(row);
  }
  const nonEmpty = rows.filter((r) => r.some((c) => c.trim() !== ""));
  if (!nonEmpty.length) return [];
  const header = nonEmpty[0].map((h) => h.trim().toLowerCase());
  return nonEmpty.slice(1).map((r) =>
    Object.fromEntries(header.map((h, idx) => [h, (r[idx] ?? "").trim()])),
  );
}

export function normalizeRows(raw: Record<string, unknown>[]): LocationRow[] {
  const out: LocationRow[] = [];
  raw.forEach((r, idx) => {
    const block = String(r["block"] ?? "").trim();
    const panchayat = String(r["panchayat"] ?? "").trim();
    const village = String(r["village"] ?? "").trim();
    if (!block || !panchayat || !village) {
      throw new Error(`Row ${idx + 1}: block, panchayat and village are all required`);
    }
    const ward = r["ward"] ? String(r["ward"]).trim() : null;
    const tola = r["tola"] ? String(r["tola"]).trim() : null;
    out.push({ block, panchayat, village, ward: ward || null, tola: tola || null });
  });
  return out;
}

async function main() {
  const file = process.argv[2];
  if (!file) {
    console.error("Usage: npm run seed:locations -- <path to .csv|.json>");
    process.exit(1);
  }
  const text = await readFile(path.resolve(file), "utf8");
  const raw = path.extname(file).toLowerCase() === ".json" ? JSON.parse(text) : parseCsv(text);
  const rows = normalizeRows(raw);

  const blockIds = new Map<string, number>();
  const panchayatIds = new Map<string, number>();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (const r of rows) {
      let blockId = blockIds.get(r.block);
      if (!blockId) {
        const { rows: b } = await client.query(
          `INSERT INTO admin_block (name) VALUES ($1)
           ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id`,
          [r.block],
        );
        blockId = Number(b[0].id);
        blockIds.set(r.block, blockId);
      }

      const pKey = `${blockId}::${r.panchayat}`;
      let panchayatId = panchayatIds.get(pKey);
      if (!panchayatId) {
        const { rows: p } = await client.query(
          `INSERT INTO admin_panchayat (block_id, name) VALUES ($1, $2)
           ON CONFLICT (block_id, name) DO UPDATE SET name = EXCLUDED.name RETURNING id`,
          [blockId, r.panchayat],
        );
        panchayatId = Number(p[0].id);
        panchayatIds.set(pKey, panchayatId);
      }

      await client.query(
        `INSERT INTO admin_village (panchayat_id, name, ward, tola)
         VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING`,
        [panchayatId, r.village, r.ward, r.tola],
      );
    }
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }

  console.log(
    `Seeded ${blockIds.size} blocks, ${panchayatIds.size} panchayats, ${rows.length} village rows.`,
  );
  await pool.end();
}

if (process.argv[1] && process.argv[1].endsWith("seed-locations.ts")) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
