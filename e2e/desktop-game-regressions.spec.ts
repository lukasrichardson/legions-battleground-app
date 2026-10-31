import { expect, test, type Locator, type Page } from "@playwright/test";
import { createRoomFromLobby, expectVisibleCardImagesLoaded, signInAs } from "./fixtures";

async function cardActionMenu(page: Page, inspect: Locator) {
  await expect(inspect).toHaveAttribute("aria-expanded", "true");
  const anchor = inspect.locator("..");
  await expect(anchor).toHaveAttribute("aria-describedby", /.+/);
  // Another card's hover popup can still be visible during its exit animation.
  const popupId = await anchor.getAttribute("aria-describedby");
  return page.locator(`[id="${popupId}"]`);
}

async function moveHandCardToDeck(page: Page, menu: Locator) {
  const move = menu.getByRole("menuitem", { name: "Move to…", exact: true });
  await move.click();
  const submenuId = await move.getAttribute("aria-controls");
  await page.locator(`[id="${submenuId}"]`).getByRole("menuitem", { name: "To Bottom of Deck", exact: true }).click();
}

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
    if (size.width === 844 || (size.width === 1920 && size.height === 1080) || size.width === 2560) {
      await expectVisibleCardImagesLoaded(page);
    }
    if (size.width === 844) await page.screenshot({ path: "output/playwright/shared-play-mobile.png" });
    if (size.width === 1920 && size.height === 1080) await page.screenshot({ path: "output/playwright/wide-play-after-1920.png" });
    if (size.width === 2560) await page.screenshot({ path: "output/playwright/wide-play-after.png" });
  }
});

