import Redis from "ioredis";

export const redis = new Redis(process.env["REDIS_URL"] ?? "redis://localhost:6379", {
  lazyConnect: true,
  maxRetriesPerRequest: 2,
});

/** Session record kept alongside the JWT so tokens can be revoked on logout. */
export async function storeSession(userId: string, token: string, ttlSeconds = 7 * 24 * 3600) {
  await redis.set(`session:${token}`, userId, "EX", ttlSeconds);
}

export async function revokeSession(token: string) {
  await redis.del(`session:${token}`);
}
