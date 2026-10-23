import { expect, test, type Locator, type Page } from "@playwright/test";
import { signInAs, createRoomFromLobby, joinRoomFromLobby, newSignedInPage } from "./fixtures";

// One viewport per layout constraint, including unusually short game dialogs.
// Dedicated drag/resize and long-content tests retain their explicit sizes.
const viewports = [
  { width: 320, height: 568 }, { width: 568, height: 240 },
  { width: 768, height: 1024 }, { width: 1024, height: 568 },
  { width: 1280, height: 320 }, { width: 1440, height: 900 },
];

async function expectOverlayBounds(page: Page, overlay: Locator) {
  await expect(overlay).toBeVisible();
  await expect.poll(async () => overlay.evaluate((element) => {
    const bounds = element.getBoundingClientRect();
    return {
      inside: bounds.left >= -1 && bounds.top >= -1 && bounds.right <= innerWidth + 1 && bounds.bottom <= innerHeight + 1,
      horizontal: element.scrollWidth <= element.clientWidth + 1,
    };
  })).toEqual({ inside: true, horizontal: true });
}

async function expectOverlayControls(page: Page, overlay: Locator) {
  await expectOverlayBounds(page, overlay);
  const controls = overlay.locator('button, input:not([type="hidden"]), select, textarea, a[href], [role="button"], [role="menuitem"]:not([aria-haspopup]), .ant-menu-submenu-title');
  for (const control of await controls.all()) {
    if (!await control.isVisible() || !await control.isEnabled()) continue;
    if (await control.evaluate((element) => !!element.closest('[aria-hidden="true"]'))) continue;
    await control.scrollIntoViewIfNeeded();
    await expect(control).toBeInViewport({ ratio: 0.98 });
    await expect.poll(() => control.evaluate((element) => {
      const reachable = Array.from(element.getClientRects()).some((rect) => {
        const hit = document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2);
        return !!hit && element.contains(hit);
      });
      return reachable ? "reachable" : element.outerHTML.slice(0, 240);
    })).toBe("reachable");
  }
}

test.beforeEach(({ page }) => page.setDefaultTimeout(10_000));

