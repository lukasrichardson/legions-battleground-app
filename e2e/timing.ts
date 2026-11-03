import { appendFileSync } from "node:fs";

// The benchmark provides a per-job path outside Playwright's cleaned output directory.
export function recordBenchmarkTiming(event: string) {
  const file = process.env.E2E_BENCHMARK_TIMING_FILE;
  if (file) appendFileSync(file, `${JSON.stringify({ event, timestamp: Date.now() })}\n`);
}
