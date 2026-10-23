import { expect, test, type Page } from "@playwright/test";
import { createRoomFromLobby, signInAs } from "./fixtures";

test.use({ hasTouch: true });
test.beforeEach(({ page }) => page.setDefaultTimeout(15_000));

async function discardHandCard(page: Page) {
  const card = page.locator('[data-mobile-overflow-exempt="hand-tray"] .card-inner').first();
  const name = (await card.getAttribute("aria-label"))!.replace(/^Inspect /, "");
  await card.tap();
  await page.getByRole("menuitem", { name: "To Discard", exact: true }).tap();
  await expect(page.getByRole("dialog", { name: "Card details and actions", exact: true })).toHaveCount(0);
  return name;
}

test("mobile card moves dismiss the action dialog, retain the pile browser and announce the move", async ({ page }) => {
  await signInAs(page, "e2e-player-one");
  await page.setViewportSize({ width: 568, height: 320 });
  await createRoomFromLobby(page, `mobile-usability-${Date.now()}`, true, "E2E Player 1 Deck");
  const first = await discardHandCard(page);
  const second = await discardHandCard(page);
  const discard = page.locator('[data-game-zone="p1PlayerDiscard"]');
  await discard.getByRole("button", { name: `Inspect ${second}`, exact: true }).tap();
  await page.getByRole("menuitem", { name: "To Hand", exact: true }).tap();
  const actions = page.getByRole("dialog", { name: "Card details and actions", exact: true });
  await expect(actions).toHaveCount(0);
  await expect(page.getByRole("status", { name: "Game action feedback", exact: true })).toContainText(`${second} moved to your hand`);
  await discard.getByRole("button", { name: `Inspect ${first}`, exact: true }).tap();
  await page.getByRole("menuitem", { name: "View", exact: true }).tap();
  const pile = page.getByRole("dialog", { name: "Your discard", exact: true });
  await expect(pile).toBeVisible();
  await pile.getByRole("button", { name: `Inspect ${first}`, exact: true }).tap();
  await actions.getByRole("menuitem", { name: "To Hand", exact: true }).tap();
  await expect(actions).toHaveCount(0);
  await expect(pile).toBeVisible();
  await expect(pile.getByText("This pile is empty.", { exact: true })).toBeVisible();
  await pile.getByRole("button", { name: "close", exact: true }).tap();
  await page.getByRole("button", { name: "Open deck actions", exact: true }).tap();
  await actions.getByRole("menuitem", { name: "Draw", exact: true }).tap();
  await expect(actions).toHaveCount(0);
  await expect(page.getByRole("status", { name: "Game action feedback", exact: true })).toContainText("Card moved to your hand");
  await page.getByRole("button", { name: "Inspect Warlord", exact: true }).last().tap();
  await page.getByRole("button", { name: "Increase DCM", exact: true }).tap();
  await expect(actions).toBeVisible();
});

test("pile searches explain empty results and offer a reset", async ({ page }) => {
  await signInAs(page, "e2e-player-one");
  await page.setViewportSize({ width: 844, height: 390 });
  await createRoomFromLobby(page, `pile-usability-${Date.now()}`, true, "E2E Player 1 Deck");
  await page.getByRole("button", { name: "Open deck actions", exact: true }).tap();
  await page.getByRole("menuitem", { name: "Search Deck", exact: true }).tap();
  const pile = page.getByRole("dialog", { name: "Your deck", exact: true });
  await pile.getByRole("textbox", { name: "Search card pile", exact: true }).fill("nothing matches this");
  await expect(pile.getByText("No cards match your search or filters.", { exact: true })).toBeVisible();
  await pile.getByRole("button", { name: "Clear search and filters", exact: true }).tap();
  await expect(pile.getByRole("button", { name: /^Inspect E2E Warrior/ }).first()).toBeVisible();
});

test("builder inspector shows per-target copy counts and save failures without closing", async ({ page }) => {
  await signInAs(page, "e2e-player-one");
  const response = await page.request.post("/api/decks", { data: { name: `Usability deck ${Date.now()}`, legion: "E2E Legion" } });
  const { deck } = await response.json();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`/decks/${deck._id}`);
  await page.getByRole("tab", { name: "Find cards", exact: true }).tap();
  await page.getByRole("button", { name: "Inspect E2E Warrior 1", exact: true }).tap();
  const dialog = page.getByRole("dialog", { name: "Card details", exact: true });
  const count = dialog.getByRole("status", { name: "Card copies in deck", exact: true });
  await expect(count).toHaveText("0 in main deck · 0 in side deck");
  await dialog.getByRole("button", { name: "Add to deck", exact: true }).tap();
  await expect(count).toHaveText("1 in main deck · 0 in side deck");
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText("Saved", { exact: true })).toBeVisible();
  await page.route(`**/api/decks/${deck._id}`, (route) => route.request().method() === "PATCH" ? route.fulfill({ status: 500, json: { message: "QA rejected save" } }) : route.continue());
  await dialog.getByRole("button", { name: "Add to deck", exact: true }).tap();
  await expect(dialog.getByRole("alert")).toContainText("Save failed");
  await expect(count).toHaveText("1 in main deck · 0 in side deck");
});

