# Lessons

- 2026-10-22: Stopped the orphaned `ts-node src/server/server.ts` process before E2E; no listener remained on port 3100 after termination.
- 2026-10-22: An interrupted E2E run briefly left its Next test server on port 3100; confirm the listener has exited before retrying the suite.
