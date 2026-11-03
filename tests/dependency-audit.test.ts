import { describe, expect, it } from "vitest";
import { mkdtempSync, readFileSync, rmdirSync, symlinkSync, unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { evaluateAudit } from "../scripts/audit-dependencies.mjs";

const legacyPath = "node_modules/eslint-config-next/node_modules/minimatch";
const pluginPath = "node_modules/eslint-config-next/node_modules/eslint-plugin-react";
const integrity = "sha512-VgjWUsnnT6n+NUk6eZq77zeFdpW2LWDzP6zFGrCbHXiYNul5Dzqk2HHQ5uFH2DNW5Xbp8+jVzaeNt94ssEEl4w==";
const sourceHash = "746849f267c4868a53729225bd85c7dccd387712136fb305fcc0a3eadd4a3d9d";

function reviewedReport() {
  return {
    status: 1,
    sourceHash,
    lock: { packages: {
      [legacyPath]: { version: "3.1.5", dev: true, integrity },
      [pluginPath]: { dev: true },
    } },
    report: {
      auditReportVersion: 2,
      metadata: { vulnerabilities: { total: 2 } },
      vulnerabilities: {
        minimatch: { name: "minimatch", severity: "moderate", nodes: [legacyPath], via: [{ name: "minimatch", dependency: "minimatch", severity: "moderate", url: "https://github.com/advisories/GHSA-g3hv-75wg-m249" }] },
        "eslint-plugin-react": { name: "eslint-plugin-react", severity: "moderate", nodes: [pluginPath], via: ["minimatch"] },
      } as Record<string, { name: string; severity: string; nodes: string[]; via: (string | Record<string, string>)[] }>,
    },
  };
}

describe("dependency audit exception", () => {
  it("accepts only the reviewed development dependency and reports the exception", () => {
    expect(evaluateAudit(reviewedReport())).toEqual({ ok: true, ignored: true });
  });

  it("accepts a genuinely clean audit without the legacy dependency", () => {
    expect(evaluateAudit({ status: 0, report: { auditReportVersion: 2, vulnerabilities: {}, metadata: { vulnerabilities: { total: 0 } } }, lock: undefined, sourceHash: undefined })).toEqual({ ok: true, ignored: false });
  });

  it("rejects a new advisory even when attached to an allowed package", () => {
    const data = reviewedReport();
    data.report.vulnerabilities.minimatch.via.push({ name: "minimatch", url: "https://github.com/advisories/GHSA-new" });
    expect(evaluateAudit(data).ok).toBe(false);
  });

  it("rejects new indirect findings and unreviewed package paths", () => {
    const data = reviewedReport();
    data.report.vulnerabilities["new-package"] = { name: "new-package", severity: "low", nodes: ["node_modules/new-package"], via: ["minimatch"] };
    data.report.metadata.vulnerabilities.total++;
    expect(evaluateAudit(data).ok).toBe(false);
    delete data.report.vulnerabilities["new-package"];
    data.report.metadata.vulnerabilities.total--;
    data.report.vulnerabilities.minimatch.nodes.push("node_modules/another/minimatch");
    expect(evaluateAudit(data).ok).toBe(false);
  });

  it("rejects changes to the reviewed package and production dependencies", () => {
    const data = reviewedReport();
    data.lock.packages[legacyPath].dev = false;
    expect(evaluateAudit(data).ok).toBe(false);
    data.lock.packages[legacyPath].dev = true;
    data.sourceHash = "changed";
    expect(evaluateAudit(data).ok).toBe(false);
    data.sourceHash = sourceHash;
    data.lock.packages[legacyPath].version = "3.1.4";
    expect(evaluateAudit(data).ok).toBe(false);
  });

  it("fails closed on audit errors, incomplete reports and inconsistent statuses", () => {
    const data = reviewedReport();
    expect(evaluateAudit({ ...data, status: 2 }).ok).toBe(false);
    expect(evaluateAudit({ ...data, status: 0 }).ok).toBe(false);
    expect(evaluateAudit({ ...data, report: { ...data.report, auditReportVersion: 3 } }).ok).toBe(false);
    data.report.metadata.vulnerabilities.total = 3;
    expect(evaluateAudit(data).ok).toBe(false);
    expect(evaluateAudit({ ...data, report: { error: { code: "E500" } } }).ok).toBe(false);
  });
});

it("audits every dependency category even when npm is configured to omit development dependencies", () => {
  const dir = mkdtempSync(join(tmpdir(), "dependency-audit-test-"));
  const cli = join(dir, "npm-cli.cjs");
  const args = join(dir, "args.json");
  try {
    writeFileSync(cli, `require('fs').writeFileSync(process.env.AUDIT_ARGS, JSON.stringify(process.argv.slice(2))); process.stdout.write(JSON.stringify({error:{code:'E500'}})); process.exitCode = 1;`);
    // Windows treats environment names case-insensitively; remove npm's inherited
    // spelling before injecting the stub so only one execpath reaches the child.
    const env = Object.fromEntries(Object.entries(process.env).filter(([key]) => key.toLowerCase() !== "npm_execpath"));
    const result = spawnSync(process.execPath, [resolve("scripts/audit-dependencies.mjs")], {
      env: { ...env, npm_execpath: cli, AUDIT_ARGS: args, NODE_ENV: "production", npm_config_omit: "dev" },
      encoding: "utf8",
    });
    expect(result.status).toBe(1);
    expect(JSON.parse(readFileSync(args, "utf8"))).toEqual(expect.arrayContaining(["audit", "--audit-level=low", "--include=dev", "--include=optional", "--include=peer", "--json"]));
  } finally {
    for (const file of [cli, args]) {
      try { unlinkSync(file); } catch { /* The child may have failed before writing. */ }
    }
    rmdirSync(dir);
  }
});

it.skipIf(process.platform === "win32")("does not silently skip an audit when invoked through a symbolic link", () => {
  const dir = mkdtempSync(join(tmpdir(), "dependency-audit-link-test-"));
  const link = join(dir, "audit.mjs");
  try {
    symlinkSync(resolve("scripts/audit-dependencies.mjs"), link);
    const env = Object.fromEntries(Object.entries(process.env).filter(([key]) => key.toLowerCase() !== "npm_execpath"));
    const result = spawnSync(process.execPath, [link], { env: { ...env, NODE_ENV: process.env.NODE_ENV ?? "test" }, encoding: "utf8" });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("Run this check through npm run audit:dependencies");
  } finally {
    try { unlinkSync(link); } catch { /* The link may not have been created. */ }
    rmdirSync(dir);
  }
});
