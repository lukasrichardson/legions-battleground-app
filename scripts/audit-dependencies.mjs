import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

// GHSA-g3hv-75wg-m249 describes an optimizer absent from the exact 3.1.5
// package below. GitHub's broader affected range is still under review.
const legacyPath = "node_modules/eslint-config-next/node_modules/minimatch";
const legacyIntegrity = "sha512-VgjWUsnnT6n+NUk6eZq77zeFdpW2LWDzP6zFGrCbHXiYNul5Dzqk2HHQ5uFH2DNW5Xbp8+jVzaeNt94ssEEl4w==";
const legacySourceHash = "746849f267c4868a53729225bd85c7dccd387712136fb305fcc0a3eadd4a3d9d";
const advisoryUrl = "https://github.com/advisories/GHSA-g3hv-75wg-m249";
const allowed = {
  "eslint-config-next": { path: "node_modules/eslint-config-next", via: ["eslint-plugin-import", "eslint-plugin-jsx-a11y", "eslint-plugin-react"] },
  "eslint-plugin-import": { path: "node_modules/eslint-config-next/node_modules/eslint-plugin-import", via: ["minimatch"] },
  "eslint-plugin-jsx-a11y": { path: "node_modules/eslint-config-next/node_modules/eslint-plugin-jsx-a11y", via: ["minimatch"] },
  "eslint-plugin-react": { path: "node_modules/eslint-config-next/node_modules/eslint-plugin-react", via: ["minimatch"] },
};

export function evaluateAudit({ report, status, lock, sourceHash }) {
  const findings = report?.vulnerabilities;
  const total = report?.metadata?.vulnerabilities?.total;
  if (report?.error || report?.auditReportVersion !== 2 || !findings || typeof findings !== "object" || Array.isArray(findings)
      || !Number.isInteger(total) || total !== Object.keys(findings).length || ![0, 1].includes(status)) {
    return { ok: false, reason: "npm audit did not return a complete, supported report" };
  }
  if (total === 0) return status === 0
    ? { ok: true, ignored: false }
    : { ok: false, reason: "npm audit failed without reporting vulnerabilities" };
  if (status !== 1) return { ok: false, reason: "npm audit returned an inconsistent exit status" };
  const minimatch = findings.minimatch;
  const pkg = lock?.packages?.[legacyPath];
  if (pkg?.version !== "3.1.5" || pkg.dev !== true || pkg.integrity !== legacyIntegrity || sourceHash !== legacySourceHash
      || minimatch?.name !== "minimatch" || minimatch?.severity !== "moderate" || minimatch?.nodes?.length !== 1 || minimatch.nodes[0] !== legacyPath
      || minimatch?.via?.length !== 1 || typeof minimatch.via[0] !== "object"
      || minimatch.via[0]?.url !== advisoryUrl || minimatch.via[0]?.name !== "minimatch"
      || minimatch.via[0]?.dependency !== "minimatch" || minimatch.via[0]?.severity !== "moderate") {
    return { ok: false, reason: "findings do not match the reviewed minimatch exception" };
  }
  for (const [name, finding] of Object.entries(findings)) {
    if (name === "minimatch") continue;
    const rule = allowed[name];
    if (!rule || finding.name !== name || lock?.packages?.[rule.path]?.dev !== true
        || finding.severity !== "moderate" || finding.nodes?.length !== 1 || finding.nodes[0] !== rule.path
        || !Array.isArray(finding.via) || finding.via.length === 0
        || finding.via.some((cause) => typeof cause !== "string" || !rule.via.includes(cause) || !findings[cause])) {
      return { ok: false, reason: `unreviewed audit finding: ${name}` };
    }
  }
  return { ok: true, ignored: true };
}

function main() {
  const npmCli = process.env.npm_execpath;
  if (!npmCli) {
    console.error("Run this check through npm run audit:dependencies.");
    process.exit(1);
  }
  // Override NODE_ENV and npm omit settings so no dependency category escapes audit.
  const result = spawnSync(process.execPath, [npmCli, "audit", "--audit-level=low", "--include=dev", "--include=optional", "--include=peer", "--json"], { encoding: "utf8", maxBuffer: 20 * 1024 * 1024 });
  if (result.stderr) process.stderr.write(result.stderr);
  if (result.error) {
    console.error("Could not run npm audit:", result.error.message);
    process.exit(1);
  }
  let report;
  try {
    report = JSON.parse(result.stdout);
  } catch {
    console.error("Could not parse npm audit output:", result.stdout);
    process.exit(1);
  }
  let lock;
  let sourceHash;
  try {
    lock = JSON.parse(readFileSync("package-lock.json", "utf8"));
    sourceHash = createHash("sha256").update(readFileSync("node_modules/eslint-config-next/node_modules/minimatch/minimatch.js")).digest("hex");
  } catch (error) {
    // A missing reviewed package is fine if npm audit reports a clean tree.
    if (report?.metadata?.vulnerabilities?.total !== 0) console.error("Could not verify reviewed package:", error.message);
  }
  const outcome = evaluateAudit({ report, status: result.status, lock, sourceHash });
  if (!outcome.ok) {
    console.error(`Dependency audit failed: ${outcome.reason}`);
    console.error(JSON.stringify(report, null, 2));
    process.exit(1);
  }
  if (outcome.ignored) {
    console.warn("npm audit reports GHSA-g3hv-75wg-m249 for minimatch 3.1.5 and its ESLint dependents. A narrowly scoped temporary exception was applied; see docs/testing-and-quality.md.");
  } else {
    console.log("npm audit found no vulnerabilities.");
  }
}

// Importing the policy in tests must not start an audit or exit the test runner.
if (import.meta.main) main();
