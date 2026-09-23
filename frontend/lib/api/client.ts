import { clearAuth, getStoredToken } from "@/lib/auth/storage";

export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly fieldErrors?: Record<string, string[] | undefined>;

  constructor(
    message: string,
    status: number,
    options?: {
      code?: string;
      fieldErrors?: Record<string, string[] | undefined>;
    },
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = options?.code;
    this.fieldErrors = options?.fieldErrors;
  }
}

function getApiBaseUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
  if (fromEnv) {
    return fromEnv;
  }

  if (process.env.NODE_ENV === "development") {
    return "http://localhost:4000";
  }

  throw new Error("NEXT_PUBLIC_API_URL is not configured");
}

function readApiError(data: unknown): {
  message?: string;
  code?: string;
  fieldErrors?: Record<string, string[] | undefined>;
} {
  if (!data || typeof data !== "object") {
    return {};
  }

  const body = data as {
    message?: unknown;
    error?: { code?: unknown; message?: unknown };
    errors?: { fieldErrors?: Record<string, string[] | undefined> };
  };

  const fieldErrors = body.errors?.fieldErrors;
  const firstFieldError = fieldErrors
    ? Object.values(fieldErrors).find((messages) => messages && messages.length > 0)?.[0]
    : undefined;

  const message =
    (typeof body.error?.message === "string" && body.error.message) ||
    (typeof body.message === "string" && body.message !== "Validation failed"
      ? body.message
      : undefined) ||
    firstFieldError;

  return {
    message: message || undefined,
    code: typeof body.error?.code === "string" ? body.error.code : undefined,
    fieldErrors,
  };
}

async function parseJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function isAuthPath(path: string) {
  return path.startsWith("/api/auth/login") || path.startsWith("/api/auth/register");
}

export function readCollection<T>(
  response:
    | {
        data?: T[] | null;
        pagination?: { totalPages?: number } | null;
      }
    | null
    | undefined,
): { items: T[]; totalPages: number } {
  const items = Array.isArray(response?.data) ? response.data : [];
  const totalPages = response?.pagination?.totalPages;
  return {
    items,
    totalPages:
      typeof totalPages === "number" && Number.isFinite(totalPages) && totalPages > 0
        ? totalPages
        : 1,
  };
}

export function toQueryString(
  params: Record<string, string | number | boolean | undefined>,
): string {
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === "") {
      continue;
    }
    query.set(key, String(value));
  }

  const serialized = query.toString();
  return serialized ? `?${serialized}` : "";
}

export async function apiRequest<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const token = getStoredToken();

  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    ...options,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });

  const data = await parseJson(response);

  if (!response.ok) {
    if (response.status === 401 && !isAuthPath(path)) {
      clearAuth();
    }

    const parsed = readApiError(data);
    throw new ApiError(
      parsed.message ?? "Something went wrong. Please try again.",
      response.status,
      {
        code: parsed.code,
        fieldErrors: parsed.fieldErrors,
      },
    );
  }

  return data as T;
}
