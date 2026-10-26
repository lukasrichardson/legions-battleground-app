import { expect, test } from "@playwright/test";
import { createRoomFromLobby, signInAs } from "./fixtures";

test("play workspaces share styling across sizes without stretching cards or clipping controls", async ({ page }) => {
  await signInAs(page, "e2e-player-one");
  await page.setViewportSize({ width: 1920, height: 1080 });
  await createRoomFromLobby(page, `wide-workspace-${Date.now()}`, true, "E2E Player 1 Deck");
  const readAppearance = () => page.locator('[data-game-zone="p1PlayerWarriors"]').first().evaluate((zone) => {
    const style = getComputedStyle(zone);
    const board = getComputedStyle(zone.closest(".grid")!);
    const hand = getComputedStyle(document.querySelector(".game-hand")!);
    return { zoneBackground: style.backgroundColor, zoneBorder: style.borderTopColor, zoneRadius: style.borderRadius, zoneShadow: style.boxShadow, battlefield: board.backgroundImage, battlefieldRadius: board.borderRadius, hand: hand.backgroundColor };
  });
  const readBattlefieldGeometry = () => page.locator(".game-play-area").evaluate((playArea) => {
    const rect = (element: Element) => {
      const bounds = element.getBoundingClientRect();
      return { left: bounds.left, right: bounds.right, width: bounds.width };
    };
    const board = (position: "opponent" | "player") => playArea.querySelector(`[data-board-position="${position}"]`)!;
    const zone = (position: "opponent" | "player", suffix: string, index?: number) => {
      const indexSelector = index === undefined ? "" : `[data-zone-index="${index}"]`;
      return board(position).querySelector(`[data-game-zone$="${suffix}"]${indexSelector}`)!;
    };
    const primaryWidths = Array.from(playArea.querySelectorAll([
      '[data-game-zone$="PlayerWarriors"]',
      '[data-game-zone$="PlayerUnifieds"]',
      '[data-game-zone$="PlayerFortifieds"]',
    ].join(","))).map((element) => rect(element).width);
    const utilityWidths = Array.from(playArea.querySelectorAll([
      '[data-game-zone$="PlayerDeck"]',
      '[data-game-zone$="PlayerDiscard"]',
      '[data-game-zone$="PlayerEradication"]',
      '[data-game-zone$="PlayerVeilRealm"]',
      '[data-game-zone$="PlayerTokens"]',
      '[data-game-zone$="PlayerRevealed"]',
    ].join(","))).map((element) => rect(element).width);
    const fullTrackUtilityWidths = Array.from(playArea.querySelectorAll([
      '[data-game-zone$="PlayerWarlord"]',
      '[data-game-zone$="PlayerSynergy"]',
      '[data-game-zone$="PlayerGuardian"]',
    ].join(","))).map((element) => rect(element).width);
    return {
      opponentWarlord: rect(zone("opponent", "PlayerWarlord")),
      opponentWarriorOne: rect(zone("opponent", "PlayerWarriors", 0)),
      opponentWarriorFive: rect(zone("opponent", "PlayerWarriors", 4)),
      playerWarlord: rect(zone("player", "PlayerWarlord")),
      playerWarriorOne: rect(zone("player", "PlayerWarriors", 0)),
      playerWarriorFive: rect(zone("player", "PlayerWarriors", 4)),
      primaryWidths,
      utilityWidths,
      fullTrackUtilityWidths,
    };
  });
  await page.mouse.move(0, 0);
  const appearance = await readAppearance();
  for (const size of [
    { width: 1920, height: 1080 }, { width: 1280, height: 720 },
    { width: 1440, height: 900 }, { width: 2560, height: 1080 },
    { width: 1920, height: 600 }, { width: 3440, height: 1440 },
    { width: 568, height: 320 }, { width: 844, height: 390 }, { width: 1024, height: 768 },
  ]) {
    await page.setViewportSize(size);
    const board = page.getByTestId("game-board").last();
    await expect.poll(async () => (await board.boundingBox())!.width).toBeGreaterThan(size.width - 4);
    await expect.poll(async () => (await board.boundingBox())!.height).toBeGreaterThan(size.height - 4);
    for (const control of [page.getByRole("button", { name: "Roll D6", exact: true }), page.locator('[data-game-zone="p1PlayerDeck"]'), page.locator('[data-game-zone="p2PlayerDeck"]')]) {
      await expect(control).toBeInViewport({ ratio: 0.99 });
      await control.click({ trial: true });
    }
    const card = await page.locator('[data-game-zone="p1PlayerDeck"] .card-inner').first().boundingBox();
    expect(card!.width / card!.height).toBeCloseTo(0.75, 1);
    const geometry = await readBattlefieldGeometry();
    expect(geometry.playerWarlord.right).toBeCloseTo(geometry.opponentWarriorFive.right, 0);
    expect(geometry.opponentWarlord.left).toBeCloseTo(geometry.playerWarriorFive.left, 0);
    expect(geometry.playerWarriorOne.left - geometry.playerWarlord.right).toBeGreaterThanOrEqual(0);
    expect(geometry.playerWarriorOne.left - geometry.playerWarlord.right).toBeLessThanOrEqual(20);
    expect(geometry.opponentWarlord.left - geometry.opponentWarriorOne.right).toBeGreaterThanOrEqual(0);
    expect(geometry.opponentWarlord.left - geometry.opponentWarriorOne.right).toBeLessThanOrEqual(20);
    expect(Math.max(...geometry.primaryWidths) - Math.min(...geometry.primaryWidths)).toBeLessThanOrEqual(1);
    expect(geometry.playerWarlord.width).toBeCloseTo(geometry.playerWarriorOne.width, 0);
    expect(geometry.opponentWarlord.width).toBeCloseTo(geometry.opponentWarriorOne.width, 0);
    const fullTrackWidths = [...geometry.primaryWidths, ...geometry.fullTrackUtilityWidths];
    expect(Math.max(...fullTrackWidths) - Math.min(...fullTrackWidths)).toBeLessThanOrEqual(1);
    expect(Math.max(...geometry.utilityWidths)).toBeLessThan(Math.min(...geometry.primaryWidths));
    await page.mouse.move(0, 0);
    await expect.poll(readAppearance).toEqual(appearance);
    if (size.width === 844) await page.screenshot({ path: "output/playwright/shared-play-mobile.png" });
    if (size.width === 1920 && size.height === 1080) await page.screenshot({ path: "output/playwright/wide-play-after-1920.png" });
    if (size.width === 2560) await page.screenshot({ path: "output/playwright/wide-play-after.png" });
  }
});

