import axios from "axios";

const safeMethods = new Set(["GET", "HEAD", "OPTIONS"]);
let pendingToken: Promise<string> | undefined;

/** Coalesce concurrent reads, but refresh before each new batch of writes. */
export function getCsrfToken(): Promise<string> {
  if (!pendingToken) {
    pendingToken = fetch("/api/csrf", { credentials: "same-origin", cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Unable to authorize this change. Please sign in again.");
        const data = await response.json();
        if (typeof data.csrfToken !== "string" || !data.csrfToken) throw new Error("Missing CSRF token");
        return data.csrfToken;
      })
      .finally(() => { pendingToken = undefined; });
  }
  return pendingToken;
}

function isSameOrigin(url: string): boolean {
  return new URL(url, window.location.origin).origin === window.location.origin;
}

/** Use for application fetch writes; external requests never receive our token. */
export async function csrfFetch(url: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  if (!safeMethods.has((init.method ?? "GET").toUpperCase()) && isSameOrigin(url)) {
    headers.set("x-csrf-token", await getCsrfToken());
  }
  return fetch(url, { ...init, headers });
}

// A dedicated instance keeps authentication tokens away from third-party clients.
const http = axios.create();
http.interceptors.request.use(async (config) => {
  const url = http.getUri(config);
  if (!safeMethods.has((config.method ?? "GET").toUpperCase()) && isSameOrigin(url)) {
    config.headers.set("x-csrf-token", await getCsrfToken());
  }
  return config;
});

export default http;
