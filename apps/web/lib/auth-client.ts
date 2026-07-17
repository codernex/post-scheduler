import { client } from "@repo/api-client/client";

// Client-side cookie helpers
export function setTokenCookie(token: string) {
  // Save for 7 days
  const maxAge = 7 * 24 * 60 * 60;
  document.cookie = `token=${token}; path=/; max-age=${maxAge}; SameSite=Lax`;
  // Configure the api-client with the token
  client.setConfig({
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export function getTokenCookie(): string | null {
  if (typeof document === "undefined") return null;
  const name = "token=";
  const decodedCookie = decodeURIComponent(document.cookie);
  const ca = decodedCookie.split(";");
  for (let i = 0; i < ca.length; i++) {
    const item = ca[i];
    if (item) {
      const c = item.trim();
      if (c.indexOf(name) === 0) {
        return c.substring(name.length, c.length);
      }
    }
  }
  return null;
}

export function removeTokenCookie() {
  document.cookie =
    "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Lax";
  // Clear Authorization header in client
  client.setConfig({
    headers: {
      Authorization: undefined,
    },
  });
}

export function initializeAuthClient() {
  const token = getTokenCookie();
  const baseUrl = typeof window !== "undefined" ? "" : (process.env.BACKEND_URL || "http://localhost:8081");
  client.setConfig({
    baseUrl,
    headers: token ? {
      Authorization: `Bearer ${token}`,
    } : undefined,
  });
}