test("regular match setup, mulligans and confirmations stay usable in short landscape", async ({ browser }, testInfo) => {
  test.setTimeout(180_000);
  const one = await browser.newContext({ hasTouch: true, viewport: { width: 568, height: 240 } });
  const two = await browser.newContext({ hasTouch: true, viewport: { width: 667, height: 375 } });
  try {
    const player = await newSignedInPage(one, "e2e-player-one");
    const opponent = await newSignedInPage(two, "e2e-player-two");
    player.setDefaultTimeout(10_000);
    opponent.setDefaultTimeout(10_000);
    const room = `overlay-regular-${Date.now()}`;
    await createRoomFromLobby(player, room, false, "E2E Player 1 Deck");
    await joinRoomFromLobby(opponent, room, "E2E Player 2 Deck");
    const setup = player.getByRole("dialog", { name: "Regular match setup", exact: true });
    const landscape = viewports.filter((size) => size.width > size.height);
    for (const size of landscape) { await player.setViewportSize(size); await expectOverlayControls(player, setup); }
    await player.getByRole("button", { name: "Ready", exact: true }).click();
    await opponent.getByRole("button", { name: "Ready", exact: true }).click();
    await expect(player.getByRole("heading", { name: "Rock Paper Scissors", exact: true })).toBeVisible();
    for (const size of landscape) { await player.setViewportSize(size); await expectOverlayControls(player, setup); }
    await player.getByRole("button", { name: "Rock", exact: true }).click();
    await opponent.getByRole("button", { name: "Scissors", exact: true }).click();
    await expect(player.getByRole("button", { name: "Go first", exact: true })).toBeVisible();
    for (const size of landscape) { await player.setViewportSize(size); await expectOverlayControls(player, setup); }
    await player.getByRole("button", { name: "Go first", exact: true }).click();
    await expect(player.getByRole("button", { name: "Keep hand", exact: true })).toBeVisible();
    for (const size of landscape) { await player.setViewportSize(size); await expectOverlayControls(player, player.locator('aside[role="status"]')); }
    await player.getByRole("button", { name: "Keep hand", exact: true }).click();
    await opponent.getByRole("button", { name: "Keep hand", exact: true }).click();
    for (const size of landscape.filter((size) => size.width <= 1100)) {
      await player.setViewportSize(size);
      await expect.poll(() => player.locator(".game-play-area").evaluate((board) => {
        const grids = Array.from(board.children).filter((element) => element.classList.contains("grid"));
        const hand = board.lastElementChild!.getBoundingClientRect();
        const status = board.querySelector('section[aria-label="Regular match status"]')!.getBoundingClientRect();
        return grids.flatMap((grid) => {
          const bounds = grid.getBoundingClientRect();
          const failures = bounds.bottom <= hand.top + 1 && (bounds.bottom <= status.top + 1 || bounds.top >= status.bottom - 1) ? [] : ["board overlaps hand/status"];
          return [...failures, ...Array.from(grid.querySelectorAll('[data-game-zone]')).flatMap((zone) => {
            const rect = zone.getBoundingClientRect();
            const hit = document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2);
            return rect.height >= 24 && rect.top >= bounds.top - 1 && rect.bottom <= bounds.bottom + 1 && !!hit && zone.contains(hit) ? [] : [{ zone: zone.getAttribute("data-game-zone"), height: rect.height, top: rect.top, bottom: rect.bottom, gridTop: bounds.top, gridBottom: bounds.bottom, hit: hit?.outerHTML.slice(0, 150) }];
          })];
        });
      })).toEqual([]);
    }
    await player.screenshot({ path: testInfo.outputPath("short-landscape-board.png") });
    for (const size of landscape) {
      await player.setViewportSize(size);
      await player.getByRole("button", { name: "Open navigation", exact: true }).click();
      await player.getByRole("button", { name: "Concede", exact: true }).last().click();
      await expectOverlayControls(player, player.getByRole("dialog"));
      await player.getByRole("button", { name: "Close Concede match", exact: true }).click();
      await player.getByRole("button", { name: "Leave match", exact: true }).last().click();
      await expectOverlayControls(player, player.getByRole("dialog"));
      await player.getByRole("button", { name: "Stay", exact: true }).click();
    }
    await player.getByRole("button", { name: "Open navigation", exact: true }).click();
    await player.getByRole("button", { name: "Concede", exact: true }).last().click();
    await player.getByRole("dialog").getByRole("button", { name: "Concede", exact: true }).click();
    await expect(player.getByRole("dialog").getByText("Match complete", { exact: true })).toBeVisible();
    for (const size of landscape) { await player.setViewportSize(size); await expectOverlayControls(player, player.getByRole("dialog")); }
  } finally { await one.close(); await two.close(); }
});

test("dragged dialogs stay fully on-screen and recover when the viewport shrinks", async ({ page }) => {
  await signInAs(page, "e2e-player-one");
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto("/decks");
  await page.getByRole("button", { name: /create deck/i }).first().click();
  const modal = page.getByRole("dialog");
  const header = modal.locator(".cursor-grab");
  await expect(header).toBeVisible();
  const bounds = await header.boundingBox();
  await page.mouse.move(bounds!.x + 200, bounds!.y + 20);
  await page.mouse.down();
  await page.mouse.move(1270, 10, { steps: 10 });
  await page.mouse.up();
  await expectOverlayControls(page, modal);
  await page.setViewportSize({ width: 700, height: 280 });
  await expectOverlayControls(page, modal);
  await page.getByRole("button", { name: "Close create deck", exact: true }).click();
});

