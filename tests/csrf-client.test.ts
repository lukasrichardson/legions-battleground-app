import { afterEach, describe, expect, it, vi } from "vitest";
import http, { csrfFetch, getCsrfToken } from "@/client/utils/http";

afterEach(() => vi.unstubAllGlobals());

function setupFetch() {
  vi.stubGlobal("window", { location: { origin: "https://app.test" } });
  const request = vi.fn().mockImplementation(async (url: string) => new Response(JSON.stringify(
    url === "/api/csrf" ? { csrfToken: "signed-token" } : { ok: true },
  )));
  vi.stubGlobal("fetch", request);
  return request;
}

describe("CSRF-aware application HTTP clients", () => {
  it("adds the token to fetch writes while retaining caller headers", async () => {
    const request = setupFetch();
    await csrfFetch("/api/me/alias", { method: "PUT", headers: { "Content-Type": "application/json" }, body: "{}" });
    const headers = request.mock.calls[1][1].headers as Headers;
    expect(headers.get("x-csrf-token")).toBe("signed-token");
    expect(headers.get("Content-Type")).toBe("application/json");
  });
  it("does not fetch or leak tokens for reads or foreign-origin requests", async () => {
    const request = setupFetch();
    await csrfFetch("/api/me/alias");
    await csrfFetch("https://outside.test/write", { method: "POST" });
    expect(request.mock.calls.map(([url]) => url)).toEqual(["/api/me/alias", "https://outside.test/write"]);
    expect((request.mock.calls[1][1].headers as Headers).has("x-csrf-token")).toBe(false);
  });
  it("coalesces concurrent token reads but refreshes after authentication can change", async () => {
    const request = setupFetch();
    await Promise.all([getCsrfToken(), getCsrfToken()]);
    expect(request).toHaveBeenCalledTimes(1);
    await getCsrfToken();
    expect(request).toHaveBeenCalledTimes(2);
  });
  it("does not submit the mutation if token retrieval fails", async () => {
    const request = setupFetch().mockResolvedValue(new Response("{}", { status: 401 }));
    await expect(csrfFetch("/api/me/alias", { method: "DELETE" })).rejects.toThrow("sign in again");
    expect(request).toHaveBeenCalledTimes(1);
  });
  it("protects Axios writes, including JSON Patch and empty-body DELETE", async () => {
    setupFetch();
    const adapter = vi.fn(async (config) => ({ config, status: 200, statusText: "OK", headers: {}, data: {} }));
    await http.patch("/api/decks/1", [], { adapter, headers: { "Content-Type": "application/json-patch+json" } });
    await http.delete("/api/decks/1", { adapter });
    expect(adapter.mock.calls[0][0].headers.get("x-csrf-token")).toBe("signed-token");
    expect(adapter.mock.calls[0][0].headers.get("Content-Type")).toBe("application/json-patch+json");
    expect(adapter.mock.calls[1][0].headers.get("x-csrf-token")).toBe("signed-token");
  });
});
