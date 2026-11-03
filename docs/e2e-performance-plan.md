# E2E performance plan

Reduce the time until the last required PR E2E shard finishes, aiming for roughly half the current median if measurements support it. Keep the complete browser suite required while evaluating changes. Track first-attempt failures, retries and runner minutes as well as elapsed time; agree on acceptable reliability and cost before changing the gate.

## 1. Measure and compare (current stage)

Use the manually dispatched **E2E benchmark (optional)** workflow on the same commit to compare `2-file` (the current distribution), `4-file`, and `4-test` (test-level distribution). Run each configuration several times under comparable load; repeat on representative commits. The existing PR workflow remains the required gate. Each benchmark shard uses one worker, its own MongoDB service and its own server. The inventory job checks that all three distributions contain every baseline test exactly once and rejects focused tests, which could otherwise give a misleading inventory. Treat an inventory failure as an invalid benchmark even if the independent shard jobs pass.

Compare job and step timestamps in GitHub Actions for queueing, service startup, dependency and browser installation, and the time until the last shard completes. Each shard uploads a timing summary, raw timestamps, the Playwright JSON report and failure evidence. The process-to-global-setup interval includes Playwright initialization **and** server startup; database seeding and route warming are measured separately. The test interval comes from Playwright reporter callbacks; the whole process also includes reporter and shutdown overhead. Missing timing events are shown as unavailable if setup or execution fails. Compare retries and first-attempt failures separately from successful durations.

The workflow is manual and non-required; its inventory job runs independently of benchmark shards and should not be included in shard completion timings. Dispatch each configuration separately using the same branch and commit. Workflow dispatch can only be used once the workflow exists on the repository's default branch; select the target branch in the Actions UI. The benchmark is not a replacement for the PR check and no CI results exist until it is run on GitHub.

Use the median as the initial comparison and collect enough runs before interpreting tail latency. Include the required quality job in the overall PR wait analysis. The local report and a single CI report are leads, not a CI baseline. Prefer a measured distribution change over splitting files solely to influence scheduling: test-level sharding balances test counts, not execution times, and a single long test remains indivisible.

Before proposing a new distribution, repeatedly run write-heavy and multiplayer scenarios individually and in varied orders. A separate database per shard does not isolate tests within a shard: shared users, seeded decks and in-memory rooms can still leak state. Fix observed interference with isolated fixtures or reliable restoration, including failure and retry paths.

## 2. Remove measured repeated work

Target the largest costs identified above. Reuse per-job authentication state for suitable tests, after the seed and server are ready, in fresh browser contexts; keep state files out of commits and artifacts. Keep real authentication and account-mutation journeys and isolate tests that change shared account state. Consider extracting the existing `/createRoom` API fixture for tests that do not cover lobby creation, while preserving real create, join, multiplayer synchronization and reconnect coverage.

Benchmark installation and startup changes independently, including the Chromium headless shell and production builds, with complete job time and runner minutes. Use deterministic local card images where external delivery is not the behavior under test, preserving realistic loading and dimensions; decide separately how to monitor real image delivery.

## 3. Refine coverage and adopt only after validation

Map expensive cases by behavior, route, breakpoint, input method and regression before removing duplication or moving it to a lower test layer. Preserve real persistence, security, touch, keyboard, clipping, drag-and-drop and multiplayer boundaries. Keep all remaining browser tests required on PRs.

Run candidate and current configurations side by side on representative commits, compare test inventories, timings, failure rates and cost, and exercise deliberately broken security, synchronization and layout behavior in an isolated experiment. Treat a small sample as an initial signal, not a reliable p90. Continue monitoring after rollout.

Before switching required checks, introduce and verify a stable aggregate check that fails for any failed, cancelled, skipped or missing shard. Confirm repository rules and keep the old gate required until the replacement has been demonstrated. A smaller required suite plus scheduled coverage is a separate tradeoff only if these optimizations cannot meet the goal.
