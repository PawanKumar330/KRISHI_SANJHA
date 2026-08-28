import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const ROUNDS = Number(process.env["BCRYPT_ROUNDS"] ?? 10);

/** 10-digit Indian mobile number. */
export const PHONE_RE = /^[6-9]\d{9}$/;
/** MPIN is exactly 6 digits (govt-portal style). */
export const MPIN_RE = /^\d{6}$/;

export function isStrongPassword(password: string): boolean {
  return (
    typeof password === "string" &&
    password.length >= 8 &&
    password.length <= 72 &&
    /[A-Za-z]/.test(password) &&
    /\d/.test(password)
  );
}

/** Trivially guessable MPINs are rejected (1111.., 123456, 654321). */
export function isAcceptableMpin(mpin: string): boolean {
  if (!MPIN_RE.test(mpin)) return false;
  if (/^(\d)\1{5}$/.test(mpin)) return false;
  if ("0123456789".includes(mpin) || "9876543210".includes(mpin)) return false;
  return true;
}

export async function hashSecret(plain: string): Promise<string> {
  return bcrypt.hash(plain, ROUNDS);
}

export async function verifySecret(plain: string, hash: string | null | undefined): Promise<boolean> {
  if (!hash) return false;
  return bcrypt.compare(plain, hash);
}

export type JwtPayload = { sub: string; role: string; phone: string };

export function signToken(payload: JwtPayload, secret = process.env["JWT_SECRET"] ?? "dev-secret"): string {
  return jwt.sign(payload, secret, { expiresIn: process.env["JWT_TTL"] ?? "7d" });
}

export function verifyToken(token: string, secret = process.env["JWT_SECRET"] ?? "dev-secret"): JwtPayload {
  return jwt.verify(token, secret) as JwtPayload;
}
