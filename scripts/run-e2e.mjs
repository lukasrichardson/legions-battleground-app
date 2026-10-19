import { spawnSync } from "node:child_process";
import { resolveE2eEnvironment } from "../e2e/environment.mjs";

const composeFile = "docker-compose.e2e.yml";
const playwrightCli = "node_modules/@playwright/test/cli.js";
const environment = {
  ...process.env,
  E2E_TEST_MODE: "true",
  ...resolveE2eEnvironment({ ...process.env, E2E_TEST_MODE: "true" }),
};

const run = (command, args) => {
  const result = spawnSync(command, args, { stdio: "inherit", env: environment });
  if (result.error) throw result.error;
  return result.status ?? 1;
};

try {
  if (run(process.execPath, [playwrightCli, "install", "chromium"]) !== 0) process.exitCode = 1;
  else if (run("docker", ["compose", "-f", composeFile, "up", "--detach", "--wait"]) !== 0) process.exitCode = 1;
  else process.exitCode = run(process.execPath, [playwrightCli, "test", ...process.argv.slice(2)]);
} finally {
  run("docker", ["compose", "-f", composeFile, "down", "--volumes", "--remove-orphans"]);
}
