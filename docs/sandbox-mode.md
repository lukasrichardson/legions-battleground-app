# Sandbox Mode

Sandbox mode is selected during room creation and is currently the default mode in the initial game state and create-room UI. It relaxes gameplay restrictions so players can test interactions and card behavior; normal mode retains structured phase and turn validation.

## Manual verification

Run these scenarios after gameplay changes and record the browser, commit, and observed results.

1. **Normal mode:** create a room with Sandbox Mode disabled, complete RPS, and verify the structured mulligan and phase flow applies.
2. **Sandbox mode:** create a room with Sandbox Mode enabled, complete RPS, and verify the sandbox indicators appear and restricted card interactions remain available.
3. **Reset:** reset a sandbox game and verify its sandbox setting and indicators persist.
4. **Validation:** attempt a normally restricted action in each mode; it should be permitted in sandbox mode and validated in normal mode.

Verify both players receive synchronized state updates, including after reconnecting.
