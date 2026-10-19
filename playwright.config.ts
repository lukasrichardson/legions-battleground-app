import { defineConfig, devices } from "@playwright/test";
import { resolveE2eEnvironment } from "./e2e/environment.mjs";

const env = resolveE2eEnvironment(process.env);
Object.assign(process.env, env);

export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./e2e/global-setup.ts",
  fullyParallel: false,
  workers: 1,
  timeout: 120_000,
  retries: process.env.CI ? 1 : 0,
  reporter: [["html", { open: "never" }], ["list"]],
  use: {
    baseURL: env.NEXTAUTH_URL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run dev",
    url: `${env.NEXTAUTH_URL}/healthz`,
    reuseExistingServer: false,
    env: { ...env, PORT: new URL(env.NEXTAUTH_URL).port || "3000" },
    timeout: 120_000,
  },
});
