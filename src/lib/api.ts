import axios, { AxiosError } from "axios";
import { getMockBackend, persistMockBackend, ApiError, type RegisterInput } from "./mock-backend";
import type { AppUser, AuthResponse, Block, Panchayat, Village } from "./types";

const BASE_URL = import.meta.env["VITE_API_BASE_URL"] as string | undefined;

/** True when no live backend is configured — the mock API answers instead. */
export const OFFLINE_MODE = !BASE_URL;

export const TOKEN_KEY = "jamui.token";

export function readToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY) ?? window.sessionStorage.getItem(TOKEN_KEY);
}

export function writeToken(token: string, remember: boolean) {
  if (typeof window === "undefined") return;
  clearToken();
  (remember ? window.localStorage : window.sessionStorage).setItem(TOKEN_KEY, token);
}

export function clearToken() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(TOKEN_KEY);
  window.sessionStorage.removeItem(TOKEN_KEY);
}

export const http = axios.create({ baseURL: `${BASE_URL ?? ""}/api/v1`, timeout: 15000 });

http.interceptors.request.use((config) => {
  const token = readToken();
  if (token) config.headers.set("Authorization", `Bearer ${token}`);
  return config;
});

http.interceptors.response.use(
  (r) => r,
  (error: AxiosError<{ error?: string }>) => {
    if (error.response?.status === 401) clearToken();
    return Promise.reject(
      new ApiError(
        error.response?.status ?? 0,
        error.response?.data?.error ?? error.message ?? "Network error",
      ),
    );
  },
);

/** Small latency so loading states are visible in offline mode. */
const tick = <T,>(value: T): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(value), 180));

function mockCall<T>(fn: (m: ReturnType<typeof getMockBackend>) => T): Promise<T> {
  try {
    const result = fn(getMockBackend());
    persistMockBackend();
    return tick(result);
  } catch (err) {
    return Promise.reject(err);
  }
}

function requireToken(): string {
  const token = readToken();
  if (!token) throw new ApiError(401, "Please sign in again");
  return token;
}

export const api = {
  blocks: (): Promise<Block[]> =>
    OFFLINE_MODE
      ? mockCall((m) => m.listBlocks())
      : http.get("/locations/blocks").then((r) => r.data.data),

  panchayats: (blockId: number): Promise<Panchayat[]> =>
    OFFLINE_MODE
      ? mockCall((m) => m.listPanchayats(blockId))
      : http.get("/locations/panchayats", { params: { block_id: blockId } }).then((r) => r.data.data),

  villages: (panchayatId: number): Promise<Village[]> =>
    OFFLINE_MODE
      ? mockCall((m) => m.listVillages(panchayatId))
      : http
          .get("/locations/villages", { params: { panchayat_id: panchayatId } })
          .then((r) => r.data.data),

  register: (input: RegisterInput): Promise<AuthResponse> =>
    OFFLINE_MODE
      ? mockCall((m) => m.register(input))
      : http.post("/auth/register", input).then((r) => r.data.data),

  login: (user_id: string, password: string): Promise<AuthResponse> =>
    OFFLINE_MODE
      ? mockCall((m) => m.login(user_id, password))
      : http.post("/auth/login", { user_id, password }).then((r) => r.data.data),

  me: (): Promise<AppUser> =>
    OFFLINE_MODE
      ? mockCall((m) => m.me(requireToken()))
      : http.get("/users/me").then((r) => r.data.data),

  queue: (): Promise<AppUser[]> =>
    OFFLINE_MODE
      ? mockCall((m) => m.queue(requireToken()))
      : http.get("/admin/verification/queue").then((r) => r.data.data),

  decide: (id: string, approve: boolean, reason?: string): Promise<AppUser> =>
    OFFLINE_MODE
      ? mockCall((m) => m.decide(requireToken(), id, approve, reason))
      : http
          .post(`/admin/verification/${id}/${approve ? "approve" : "reject"}`, { reason })
          .then((r) => r.data.data),

  audit: (): Promise<AppUser[]> =>
    OFFLINE_MODE
      ? mockCall((m) => m.audit(requireToken()))
      : http.get("/admin/verification/audit").then((r) => r.data.data),

  saveProfile: (payload: unknown): Promise<{ ok: true }> =>
    OFFLINE_MODE
      ? mockCall(() => ({ ok: true as const }))
      : http.post("/users/profile", payload).then((r) => r.data.data),
};

export { ApiError };
