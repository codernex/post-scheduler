import { client } from "./client/client.gen";

// Detect browser execution context
const isBrowser = typeof window !== "undefined";

// Determine the correct base URL based on runtime environment
const defaultBaseUrl = isBrowser ? "" : (process.env.BACKEND_URL || "http://localhost:8081");

// Helper to retrieve the JWT token from cookies on browser request
function getCookieToken(): string | null {
  if (!isBrowser) return null;
  const name = "token=";
  const decodedCookie = decodeURIComponent(document.cookie);
  const ca = decodedCookie.split(";");
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    if (c) {
      c = c.trim();
      if (c.indexOf(name) === 0) {
        return c.substring(name.length, c.length);
      }
    }
  }
  return null;
}

const token = getCookieToken();

// Auto-configure the generated API client base settings
client.setConfig({
  baseUrl: defaultBaseUrl,
  headers: token
    ? {
        Authorization: `Bearer ${token}`,
      }
    : undefined,
});

export { client } from "./client/client.gen";
export * from "./client/index";