test("desktop pile dialogs still drag and allow dragging a card onto the board", async ({
  page,
}) => {
  await signInAs(page, "e2e-player-one");
  await page.setViewportSize({ width: 1440, height: 1000 });
  await createRoomFromLobby(
    page,
    `desktop-drag-${Date.now()}`,
    true,
    "E2E Player 1 Deck",
  );
  await page
    .locator('[data-game-zone="p1PlayerDeck"] .card-inner')
    .first()
    .click();
  await page
    .getByRole("menuitem", { name: "Search Deck", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  const before = await dialog.boundingBox();
  const header = dialog.locator(".cursor-grab");
  const rect = await header.boundingBox();
  await page.mouse.move(rect!.x + 12, rect!.y + 12);
  await page.mouse.down();
  await page.mouse.move(rect!.x - 150, rect!.y + 12, { steps: 10 });
  await page.mouse.up();
  await expect
    .poll(async () => (await dialog.boundingBox())!.x)
    .toBeLessThan(before!.x - 100);
  const card = dialog.locator(".card-inner").first();
  // Use an exposed destination. Dialog content intentionally remains opaque
  // to pointer events; only the backdrop passes a card drag through.
  const destination = page.locator('[data-game-zone="p1PlayerDiscard"]');
  const source = await card.boundingBox();
  const target = await destination.boundingBox();
  await page.mouse.move(
    source!.x + source!.width / 2,
    source!.y + source!.height / 2,
  );
  await page.mouse.down();
  // Start the native HTML drag before moving onto the backdrop, whose pointer
  // passthrough intentionally begins only once React DnD reports a card drag.
  await page.mouse.move(
    source!.x + source!.width / 2 + 12,
    source!.y + source!.height / 2 + 12,
    { steps: 4 },
  );
  await page.mouse.move(
    target!.x + target!.width / 2,
    target!.y + target!.height / 2,
    { steps: 12 },
  );
  await page.mouse.move(
    target!.x + target!.width / 2 + 1,
    target!.y + target!.height / 2,
  );
  await page.mouse.up();
  await expect(destination.locator(".card-inner")).toHaveCount(1);
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "close", exact: true }).click();
  await expect(dialog).toHaveCount(0);
});
