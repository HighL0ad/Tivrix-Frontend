type ApiRequestOptions = RequestInit & {
  json?: unknown;
  redirectOnUnauthorized?: boolean;
};

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly payload: unknown,
  ) {
    super(message);
  }
}

export async function apiRequest<T>(
  path: string,
  { json, headers, redirectOnUnauthorized = true, ...options }: ApiRequestOptions = {},
): Promise<T> {
  const response = await fetch(path, {
    ...options,
    credentials: "include",
    headers: {
      ...(json === undefined ? {} : { "Content-Type": "application/json" }),
      ...headers,
    },
    body: json === undefined ? options.body : JSON.stringify(json),
  });

  const contentType = response.headers.get("content-type") ?? "";
  const payload = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (response.status === 401 && redirectOnUnauthorized) {
    window.location.assign("/login");
  }

  if (!response.ok) {
    throw new ApiError("API request failed", response.status, payload);
  }

  return payload as T;
}