test("portrait gate offers a safe exit and dismisses a card action dialog on rotation", async ({ page }) => {
  await signInAs(page, "e2e-player-one");
  await page.setViewportSize({ width: 844, height: 390 });
  await createRoomFromLobby(page, `rotate-usability-${Date.now()}`, true, "E2E Player 1 Deck");
  await page.locator('[data-mobile-overflow-exempt="hand-tray"] .card-inner').first().tap();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole("heading", { name: "Rotate your device", exact: true })).toBeVisible();
  await expect(page.getByRole("dialog", { name: "Card details and actions", exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Back to lobby", exact: true }).tap();
  await expect(page).toHaveURL(/\/$/);
});

test("portrait exit keeps the normal regular-match leave confirmation", async ({ page }) => {
  await signInAs(page, "e2e-player-one");
  await page.setViewportSize({ width: 390, height: 844 });
  await createRoomFromLobby(page, `portrait-exit-${Date.now()}`, false, "E2E Player 1 Deck");
  await page.getByRole("button", { name: "Back to lobby", exact: true }).tap();
  const leave = page.getByRole("dialog", { name: "Leave game", exact: true });
  await expect(leave).toBeVisible();
  await leave.getByRole("button", { name: "Stay", exact: true }).tap();
  await expect(leave).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Rotate your device", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Back to lobby", exact: true }).tap();
  await leave.getByRole("button", { name: "Leave without conceding", exact: true }).tap();
  await expect(page).toHaveURL(/\/$/);
});

test("legacy moves also end the action dialog without retargeting the next pile card", async ({ page }) => {
  await signInAs(page, "e2e-player-one");
  await page.setViewportSize({ width: 844, height: 390 });
  await createRoomFromLobby(page, `legacy-usability-${Date.now()}`, true, "E2E Player 1 Deck");
  await page.getByRole("button", { name: "Open navigation", exact: true }).tap();
  await page.getByRole("button", { name: "Tools & settings", exact: true }).tap();
  await page.getByRole("checkbox", { name: "Use Legacy Menu", exact: true }).check();
  await page.getByRole("button", { name: "Close Tools & Settings", exact: true }).tap();
  await page.getByRole("button", { name: "Close menu", exact: true }).tap();
  for (let index = 0; index < 2; index++) {
    await page.locator('[data-mobile-overflow-exempt="hand-tray"] .card-inner').first().tap();
    await page.getByRole("menuitem", { name: "Send to p1 player", exact: true }).tap();
    await page.getByRole("menuitem", { name: "Send to p1 player discard", exact: true }).tap();
    await expect(page.getByRole("dialog", { name: "Card details and actions", exact: true })).toHaveCount(0);
  }
  await page.locator('[data-game-zone="p1PlayerDiscard"] .card-inner').tap();
  await page.getByRole("menuitem", { name: "Send to p1 player", exact: true }).tap();
  await page.getByRole("menuitem", { name: "Send to p1 player Hand", exact: true }).tap();
  await expect(page.getByRole("dialog", { name: "Card details and actions", exact: true })).toHaveCount(0);
  await expect(page.getByRole("status", { name: "Game action feedback", exact: true })).toContainText("moved to your hand");
});

test("recent personal and published deck headings separate titles from counts on phones", async ({ page }) => {
  await signInAs(page, "e2e-player-one");
  for (let index = 0; index < 3; index++) {
    const response = await page.request.post("/api/decks", { data: { name: `Heading fixture ${Date.now()} ${index}`, legion: "E2E Legion" } });
    expect(response.ok()).toBe(true);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.locator('[data-deck-summary-heading]')).toHaveCount(4);
  for (const size of [{ width: 320, height: 568 }, { width: 390, height: 844 }, { width: 568, height: 320 }]) {
    await page.setViewportSize(size);
    for (const heading of await page.locator('[data-deck-summary-heading]').all()) {
      expect(await heading.evaluate((element) => {
        const [name, main, side] = Array.from(element.children).map((child) => child.getBoundingClientRect());
        return name.bottom <= Math.min(main.top, side.top) + 1 && main.right <= side.left && side.right <= innerWidth;
      })).toBe(true);
    }
  }
});

test("inline card menus retain dialog Tab boundaries and Escape dismissal", async ({ page }) => {
  await signInAs(page, "e2e-player-one");
  await page.setViewportSize({ width: 844, height: 390 });
  await createRoomFromLobby(page, `menu-keyboard-${Date.now()}`, true, "E2E Player 1 Deck");
  const hand = page.locator('[data-mobile-overflow-exempt="hand-tray"] .card-inner').first();
  await hand.tap();
  const dialog = page.getByRole("dialog", { name: "Card details and actions", exact: true });
  const close = dialog.getByRole("button", { name: "Close card details and actions", exact: true });
  const menuItem = dialog.getByRole("menuitem", { name: "To Discard", exact: true });
  await menuItem.focus();
  await expect(menuItem).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(close).toBeFocused();
  await menuItem.focus();
  await page.keyboard.press("Shift+Tab");
  await expect(dialog.getByRole("menu")).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(dialog.getByRole("button", { name: "Select warrior zone", exact: true })).toBeFocused();
  await menuItem.focus();
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
});

test("a failed deck load still allows switching to an available deck", async ({ page }) => {
  await signInAs(page, "e2e-player-one");
  for (const size of [{ width: 390, height: 844 }, { width: 1280, height: 720 }]) {
    await page.setViewportSize(size);
    await page.goto("/decks/000000000000000000000000");
    await expect(page.getByRole("alert").filter({ hasText: "Unable to load deck." })).toBeVisible();
    const picker = page.getByRole("combobox", { name: "Select deck", exact: true });
    await expect(picker).toBeEnabled();
    await expect(page.getByRole("button", { name: "Delete", exact: true })).toBeDisabled();
    await picker.click();
    await page.getByRole("option", { name: /E2E Player 1 Deck/ }).click();
    await expect(picker).toContainText("E2E Player 1 Deck");
    await expect(page.getByRole("button", { name: "Delete", exact: true })).toBeEnabled();
  }
});
