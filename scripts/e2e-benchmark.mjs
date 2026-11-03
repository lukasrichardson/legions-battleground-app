import { mkdirSync, readFileSync, appendFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

const directory = resolve(".scratch/e2e-benchmark");
mkdirSync(directory, { recursive: true });
const timingFile = resolve(directory, "timings.jsonl");
writeFileSync(timingFile, "");
const record = (event) => appendFileSync(timingFile, `${JSON.stringify({ event, timestamp: Date.now() })}\n`);

record("playwright_process_start");
const result = spawnSync(process.execPath, ["node_modules/@playwright/test/cli.js", "test", ...process.argv.slice(2)], {
  stdio: "inherit",
  env: { ...process.env, E2E_BENCHMARK_TIMING_FILE: timingFile },
});
record("playwright_process_end");

const events = readFileSync(timingFile, "utf8").trim().split("\n").map((line) => JSON.parse(line));
const at = (event) => events.find((entry) => entry.event === event)?.timestamp;
const phases = [
  ["Process start to global setup (includes Playwright and server startup)", "playwright_process_start", "global_setup_start"],
  ["Database connection and seed", "global_setup_start", "database_seeded"],
  ["Route warmup", "database_seeded", "routes_warmed"],
  ["Playwright test execution", "tests_start", "tests_end"],
  ["Total Playwright process", "playwright_process_start", "playwright_process_end"],
];
const lines = ["## E2E benchmark timings", "", "| Phase | Seconds |", "| --- | ---: |"];
for (const [label, start, end] of phases) {
  const duration = at(start) !== undefined && at(end) !== undefined ? ((at(end) - at(start)) / 1000).toFixed(2) : "unavailable";
  lines.push(`| ${label} | ${duration} |`);
}
const summary = `${lines.join("\n")}\n`;
console.log(summary);
writeFileSync(resolve(directory, "summary.md"), summary);
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary);
if (result.error) console.error(result.error);
process.exitCode = result.status ?? 1;
