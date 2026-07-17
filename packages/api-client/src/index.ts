import { client } from "./client/client.gen";

// Detect browser execution context
const isBrowser = typeof window !== "undefined";

// Determine the correct base URL based on runtime environment
const defaultBaseUrl = isBrowser ? window.location.origin : (process.env.BACKEND_URL || "http://localhost:8081");

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

// Auto-configure the generated API client base settings
client.setConfig({
  baseUrl: defaultBaseUrl,
});

// Dynamically inject the token header on every request
client.interceptors.request.use((request) => {
  const token = getCookieToken();
  if (token) {
    const req = request as any;
    if (!req.headers) {
      req.headers = {};
    }
    if (req.headers instanceof Headers) {
      req.headers.set("Authorization", `Bearer ${token}`);
    } else {
      req.headers["Authorization"] = `Bearer ${token}`;
    }
  }
  return request;
});

export { client } from "./client/client.gen";
export * from "./client/index";
