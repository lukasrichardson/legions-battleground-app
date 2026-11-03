import type { Reporter } from "@playwright/test/reporter";
import { recordBenchmarkTiming } from "./timing";

export default class TimingReporter implements Reporter {
  onBegin() { recordBenchmarkTiming("tests_start"); }
  onEnd() { recordBenchmarkTiming("tests_end"); }
}
