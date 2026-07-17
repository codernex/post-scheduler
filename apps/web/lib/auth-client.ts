import { client } from "@repo/api-client";

// Client-side cookie helpers
export function setTokenCookie(token: string) {
  // Save for 7 days
  const maxAge = 7 * 24 * 60 * 60;
  document.cookie = `token=${token}; path=/; max-age=${maxAge}; SameSite=Lax`;
  // Configure the api-client with the token immediately
  initializeAuthClient();
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
  // Clear config base
  initializeAuthClient();
}

export function initializeAuthClient() {
  const baseUrl = typeof window !== "undefined" ? window.location.origin : (process.env.BACKEND_URL || "http://localhost:8081");
  console.log("[PostScheduler AuthClient] Initializing client with baseUrl:", baseUrl);
  client.setConfig({
    baseUrl,
  });

  // Dynamically inject the token header on every request
  const clientWithMeta = client as unknown as { _hasAuthInterceptor?: boolean };
  const hasAuthInterceptor = clientWithMeta._hasAuthInterceptor;
  if (!hasAuthInterceptor) {
    console.log("[PostScheduler AuthClient] Registering request interceptor...");
    client.interceptors.request.use((request) => {
      const currentToken = getTokenCookie();
      console.log("[PostScheduler Interceptor] Request URL:", request.url, "Found Token:", currentToken ? "YES (first 10 chars: " + currentToken.substring(0, 10) + "...)" : "NO");
      const req = request as unknown as { headers?: Record<string, string> | Headers };
      if (currentToken) {
        if (!req.headers) {
          req.headers = {};
        }
        if (req.headers instanceof Headers) {
          req.headers.set("Authorization", `Bearer ${currentToken}`);
        } else {
          req.headers["Authorization"] = `Bearer ${currentToken}`;
        }
      } else {
        if (req.headers && !(req.headers instanceof Headers)) {
          delete req.headers["Authorization"];
        } else if (req.headers instanceof Headers) {
          req.headers.delete("Authorization");
        }
      }
      return request;
    });
    clientWithMeta._hasAuthInterceptor = true;
  }
}

// Run initialization immediately on module load to secure client configurations
initializeAuthClient();
