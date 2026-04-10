import type { ApiOk, ApiResponse } from "@/types/dto";
import { errorCodeLabel } from "@/constants/errors";
import i18n from "@/i18n";
import { message } from "antd";
import { mockRequest } from "@/services/adapters/mock";

const API_PREFIX = "/api/v1";

export class ApiError extends Error {
  constructor(
    public readonly code: string,
    msg: string,
  ) {
    super(msg);
    this.name = "ApiError";
  }
}

function getUseMock(): boolean {
  return import.meta.env.VITE_USE_MOCK === "true";
}

export function getToken(): string | null {
  return localStorage.getItem("goed2k_token");
}

export function setToken(token: string | null): void {
  if (token) localStorage.setItem("goed2k_token", token);
  else localStorage.removeItem("goed2k_token");
}

function buildUrl(path: string): string {
  const base = import.meta.env.VITE_API_BASE ?? "";
  const p = path.startsWith("/") ? path : `/${path}`;
  if (base) {
    const b = base.endsWith("/") ? base.slice(0, -1) : base;
    return `${b}${API_PREFIX}${p}`;
  }
  return `${API_PREFIX}${p}`;
}

export async function apiRequest<T>(
  path: string,
  init: RequestInit & { skipAuth?: boolean } = {},
): Promise<T> {
  const { skipAuth, ...rest } = init;
  const headers = new Headers(rest.headers);

  if (rest.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json; charset=utf-8");
  }

  if (!skipAuth) {
    const token = getToken();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
      headers.set("X-Auth-Token", token);
    }
  }

  if (getUseMock()) {
    const json = await mockRequest<T>(path, rest);
    return unwrap(json);
  }

  const res = await fetch(buildUrl(path), { ...rest, headers });
  let json: ApiResponse<T>;
  try {
    json = (await res.json()) as ApiResponse<T>;
  } catch {
    message.error(i18n.t("api.requestFailed", { status: res.status }));
    throw new ApiError("BAD_REQUEST", `HTTP ${res.status}`);
  }

  return unwrap(json);
}

function unwrap<T>(json: ApiResponse<T>): T {
  if (json.code === "OK") {
    return (json as ApiOk<T>).data;
  }
  const err = json as { code: string; message?: string };
  const msg = err.message || errorCodeLabel(err.code);
  message.error(msg);
  throw new ApiError(err.code, msg);
}

export async function apiGet<T>(path: string, skipAuth?: boolean): Promise<T> {
  return apiRequest<T>(path, { method: "GET", skipAuth });
}

export async function apiPost<T>(path: string, body?: unknown, skipAuth?: boolean): Promise<T> {
  return apiRequest<T>(path, {
    method: "POST",
    body: body === undefined ? undefined : JSON.stringify(body),
    skipAuth,
  });
}

export async function apiPut<T>(path: string, body: unknown, skipAuth?: boolean): Promise<T> {
  return apiRequest<T>(path, {
    method: "PUT",
    body: JSON.stringify(body),
    skipAuth,
  });
}

export async function apiDelete<T>(path: string, skipAuth?: boolean): Promise<T> {
  return apiRequest<T>(path, { method: "DELETE", skipAuth });
}
