import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import vm from "node:vm";
import { describe, expect, it, vi } from "vitest";

function loadWorker(workerUrl = "https://app.example/sw.js") {
  const listeners = new Map<string, (event: any) => void>();
  const freshResponse = new Response("cached-image", {
    headers: { "sw-cache-time": Date.now().toString() },
  });
  const cache = { match: vi.fn().mockResolvedValue(freshResponse) };
  const context = {
    URL,
    Response,
    Date,
    Promise,
    setTimeout,
    clearTimeout,
    console: { log: vi.fn(), warn: vi.fn(), error: vi.fn() },
    caches: { open: vi.fn().mockResolvedValue(cache), keys: vi.fn().mockResolvedValue([]) },
    self: {
      location: { href: workerUrl },
      addEventListener: (type: string, listener: (event: any) => void) => listeners.set(type, listener),
      skipWaiting: vi.fn(),
      clients: { claim: vi.fn(), matchAll: vi.fn().mockResolvedValue([]) },
    },
  };
  vm.runInNewContext(readFileSync(resolve(process.cwd(), "public/sw.js"), "utf8"), context);
  return { listeners, cache };
}

async function isIntercepted(workerUrl: string, imageUrl: string, method = "GET"): Promise<boolean> {
  const { listeners } = loadWorker(workerUrl);
  const respondWith = vi.fn();
  listeners.get("fetch")!({ request: { method, url: imageUrl }, respondWith });
  if (respondWith.mock.calls.length) await respondWith.mock.calls[0][0];
  return respondWith.mock.calls.length === 1;
}

describe("R2 service-worker image routing", () => {
  it("intercepts card files on the configured R2 host", async () => {
    await expect(isIntercepted(
      "https://app.example/sw.js?imageHost=cards.example.com",
      "https://cards.example.com/cards/RVL-128-450x616.png",
    )).resolves.toBe(true);
  });

  it("intercepts the current R2 development host", async () => {
    await expect(isIntercepted(
      "https://app.example/sw.js",
      "https://pub-8e94f6b176a84fbd900c0ef39d4b6e5b.r2.dev/cards/RVL-128-450x616.png",
    )).resolves.toBe(true);
  });

  it("does not intercept Toolbox, non-card paths, unsupported files, or writes", async () => {
    expect(await isIntercepted("https://app.example/sw.js", "https://api.legionstoolbox.com/wp-content/uploads/card.png")).toBe(false);
    expect(await isIntercepted("https://app.example/sw.js", "https://pub-8e94f6b176a84fbd900c0ef39d4b6e5b.r2.dev/other/card.png")).toBe(false);
    expect(await isIntercepted("https://app.example/sw.js", "https://pub-8e94f6b176a84fbd900c0ef39d4b6e5b.r2.dev/cards/card.pdf")).toBe(false);
    expect(await isIntercepted("https://app.example/sw.js", "https://pub-8e94f6b176a84fbd900c0ef39d4b6e5b.r2.dev/cards/card.png", "POST")).toBe(false);
  });
});
