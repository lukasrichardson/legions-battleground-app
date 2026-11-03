import { mkdirSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

const cli = "node_modules/@playwright/test/cli.js";
function list(shard, testSharding) {
  const result = spawnSync(process.execPath, [cli, "test", "--list", "--forbid-only", "--reporter=json", ...(shard ? [`--shard=${shard}`] : [])], {
    encoding: "utf8",
    env: { ...process.env, E2E_TEST_MODE: "true", E2E_BENCHMARK_TEST_SHARDING: String(testSharding), E2E_BENCHMARK_TIMING_FILE: "" },
    maxBuffer: 20 * 1024 * 1024,
  });
  if (result.error) throw result.error;
  let report;
  try {
    report = JSON.parse(result.stdout);
  } catch {
    throw new Error(`Listing ${shard || "all tests"} failed (exit ${result.status}): ${result.stderr || result.stdout}`);
  }
  if (report.errors?.length) throw new Error(JSON.stringify(report.errors));
  if (result.status !== 0) throw new Error(`Listing ${shard || "all tests"} failed (exit ${result.status}): ${result.stderr}`);
  const ids = [];
  function visit(suite) {
    for (const spec of suite.specs || []) {
      for (const [index, test] of spec.tests.entries()) ids.push(`${spec.id}:${test.projectId}:${index}`);
    }
    for (const child of suite.suites || []) visit(child);
  }
  for (const suite of report.suites) visit(suite);
  return ids;
}

const baseline = list(undefined, false);
if (!baseline.length || new Set(baseline).size !== baseline.length) throw new Error("Baseline inventory is empty or contains duplicate IDs");
const expected = new Set(baseline);
const summary = { baselineCount: baseline.length, configurations: {} };
let valid = true;
for (const [name, count, testSharding] of [["2-file", 2, false], ["4-file", 4, false], ["4-test", 4, true]]) {
  const shards = Array.from({ length: count }, (_, i) => list(`${i + 1}/${count}`, testSharding));
  const all = shards.flat();
  const seen = new Set(all);
  const duplicates = all.filter((id, index) => all.indexOf(id) !== index);
  const missing = baseline.filter((id) => !seen.has(id));
  const extra = all.filter((id) => !expected.has(id));
  summary.configurations[name] = { shardCounts: shards.map((ids) => ids.length), duplicates, missing, extra };
  if (duplicates.length || missing.length || extra.length) valid = false;
}
mkdirSync(".scratch/e2e-benchmark", { recursive: true });
writeFileSync(".scratch/e2e-benchmark/inventory.json", `${JSON.stringify(summary, null, 2)}\n`);
console.log(JSON.stringify(summary, null, 2));
if (!valid) process.exitCode = 1;