test("legacy card submenus fit short desktop and mobile viewports", async ({ page }) => {
  test.setTimeout(90_000);
  await signInAs(page, "e2e-player-one");
  await page.setViewportSize({ width: 1280, height: 720 });
  await createRoomFromLobby(page, `overlay-legacy-${Date.now()}`, true, "E2E Player 1 Deck");
  await page.getByRole("button", { name: "Tools & settings", exact: true }).click();
  await page.getByRole("checkbox", { name: "Use Legacy Menu", exact: true }).check();
  await page.getByRole("checkbox", { name: "Show Menu On Hover", exact: true }).uncheck();
  await page.getByRole("button", { name: "Close Tools & Settings", exact: true }).click();
  for (const size of [{ width: 1280, height: 320 }, { width: 568, height: 240 }, { width: 844, height: 390 }]) {
    await page.setViewportSize(size);
    if (size.width <= 1100) {
      await page.getByRole("button", { name: "Open deck actions", exact: true }).click();
      await page.getByRole("menuitem", { name: "Send to p1 player", exact: true }).click();
      await page.getByRole("menuitem", { name: "Send to p1 player Deck", exact: true }).click();
      await expectOverlayControls(page, page.getByRole("dialog"));
      await page.getByRole("button", { name: "Close card details and actions", exact: true }).click();
    } else {
      await page.locator('[data-game-zone="p1PlayerDeck"] .card-inner').click();
      await page.mouse.move(5, 5);
      await expectOverlayControls(page, page.locator('.game-card-menu:visible'));
      await page.getByRole("menuitem", { name: "Send to p1 player", exact: true }).hover();
      await expect(page.getByRole("menuitem", { name: "Send to p1 player Deck", exact: true })).toBeVisible();
      await page.getByRole("menuitem", { name: "Send to p1 player Deck", exact: true }).hover();
      await expect(page.getByRole("menuitem", { name: "Send to p1 player Deck (bottom)", exact: true })).toBeVisible();
      for (const menu of await page.locator('.ant-menu-submenu-popup:visible').all()) await expectOverlayBounds(page, menu);
      await expectOverlayControls(page, page.getByRole("menuitem", { name: "Send to p1 player Deck (bottom)", exact: true }).locator('..'));
      await page.getByRole("button", { name: "Help", exact: true }).click();
      const help = page.getByRole("dialog", { name: "Help", exact: true });
      const dragHeader = await help.locator('.cursor-grab').boundingBox();
      await page.mouse.move(dragHeader!.x + 20, dragHeader!.y + 5);
      await page.mouse.down();
      await page.mouse.move(1270, 10, { steps: 10 });
      await page.mouse.up();
      await expectOverlayControls(page, help);
      await page.getByRole("button", { name: "Close Help", exact: true }).click();
    }
  }
});

