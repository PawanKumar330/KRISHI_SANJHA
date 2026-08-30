import type { AppUser } from "./types";

/** Where a signed-in user belongs, based on status and role. */
export function routeForUser(user: AppUser): "/pending" | "/verification" | "/dashboard" {
  if (user.account_status !== "APPROVED") return "/pending";
  if (
    user.role === "VILLAGE_ADMIN" ||
    user.role === "BLOCK_ADMIN" ||
    user.role === "DISTRICT_ADMIN"
  ) {
    return "/verification";
  }
  return "/dashboard";
}
