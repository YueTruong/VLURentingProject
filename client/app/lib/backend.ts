const DEFAULT_BACKEND_PORT =
  process.env.NEXT_PUBLIC_BACKEND_PORT || "3001";

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, "");

const buildRuntimeBackendUrl = () => {
  if (typeof window === "undefined") {
    return `http://localhost:${DEFAULT_BACKEND_PORT}`;
  }

  const { protocol, hostname } = window.location;
  return `${protocol}//${hostname}:${DEFAULT_BACKEND_PORT}`;
};

export const getBackendUrl = () =>
  trimTrailingSlash(
    process.env.NEXT_PUBLIC_API_URL ||
      process.env.NEXT_PUBLIC_BACKEND_URL ||
      buildRuntimeBackendUrl(),
  );

export const getAuthorizationHeader = (token: string) => `Bearer ${token}`;

export const createAuthHeaders = (
  token: string,
  headers: Record<string, string> = {},
) => ({
  ...headers,
  Authorization: getAuthorizationHeader(token),
});