test.describe("touch overlay matrix", () => {
  test.use({ hasTouch: true });

  test("navigation, account editor and lobby forms have no unreachable controls", async ({ page }) => {
    test.setTimeout(240_000);
    await signInAs(page, "e2e-player-one");
    const decks = await (await page.request.get("/api/decks?view=summary")).json();
    const roomName = `Overlay lobby fixture ${Date.now()}`;
    const response = await page.request.post("/createRoom", { data: { roomName, deckId: decks[0]._id, sandboxMode: true } });
    expect(response.status()).toBe(201);
    for (const size of viewports) {
      await page.setViewportSize(size);
      await page.goto("/");
      if (size.width < 768) {
        await page.getByRole("button", { name: "Open navigation", exact: true }).click();
        await expectOverlayControls(page, page.getByRole("dialog"));
        await page.getByRole("button", { name: "Edit username", exact: true }).click();
      } else {
        await page.getByRole("button", { name: "Open account menu", exact: true }).click();
        await expectOverlayControls(page, page.getByRole("menu"));
        await page.getByRole("menuitem", { name: "Edit username", exact: true }).click();
      }
      await expectOverlayControls(page, page.getByRole("dialog"));
      await page.keyboard.press("Escape");
      await expect(page.getByRole("dialog")).toHaveCount(0);
      await page.getByRole("button", { name: "Play", exact: true }).click();
      await expectOverlayControls(page, page.getByRole("dialog"));
      await page.getByRole("button", { name: "Close create game", exact: true }).click();
      await page.getByRole("article").filter({ has: page.getByText(roomName, { exact: true }) }).getByRole("button", { name: "Join", exact: true }).click();
      await expectOverlayControls(page, page.getByRole("dialog"));
      await page.getByRole("button", { name: "Close join room", exact: true }).click();
    }
  });

  test("classic performance utility uses a bounded accessible dialog", async ({ page }) => {
    test.setTimeout(120_000);
    await signInAs(page, "e2e-player-one");
    await page.goto("/?ui=classic");
    for (const size of viewports) {
      await page.setViewportSize(size);
      await page.getByRole("button", { name: /Image Performance/ }).click();
      await expectOverlayControls(page, page.getByRole("dialog", { name: "Image Performance Monitor", exact: true }));
      await page.keyboard.press("Escape");
      await expect(page.getByRole("dialog")).toHaveCount(0);
    }
  });

  test("long import previews and username-removal confirmation remain scrollable without horizontal clipping", async ({ page }) => {
    test.setTimeout(90_000);
    await signInAs(page, "e2e-player-one");
    const name = "LongImportedDeckName".repeat(16);
    await page.route("**/api/me/alias", (route) => route.fulfill({ json: { alias: "E2E_QA_Alias" } }));
    await page.route("https://api.legionstoolbox.com/**", (route) => route.fulfill({ json: [{ data: {
      name, legion: "E2E Legion", cards_in_deck: [{ id: "qa-card", qty: 40, type: "Warrior", image: "/logo.svg", thumb: "/logo.svg", code: "QA" }],
    } }] }));
    for (const size of [{ width: 320, height: 568 }, { width: 568, height: 240 }, { width: 1280, height: 320 }]) {
      await page.setViewportSize(size);
      await page.goto("/decks");
      await page.getByRole("button", { name: /Import/i }).first().click();
      await page.getByLabel("Toolbox Deck ID", { exact: true }).fill("4938");
      await page.getByRole("button", { name: "Generate Preview", exact: true }).click();
      const dialog = page.getByRole("dialog");
      await expect(dialog.getByRole("button", { name: "Import Deck To Battleground", exact: true })).toBeVisible();
      await expectOverlayControls(page, dialog);
      await expect.poll(() => dialog.getByText(name, { exact: false }).last().evaluate((element) => element.scrollWidth <= element.clientWidth + 1)).toBe(true);
      await page.getByRole("button", { name: "Close deck import", exact: true }).click();
      if (size.width < 768) {
        await page.getByRole("button", { name: "Open navigation", exact: true }).click();
        await page.getByRole("button", { name: "Edit username", exact: true }).click();
      } else {
        await page.getByRole("button", { name: "Open account menu", exact: true }).click();
        await page.getByRole("menuitem", { name: "Edit username", exact: true }).click();
      }
      await page.getByRole("button", { name: "Remove username", exact: true }).click();
      await expectOverlayControls(page, page.getByRole("dialog"));
      await page.getByRole("button", { name: "Cancel", exact: true }).click();
      await page.getByRole("button", { name: "Close username editor", exact: true }).click();
    }
  });

  test("published and saved deck inspectors keep their actions reachable across the viewport matrix", async ({ page }) => {
    test.setTimeout(180_000);
    await signInAs(page, "e2e-player-one");
    const decks = await (await page.request.get("/api/decks?view=summary")).json();
    const deck = decks.find((item: { name: string }) => item.name === "E2E Player 1 Deck");
    await page.goto("/browse");
    await page.getByRole("button", { name: "Open published deck E2E Public Deck", exact: true }).click();
    await expect(page).toHaveURL(/\/browse\/[a-f\d]{24}$/);
    const publishedUrl = page.url();
    for (const size of viewports) {
      await page.setViewportSize(size);
      await page.goto(publishedUrl);
      await page.getByRole("button", { name: "Inspect E2E Warrior 1", exact: true }).first().click();
      await expectOverlayControls(page, page.getByRole("dialog"));
      await page.getByRole("button", { name: "Close card details", exact: true }).click();
      if (size.width < 768) {
        await page.goto(`/decks/${deck._id}`);
        await page.getByLabel("Main deck", { exact: true }).getByRole("button", { name: "Inspect E2E Warrior 1", exact: true }).first().click();
        await expectOverlayControls(page, page.getByRole("dialog"));
        await page.getByRole("button", { name: "Done", exact: true }).click();
      }
    }
  });

  test("public form dialogs and card inspectors remain bounded with reachable content and close controls", async ({ page }) => {
    test.setTimeout(240_000);
    await signInAs(page, "e2e-player-one");
    for (const size of viewports) {
      await test.step(`${size.width}x${size.height}`, async () => {
        await page.setViewportSize(size);
        await page.goto("/decks");
        await page.getByRole("button", { name: /create deck/i }).first().click();
        await expectOverlayControls(page, page.getByRole("dialog"));
        await page.getByRole("button", { name: "Close create deck", exact: true }).click();
        await page.getByRole("button", { name: /Import/i }).first().click();
        await expectOverlayControls(page, page.getByRole("dialog"));
        await page.getByRole("button", { name: "Close deck import", exact: true }).click();
        await page.goto("/cards");
        await page.getByRole("button", { name: "Inspect E2E Warrior 1", exact: true }).click();
        if (size.width < 1280) {
          const inspector = page.getByRole("dialog", { name: "Card details", exact: true });
          await expectOverlayControls(page, inspector);
          await inspector.getByRole("button", { name: /View .*full screen/ }).click();
        } else {
          await page.getByRole("button", { name: /View .*full screen/ }).click();
        }
        const image = page.getByRole("dialog", { name: /full screen image$/ });
        await expectOverlayControls(page, image);
        await page.keyboard.press("Escape");
        await expect(image).toHaveCount(0);
        if (size.width < 1280) {
          await expect(page.getByRole("dialog", { name: "Card details", exact: true })).toBeVisible();
          await page.getByRole("button", { name: "Close card details", exact: true }).click();
        }
      });
    }
  });

  test("game help, settings, pile and nested card menus stay usable on short landscape screens", async ({ page }) => {
    test.setTimeout(240_000);
    await signInAs(page, "e2e-player-one");
    await page.setViewportSize({ width: 844, height: 390 });
    await createRoomFromLobby(page, `overlay-qa-${Date.now()}`, true, "E2E Player 1 Deck");
    for (const size of viewports.filter((size) => size.width > size.height)) {
      await test.step(`${size.width}x${size.height}`, async () => {
        await page.setViewportSize(size);
        await page.getByRole("button", { name: "Open navigation", exact: true }).click();
        await page.getByRole("button", { name: "Help", exact: true }).last().click();
        await expectOverlayControls(page, page.getByRole("dialog"));
        await page.getByRole("button", { name: "Close Help", exact: true }).click();
        await page.getByRole("button", { name: "Tools & settings", exact: true }).last().click();
        await page.getByRole("button", { name: "Change Deck(s)", exact: true }).click();
        await expectOverlayControls(page, page.getByRole("dialog"));
        await page.keyboard.press("Escape");
        await page.getByRole("button", { name: "Close menu", exact: true }).click();
        if (size.width <= 1100) {
          await page.getByRole("button", { name: "Open deck actions", exact: true }).click();
          const card = page.getByRole("dialog", { name: "Card details and actions", exact: true });
          await expectOverlayControls(page, card);
          await page.getByRole("menuitem", { name: "Search Deck", exact: true }).click();
        } else {
          await page.locator('[data-game-zone="p1PlayerDeck"] .card-inner').first().click();
          await page.getByRole("menuitem", { name: "Search Deck", exact: true }).click();
        }
        await expectOverlayControls(page, page.getByRole("dialog"));
        if (size.width <= 1100) {
          await page.getByRole("dialog").getByRole("button", { name: /^Inspect E2E Warrior/ }).first().click();
          const details = page.getByRole("dialog", { name: "Card details and actions", exact: true });
          await expectOverlayControls(page, details);
          await details.getByRole("button", { name: /image full screen/ }).click();
          await expectOverlayControls(page, page.getByRole("dialog", { name: /full screen image$/ }));
          await page.keyboard.press("Escape");
          await expect(details).toBeVisible();
          await details.getByRole("button", { name: "Close card details and actions", exact: true }).press("Escape");
          await expect(details).toHaveCount(0);
          await expect(page.getByRole("dialog")).toHaveCount(1);
        }
        await page.getByRole("button", { name: "close", exact: true }).click();
      });
    }
  });
});