test("desktop pile browser moves away from covered zones and keeps card dragging active", async ({
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
  const dialog = page.getByRole("dialog", { name: "Your deck", exact: true });
  await expect(dialog).toBeVisible();
  const initialBounds = await dialog.boundingBox();
  expect(initialBounds).not.toBeNull();
  expect(initialBounds!.x).toBeGreaterThanOrEqual(0);
  expect(initialBounds!.y).toBeGreaterThanOrEqual(0);
  expect(initialBounds!.x + initialBounds!.width).toBeLessThanOrEqual(1440);
  expect(initialBounds!.y + initialBounds!.height).toBeLessThanOrEqual(1000);

  const zones = page.locator('[data-game-zone]');
  const coveredTarget = await zones.evaluateAll((elements, modalBounds) => elements.map((element, index) => {
    const bounds = element.getBoundingClientRect();
    return {
      index,
      target: element.getAttribute("data-game-zone"),
      cardCount: element.querySelectorAll(".card-inner").length,
      x: bounds.x + bounds.width / 2,
      y: bounds.y + bounds.height / 2,
    };
  }).find(({ target, cardCount, x, y }) =>
    target?.startsWith("p1")
    && !target.endsWith("Deck")
    && cardCount === 0
    && x >= modalBounds.x
    && x <= modalBounds.x + modalBounds.width
    && y >= modalBounds.y
    && y <= modalBounds.y + modalBounds.height
    && (x < 1440 - modalBounds.width - 16 || x > modalBounds.width + 16)
  ) ?? null, initialBounds!);
  expect(coveredTarget).not.toBeNull();
  const destination = zones.nth(coveredTarget!.index);

  const header = dialog.locator(".cursor-grab");
  const headerBounds = await header.boundingBox();
  expect(headerBounds).not.toBeNull();
  await page.mouse.move(headerBounds!.x + headerBounds!.width / 2, headerBounds!.y + Math.min(24, headerBounds!.height / 2));
  await page.mouse.down();
  const moveRight = coveredTarget!.x < 1440 - initialBounds!.width - 16;
  await page.mouse.move(moveRight ? 1430 : 10, headerBounds!.y + 40, { steps: 12 });
  await page.mouse.up();

  const movedBounds = await dialog.boundingBox();
  expect(Math.abs(movedBounds!.x - initialBounds!.x) + Math.abs(movedBounds!.y - initialBounds!.y)).toBeGreaterThan(100);
  expect(coveredTarget!.x < movedBounds!.x || coveredTarget!.x > movedBounds!.x + movedBounds!.width
    || coveredTarget!.y < movedBounds!.y || coveredTarget!.y > movedBounds!.y + movedBounds!.height).toBe(true);

  const card = dialog.locator(".card-inner").first();
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
  await expect(card).toHaveClass(/opacity-45/);
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

  await page.setViewportSize({ width: 1200, height: 700 });
  await expect.poll(async () => {
    const bounds = await dialog.boundingBox();
    return !!bounds && bounds.x >= -1 && bounds.y >= -1 && bounds.x + bounds.width <= 1201 && bounds.y + bounds.height <= 701;
  }).toBe(true);
  await dialog.getByRole("button", { name: "Close Your deck", exact: true }).click();
  await expect(dialog).toHaveCount(0);
});

test("Wisdom selection tiles contain no nested controls and support pointer and keyboard selection", async ({ page }) => {
  await signInAs(page, "e2e-player-one");
  await page.setViewportSize({ width: 1440, height: 900 });
  await createRoomFromLobby(page, `desktop-wisdom-${Date.now()}`, true, "E2E Player 1 Deck");
  const playerHand = page.locator(".game-hand").filter({ has: page.getByText("P1", { exact: true }) });
  const handCards = playerHand.locator(".card-inner");
  await expect(handCards.first()).toBeVisible();

  const openWisdom = async () => {
    await page.locator('[data-game-zone="p1PlayerDeck"] .card-inner').first().click();
    await page.getByRole("menuitem", { name: "Wisdom", exact: true }).click();
    const wisdom = page.getByRole("dialog", { name: "Wisdom selection", exact: true });
    await expect(wisdom).toBeVisible();
    return wisdom;
  };

  for (const input of ["pointer", "keyboard"] as const) {
    const before = await handCards.count();
    const wisdom = await openWisdom();
    const choice = wisdom.getByRole("button", { name: /^Choose E2E Warrior/ }).first();
    const chosenName = (await choice.getAttribute("aria-label"))!.replace(/^Choose /, "");
    await choice.hover();
    await choice.focus();
    await expect(choice.locator('button, [role="button"], [draggable="true"]')).toHaveCount(0);
    if (input === "pointer") await choice.click();
    else await choice.press("Enter");
    await expect(wisdom).toHaveCount(0);
    await expect(handCards).toHaveCount(before + 1);
    if (input === "pointer") {
      const inspect = playerHand.getByRole("button", { name: `Inspect ${chosenName}`, exact: true });
      await inspect.click();
      await moveHandCardToDeck(page, await cardActionMenu(page, inspect));
      await expect(handCards).toHaveCount(before);
    }
  }
});

test("desktop cards are keyboard-operable and pile browsing does not hover-open actions", async ({ page }) => {
  await page.addInitScript(() => window.localStorage.setItem("hoverMenu", "false"));
  await signInAs(page, "e2e-player-one");
  await page.setViewportSize({ width: 1440, height: 900 });
  await createRoomFromLobby(page, `desktop-keyboard-${Date.now()}`, true, "E2E Player 1 Deck");

  const handCard = page.locator(".game-hand").last().getByRole("button", { name: /^Inspect E2E Warrior/ }).first();
  await handCard.focus();
  await expect(handCard).toBeFocused();
  await page.keyboard.press("Enter");
  const conscript = page.getByRole("menuitem", { name: "Conscript", exact: true });
  await expect(conscript).toBeVisible();
  await conscript.focus();
  await conscript.press("Enter");
  const warriorZone = page.locator('[data-game-zone="p1PlayerWarriors"]').first();
  await warriorZone.click();

  const battlefieldCard = warriorZone.getByRole("button", { name: /^Inspect E2E Warrior/ });
  await battlefieldCard.focus();
  const decreaseAttack = page.getByRole("button", { name: "Decrease Attack modifier", exact: true });
  await expect(decreaseAttack).toBeVisible();
  await page.keyboard.press("Tab");
  await expect(decreaseAttack).toBeFocused();
  await expect(page.locator('.game-card-menu:visible')).toHaveCount(0);
  await page.keyboard.press("Enter");
  await expect(page.locator('.game-card-menu:visible')).toHaveCount(0);
  await expect(warriorZone.locator('[aria-label="Attack modifier: -1"]')).toBeVisible();
  await decreaseAttack.click();
  await expect(page.locator('.game-card-menu:visible')).toHaveCount(0);
  await expect(warriorZone.locator('[aria-label="Attack modifier: -2"]')).toBeVisible();

  await page.getByRole("button", { name: "Tools & settings", exact: true }).click();
  const hoverSetting = page.getByRole("checkbox", { name: "Show Menu On Hover", exact: true });
  if (!await hoverSetting.isChecked()) await hoverSetting.check();
  await page.getByRole("button", { name: "Close Tools & Settings", exact: true }).click();
  await page.locator('[data-game-zone="p1PlayerDeck"] .card-inner').first().click();
  await page.getByRole("menuitem", { name: "Search Deck", exact: true }).click();
  const pile = page.getByRole("dialog", { name: "Your deck", exact: true });
  const pileCard = pile.locator(".card-inner").first();
  await pileCard.hover();
  await page.waitForTimeout(350);
  await expect(page.locator('.game-card-menu:visible')).toHaveCount(0);
  await pileCard.click();
  await expect(page.getByRole("menuitem", { name: "Move to…", exact: true })).toBeVisible();
});
