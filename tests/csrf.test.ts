import express from "express";
import cookieParser from "cookie-parser";
import { encode } from "next-auth/jwt";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createCsrfProtection } from "@/server/middleware/csrf";

describe("CSRF boundary with real NextAuth JWTs and Express middleware", () => {
  const secret = "csrf-test-secret-with-sufficient-entropy-for-tests-only";
  const trustedOrigin = "http://app.example.test";
  let server: Server;
  let url: string;
  let session: string;
  let anotherSession: string;
  let refreshedSession: string;

  beforeAll(async () => {
    session = await encode({ token: { sub: "player-1", csrfSessionId: "login-1" }, secret });
    anotherSession = await encode({ token: { sub: "player-1", csrfSessionId: "login-2" }, secret });
    refreshedSession = await encode({ token: { sub: "player-1", csrfSessionId: "login-1" }, secret });
    const app = express();
    app.use(cookieParser());
    app.use(createCsrfProtection(trustedOrigin, secret));
    app.all("/api/decks", (_req, res) => res.status(204).end());
    app.post("/api/auth/callback/provider", (_req, res) => res.sendStatus(202));
    server = await new Promise<Server>((resolve) => {
      const listener = app.listen(0, "127.0.0.1", () => resolve(listener));
    });
    url = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  });
  afterAll(() => new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve())));

  async function tokenPair() {
    const response = await fetch(`${url}/api/csrf`, { headers: { cookie: `next-auth.session-token=${session}` } });
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toContain("no-store");
    expect(response.headers.get("set-cookie")).toMatch(/HttpOnly; SameSite=Strict/i);
    const { csrfToken } = await response.json();
    const cookie = response.headers.getSetCookie()[0].split(";")[0];
    return { csrfToken, cookie };
  }

  const write = (extra: Record<string, string> = {}, method = "POST") => fetch(`${url}/api/decks`, {
    method, headers: { cookie: `next-auth.session-token=${session}`, origin: trustedOrigin, ...extra },
  });

  it("requires authentication to obtain a token", async () => {
    expect((await fetch(`${url}/api/csrf`)).status).toBe(401);
  });
  it.each(["POST", "PUT", "PATCH", "DELETE"])("blocks a cookie-authenticated %s without a token", async (method) => {
    const response = await write({}, method);
    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({ code: "EBADCSRFTOKEN" });
  });
  it("accepts the token only when both its cookie and request header are present", async () => {
    const { csrfToken, cookie } = await tokenPair();
    expect((await write({ "x-csrf-token": csrfToken })).status).toBe(403);
    const cookies = `next-auth.session-token=${session}; ${cookie}`;
    expect((await write({ cookie: cookies })).status).toBe(403);
    expect((await write({ cookie: cookies, "x-csrf-token": csrfToken })).status).toBe(204);
  });
  it("rejects forged matching cookies and headers", async () => {
    const forged = `${"a".repeat(64)}.${"b".repeat(64)}`;
    expect((await write({ cookie: `next-auth.session-token=${session}; legions.csrf=${forged}`, "x-csrf-token": forged })).status).toBe(403);
  });
  it("binds tokens to the session rather than only the account ID", async () => {
    const { csrfToken, cookie } = await tokenPair();
    expect((await write({ cookie: `next-auth.session-token=${anotherSession}; ${cookie}`, "x-csrf-token": csrfToken })).status).toBe(403);
  });
  it("retains CSRF validity when NextAuth refreshes the JWT for the same login", async () => {
    const { csrfToken, cookie } = await tokenPair();
    expect((await write({ cookie: `next-auth.session-token=${refreshedSession}; ${cookie}`, "x-csrf-token": csrfToken })).status).toBe(204);
  });
  it.each(["https://attacker.test", "null", "http://app.example.test.attacker.test"])("rejects foreign Origin %s even with a valid token", async (origin) => {
    const { csrfToken, cookie } = await tokenPair();
    expect((await write({ cookie: `next-auth.session-token=${session}; ${cookie}`, "x-csrf-token": csrfToken, origin })).status).toBe(403);
  });
  it("rejects cross-site token reads and forged Fetch Metadata", async () => {
    expect((await fetch(`${url}/api/csrf`, { headers: { cookie: `next-auth.session-token=${session}`, "sec-fetch-site": "cross-site" } })).status).toBe(403);
  });
  it.each(["GET", "HEAD", "OPTIONS"])("keeps safe %s requests public", async (method) => {
    expect((await fetch(`${url}/api/decks`, { method })).status).toBe(204);
  });
  it("leaves NextAuth callbacks to their own CSRF validation", async () => {
    expect((await fetch(`${url}/api/auth/callback/provider`, { method: "POST" })).status).toBe(202);
    expect((await fetch(`${url}/api/authentication`, { method: "POST" })).status).toBe(401);
  });
});
