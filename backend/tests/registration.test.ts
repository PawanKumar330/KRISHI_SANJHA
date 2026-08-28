import { describe, expect, it, vi, beforeEach } from "vitest";

// The auth router is exercised through supertest-free direct handler invocation:
// we stub the DB layer so registration logic (validation, hierarchy check,
// hashing, role side-effects) can be unit-tested without Postgres.
const dbState = {
  village: { village_id: 300, panchayat_id: 20, block_id: 2 } as Record<string, unknown> | null,
  existingUser: null as Record<string, unknown> | null,
  inserted: [] as { sql: string; params: unknown[] }[],
};

vi.mock("../src/lib/db.js", () => ({
  one: vi.fn(async (sql: string) => {
    if (sql.includes("FROM admin_village")) return dbState.village;
    if (sql.includes("FROM users")) return dbState.existingUser;
    return null;
  }),
  withTransaction: vi.fn(async (fn: (client: unknown) => Promise<unknown>) =>
    fn({
      query: async (sql: string, params: unknown[]) => {
        dbState.inserted.push({ sql, params });
        return {
          rows: [
            {
              id: "user-uuid",
              phone: params?.[0],
              full_name: params?.[3],
              role: params?.[4],
              village_id: params?.[5],
              trust_score: 50,
              created_at: new Date().toISOString(),
            },
          ],
        };
      },
    }),
  ),
  query: vi.fn(async () => []),
  pool: {},
}));

vi.mock("../src/lib/redis.js", () => ({
  storeSession: vi.fn(async () => undefined),
  revokeSession: vi.fn(async () => undefined),
  redis: {},
}));

const { authRouter } = await import("../src/routes/auth.js");
const { verifySecret, verifyToken } = await import("../src/lib/crypto.js");

type Handler = (req: unknown, res: unknown, next: unknown) => Promise<void> | void;

function getHandler(path: string): Handler {
  const layer = (authRouter as unknown as { stack: any[] }).stack.find(
    (l) => l.route?.path === path,
  );
  return layer.route.stack[0].handle as Handler;
}

function mockRes() {
  const res: any = {};
  res.statusCode = 200;
  res.body = undefined;
  res.status = (code: number) => {
    res.statusCode = code;
    return res;
  };
  res.json = (payload: unknown) => {
    res.body = payload;
    return res;
  };
  return res;
}

const baseBody = {
  phone: "9934567890",
  full_name: "Ramesh Yadav",
  password: "Tractor2026",
  mpin: "482913",
  block_id: 2,
  panchayat_id: 20,
  village_id: 300,
};

async function register(body: Record<string, unknown>) {
  const res = mockRes();
  let error: any = null;
  await getHandler("/register")({ body } as never, res as never, ((e: unknown) => {
    error = e;
  }) as never);
  return { res, error };
}

beforeEach(() => {
  dbState.village = { village_id: 300, panchayat_id: 20, block_id: 2 };
  dbState.existingUser = null;
  dbState.inserted = [];
});

describe("multi-role registration", () => {
  it.each(["FARMER", "CHC_PROVIDER", "OPERATOR", "AGENT", "ADMIN"])(
    "registers a %s and returns a scoped JWT",
    async (role) => {
      const { res, error } = await register({ ...baseBody, role });
      expect(error).toBeNull();
      expect(res.statusCode).toBe(201);
      expect(res.body.data.user.role).toBe(role);
      expect(verifyToken(res.body.data.token).role).toBe(role);
    },
  );

  it("defaults the role to FARMER", async () => {
    const { res } = await register({ ...baseBody, role: undefined });
    expect(res.body.data.user.role).toBe("FARMER");
  });

  it("creates an operators row for OPERATOR signups only", async () => {
    await register({ ...baseBody, role: "OPERATOR" });
    expect(dbState.inserted.some((q) => q.sql.includes("INSERT INTO operators"))).toBe(true);

    dbState.inserted = [];
    await register({ ...baseBody, role: "FARMER" });
    expect(dbState.inserted.some((q) => q.sql.includes("INSERT INTO operators"))).toBe(false);
  });

  it("stores bcrypt hashes, never the raw password or MPIN", async () => {
    await register(baseBody);
    const insert = dbState.inserted.find((q) => q.sql.includes("INSERT INTO users"))!;
    const [, passwordHash, mpinHash] = insert.params as string[];
    expect(passwordHash).not.toBe(baseBody.password);
    expect(mpinHash).not.toBe(baseBody.mpin);
    expect(await verifySecret(baseBody.password, passwordHash)).toBe(true);
    expect(await verifySecret(baseBody.mpin, mpinHash)).toBe(true);
  });

  it("allows registration without an MPIN", async () => {
    const { res } = await register({ ...baseBody, mpin: undefined });
    const insert = dbState.inserted.find((q) => q.sql.includes("INSERT INTO users"))!;
    expect(insert.params[2]).toBeNull();
    expect(res.statusCode).toBe(201);
  });

  it("rejects a duplicate phone number with 409", async () => {
    dbState.existingUser = { id: "existing" };
    const { res } = await register(baseBody);
    expect(res.statusCode).toBe(409);
  });

  it("rejects an invalid phone, weak password and weak MPIN", async () => {
    for (const bad of [
      { phone: "1234567890" },
      { password: "weak" },
      { mpin: "111111" },
      { role: "SARPANCH" },
    ]) {
      const { error } = await register({ ...baseBody, ...bad });
      expect(error).toBeTruthy();
    }
  });

  it("rejects a village that does not belong to the selected panchayat", async () => {
    dbState.village = { village_id: 300, panchayat_id: 21, block_id: 2 };
    const { error } = await register(baseBody);
    expect(error.name).toBe("LocationHierarchyError");
  });

  it("rejects a panchayat that does not belong to the selected block", async () => {
    dbState.village = { village_id: 300, panchayat_id: 20, block_id: 9 };
    const { error } = await register(baseBody);
    expect(error.name).toBe("LocationHierarchyError");
  });

  it("rejects an unknown village", async () => {
    dbState.village = null;
    const { error } = await register(baseBody);
    expect(error.name).toBe("LocationHierarchyError");
  });
});
