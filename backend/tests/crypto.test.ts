import { describe, expect, it } from "vitest";
import {
  hashSecret,
  isAcceptableMpin,
  isStrongPassword,
  signToken,
  verifySecret,
  verifyToken,
  PHONE_RE,
} from "../src/lib/crypto.js";

describe("password + MPIN hashing", () => {
  it("hashes a password to a non-reversible bcrypt digest", async () => {
    const hash = await hashSecret("Tractor@2026");
    expect(hash).not.toBe("Tractor@2026");
    expect(hash.startsWith("$2")).toBe(true);
  });

  it("verifies the correct password and rejects the wrong one", async () => {
    const hash = await hashSecret("Tractor@2026");
    expect(await verifySecret("Tractor@2026", hash)).toBe(true);
    expect(await verifySecret("tractor@2026", hash)).toBe(false);
  });

  it("produces different digests for the same input (salted)", async () => {
    expect(await hashSecret("Tractor@2026")).not.toBe(await hashSecret("Tractor@2026"));
  });

  it("hashes and verifies a 6-digit MPIN", async () => {
    const hash = await hashSecret("482913");
    expect(await verifySecret("482913", hash)).toBe(true);
    expect(await verifySecret("482914", hash)).toBe(false);
  });

  it("returns false when no MPIN has been set", async () => {
    expect(await verifySecret("482913", null)).toBe(false);
  });

  it("enforces password strength rules", () => {
    expect(isStrongPassword("Tractor2026")).toBe(true);
    expect(isStrongPassword("short1")).toBe(false);
    expect(isStrongPassword("alphabetsonly")).toBe(false);
  });

  it("rejects weak or malformed MPINs", () => {
    expect(isAcceptableMpin("482913")).toBe(true);
    expect(isAcceptableMpin("111111")).toBe(false);
    expect(isAcceptableMpin("123456")).toBe(false);
    expect(isAcceptableMpin("654321")).toBe(false);
    expect(isAcceptableMpin("12345")).toBe(false);
    expect(isAcceptableMpin("12a456")).toBe(false);
  });

  it("validates Indian mobile numbers", () => {
    expect(PHONE_RE.test("9934567890")).toBe(true);
    expect(PHONE_RE.test("1234567890")).toBe(false);
    expect(PHONE_RE.test("99345678")).toBe(false);
  });

  it("issues and verifies a JWT carrying the role", () => {
    const token = signToken({ sub: "u-1", role: "CHC_PROVIDER", phone: "9934567890" }, "test-secret");
    const payload = verifyToken(token, "test-secret");
    expect(payload.sub).toBe("u-1");
    expect(payload.role).toBe("CHC_PROVIDER");
    expect(() => verifyToken(token, "other-secret")).toThrow();
  });
});
