import { expect, test, type Page } from "@playwright/test";
import { createRoomFromLobby, csrfHeaders, expectVisibleCardImagesLoaded, signInAs } from "./fixtures";
import {
  expectControlsReachable,
  expectMinimumTouchTargets,
  expectNoDocumentHorizontalOverflow,
  setMobileViewport,
} from "./mobile";

test.use({ hasTouch: true });
test.beforeEach(({ page }) => {
  page.setDefaultTimeout(30_000);
  page.setDefaultNavigationTimeout(60_000);
});
async function createDeck(page: Page) {
  await signInAs(page, "e2e-player-one");
  const response = await page.request.post("/api/decks", { headers: await csrfHeaders(page),
    data: { name: `Touch regression ${Date.now()}`, legion: "E2E Legion" },
  });
  expect(response.status()).toBe(201);
  const { deck } = await response.json();
  await setMobileViewport(page, "standard");
  await page.goto(`/decks/${deck._id}`);
  await page.getByRole("tab", { name: "Find cards", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Add one E2E Warrior 1", exact: true }),
  ).toBeVisible();
  return deck._id as string;
}

test("opening a deck from the deck list mounts only one HTML5 drag backend", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await signInAs(page, "e2e-player-one");
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/decks");
  await page
    .getByRole("button", {
      name: "Edit deck E2E Player 1 Deck",
      exact: true,
    })
    .click();
  await page.waitForURL(/\/decks\/[a-f\d]{24}$/);
  await expect(
    page.getByRole("heading", { name: /^Main:/ }),
  ).toBeVisible();
  expect(errors).not.toContain("Cannot have two HTML5 backends at the same time.");
});

test("deck builder keeps a focused workspace across tablet widths", async ({
  page,
}) => {
  const id = await createDeck(page);
  const tabs = page.getByRole("tablist", { name: "Deck builder sections" });

  for (const width of [768, 1023]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(`/decks/${id}`);
    await expect(tabs).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /^Main: 0/ }),
    ).toBeVisible();
    await page.getByRole("tab", { name: "Find cards", exact: true }).click();
    await expect(
      page.getByRole("button", { name: "Add one E2E Warrior 1", exact: true }),
    ).toBeVisible();
    await expectNoDocumentHorizontalOverflow(page);
  }

  await page.setViewportSize({ width: 1024, height: 900 });
  await page.goto(`/decks/${id}`);
  await expect(tabs).toHaveCount(0);
  await expect(page.getByRole("heading", { name: /^Main: 0/ })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Add one E2E Warrior 1", exact: true }),
  ).toBeVisible();
  const sidebar = await page
    .locator("[data-deck-builder-search-pane]")
    .boundingBox();
  const workspace = await page.locator("main").boundingBox();
  expect(sidebar).not.toBeNull();
  expect(workspace).not.toBeNull();
  expect(sidebar!.y).toBeLessThanOrEqual(workspace!.y + 12);
  expect(sidebar!.y + sidebar!.height).toBeGreaterThanOrEqual(
    workspace!.y + workspace!.height - 24,
  );
});

test("Find cards keeps the Add action inside its compact card strip", async ({
  page,
}) => {
  const id = await createDeck(page);
  const strip = page.locator("[data-mobile-horizontal-scroll-affordance]");
  const add = page.getByRole("button", {
    name: "Add one E2E Warrior 1",
    exact: true,
  });
  for (const width of [767, 1023]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(`/decks/${id}`);
    await page.getByRole("tab", { name: "Find cards", exact: true }).click();
    await expect(add).toBeVisible();
    const [stripBox, addBox] = await Promise.all([
      strip.boundingBox(),
      add.boundingBox(),
    ]);
    expect(stripBox).not.toBeNull();
    expect(addBox).not.toBeNull();
    expect(addBox!.y + addBox!.height).toBeLessThanOrEqual(
      stripBox!.y + stripBox!.height,
    );
  }
});

test("failed deck mutations surface an error without an Undo action", async ({
  page,
}) => {
  const id = await createDeck(page);
  await page
    .getByRole("button", { name: "Add one E2E Warrior 1", exact: true })
    .click();
  await page.route(`**/api/decks/${id}`, (route) =>
    route.request().method() === "PATCH"
      ? route.fulfill({ status: 500, json: { message: "Save rejected" } })
      : route.continue(),
  );
  await page
    .getByRole("button", { name: "Add one E2E Warrior 2", exact: true })
    .click();
  await expect(page.getByText("Save failed", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Undo", exact: true })).toHaveCount(0);
  await page.unroute(`**/api/decks/${id}`);
});

test("saved-card inspection and status warnings work after reloading and across presentations", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.route("**/api/banlist", (route) =>
    route.fulfill({
      json: [
        { name: "E2E Warrior 1", status: "suspended" },
        { name: "E2E Warrior 2", status: "restricted" },
        { name: "E2E Warrior 3", status: "limited" },
      ],
    }),
  );
  await signInAs(page, "e2e-player-one");
  const decks = await (
    await page.request.get("/api/decks?view=summary")
  ).json();
  const deck = decks.find(
    (item: { name: string }) => item.name === "E2E Player 1 Deck",
  );
  await setMobileViewport(page, "narrow");
  await page.goto(`/decks/${deck._id}`);
  for (const status of ["suspended", "restricted", "limited"])
    await expect(page.getByText(status, { exact: true })).toBeVisible();
  await page
    .getByRole("button", { name: "Inspect E2E Warrior 1", exact: true })
    .click();
  const inspector = page.getByRole("dialog", {
    name: "Card details",
    exact: true,
  });
  await expect(
    inspector.getByRole("heading", { name: "E2E Warrior 1" }),
  ).toBeVisible();
  await expect(inspector.getByText("suspended", { exact: true })).toBeVisible();
  await inspector.getByRole("button", { name: /image full screen/ }).click();
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("button", { name: "Close full screen image" }),
  ).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(inspector).toBeVisible();
  await inspector.getByRole("button", { name: "Done", exact: true }).click();
  await expectNoDocumentHorizontalOverflow(page);
  await page.setViewportSize({ width: 1280, height: 900 });
  for (const status of ["suspended", "restricted", "limited"])
    await expect(page.getByLabel(status, { exact: true })).toBeVisible();
  await setMobileViewport(page, "narrow");
  await page.goto("/browse");
  await page
    .getByRole("button", { name: "Open published deck E2E Public Deck" })
    .click();
  await page.waitForURL(/\/browse\/[a-f\d]{24}$/);
  for (const status of ["suspended", "restricted", "limited"])
    await expect(page.getByText(status, { exact: true })).toBeVisible();
  await expect(page.getByText("suspended", { exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});

test("mobile battlefield overview shows both sides and the hand without scrolling", async ({ page }) => {
  await signInAs(page, "e2e-player-one");
  await setMobileViewport(page, "landscape");
  await createRoomFromLobby(page, `overview-${Date.now()}`, true, "E2E Player 1 Deck");
  await expect(page.getByTestId("game-board").last()).toHaveAttribute("data-game-mode", "sandbox");
  await expect(page.getByRole("heading", { name: "Ready Up" })).toHaveCount(0);
  for (const viewport of ["landscape", "landscapeWide"] as const) {
    await setMobileViewport(page, viewport);
    const measurements = await page.locator(".game-play-area").evaluate((board) => {
      const hand = board.lastElementChild!.getBoundingClientRect();
      const zones = Array.from(board.querySelectorAll("[data-game-zone]"));
      return {
        count: zones.length,
        allVisible: zones.every((zone) => {
          const bounds = zone.getBoundingClientRect();
          return bounds.top >= 0 && bounds.left >= 0 &&
            bounds.right <= innerWidth && bounds.bottom <= hand.top + 1 &&
            bounds.height >= 24 && bounds.width >= 24;
        }),
        needsScroll: board.scrollHeight > board.clientHeight + 1,
      };
    });
    expect(measurements.count).toBe(48);
    expect(measurements.allVisible).toBe(true);
    expect(measurements.needsScroll).toBe(false);
    await expect(page.locator("[data-player-identity]")).toHaveCount(2);
    await expect(page.locator('[data-zone-label="ERAD"]').first()).toBeVisible();
    await expect(page.locator('[data-zone-label="REVL"]').first()).toBeVisible();
  }
  await page.locator('[data-mobile-overflow-exempt="hand-tray"] .card-inner').first().tap();
  const inspector = page.getByRole("dialog", { name: "Card details and actions", exact: true });
  await expect(inspector.getByRole("button", { name: "Select warrior zone", exact: true })).toHaveCount(0);
  await expect(inspector.getByRole("menuitem", { name: "Conscript", exact: true })).toBeVisible();
  await expect(inspector.getByText("A deterministic E2E fixture card.", { exact: true })).toBeVisible();
  await inspector.getByRole("button", { name: /image full screen/ }).tap();
  await expect(page.getByRole("button", { name: "Close full screen image", exact: true })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(inspector).toBeVisible();
  await inspector.getByRole("menuitem", { name: "Conscript", exact: true }).tap();
  const destination = page.locator('[data-game-zone="p1PlayerWarriors"]').first();
  await destination.tap();
  await expect(destination.locator(".card-inner")).toHaveCount(1);
  await destination.locator(".card-inner").tap();
  await expect(inspector).toBeVisible();
  await inspector.getByRole("menuitem", { name: "Move to…", exact: true }).tap();
  await expect(inspector.getByRole("menuitem", { name: "To Hand", exact: true })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(inspector).toHaveCount(0);
  await page.locator('[data-game-zone="p1PlayerDeck"] .card-inner').tap();
  await expect(inspector.getByRole("heading", { name: "Deck", exact: true })).toBeVisible();
  await expect(inspector.getByText("A deterministic E2E fixture card.", { exact: true })).toHaveCount(0);
  await expect(inspector.getByRole("menuitem", { name: "Draw", exact: true })).toBeVisible();
  await page.keyboard.press("Escape");
});

test("compact landscape sandbox controls and board zones remain reachable", async ({
  page,
}, testInfo) => {
  await signInAs(page, "e2e-player-one");
  await setMobileViewport(page, "landscape");
  await createRoomFromLobby(
    page,
    `touch-board-${Date.now()}`,
    true,
    "E2E Player 1 Deck",
  );
  await expect(page.locator("[data-compact-game]")).toHaveCount(1);
  for (const viewport of ["landscape", "landscapeWide"] as const) {
    await setMobileViewport(page, viewport);
    await expectNoDocumentHorizontalOverflow(page);
    const rail = page.getByRole("button", {
      name: "Open navigation",
      exact: true,
    });
    await expect(rail).toBeVisible();
    const bounds = await rail.boundingBox();
    expect(bounds!.width).toBeGreaterThanOrEqual(44);
    expect(bounds!.height).toBeGreaterThanOrEqual(44);
    const zones = page.locator("[data-game-zone]");
    expect(await zones.count()).toBeGreaterThan(30);
    for (const zone of await zones.all()) {
      await zone.scrollIntoViewIfNeeded();
      await expect
        .poll(async () => {
          const rect = await zone.boundingBox();
          return Boolean(rect && rect.width >= 24 && rect.height >= 24);
        })
        .toBe(true);
    }
    await rail.click();
    await expect(
      page.getByRole("button", { name: "Close menu", exact: true }),
    ).toBeVisible();
    const matchActionTop = await page.getByRole("button", { name: "Leave match", exact: true }).boundingBox();
    const navigationTop = await page.getByRole("button", { name: "Home", exact: true }).boundingBox();
    expect(matchActionTop!.y).toBeLessThan(navigationTop!.y);
    await page.getByRole("button", { name: "Close menu", exact: true }).click();
    await expectMinimumTouchTargets(page);
    await expectVisibleCardImagesLoaded(page);
    await page.screenshot({
      path: testInfo.outputPath(`${viewport}-board.png`),
    });
  }
  // Exercise the real card menu and existing game command path with touch.
  const deckCard = page
    .locator('[data-game-zone="p1PlayerDeck"] .card-inner')
    .first();
  await deckCard.scrollIntoViewIfNeeded();
  await deckCard.tap();
  await expectVisibleCardImagesLoaded(page);
  await page.screenshot({ path: testInfo.outputPath("open-card-menu.png") });
  await page.getByRole("menuitem", { name: "Draw", exact: true }).tap();
  await expect(page.getByRole("dialog", { name: "Card details and actions", exact: true })).toHaveCount(0);
  const handCard = page.locator('[data-mobile-overflow-exempt="hand-tray"] .card-inner').first();
  await handCard.tap();
  const play = page
    .getByRole("menuitem", { name: "Conscript", exact: true })
    .first();
  await expect(play).toBeVisible();
  await play.tap();
  await expect(
    page.getByRole("button", { name: "Cancel", exact: true }),
  ).toBeVisible();
  await page.locator('[data-game-zone="p2PlayerWarriors"]').first().tap();
  await expect(
    page.getByText("Choose an empty Warrior zone on your side.", {
      exact: true,
    }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Cancel", exact: true }).tap();
  await expect(
    page.getByRole("button", { name: "Cancel", exact: true }),
  ).toHaveCount(0);
  await handCard.tap();
  await play.tap();
  const target = page.locator('[data-game-zone="p1PlayerWarriors"]').first();
  await target.tap();
  await expect(target.locator(".card-inner")).toHaveCount(1);
  await page.locator('[data-game-zone="p1PlayerWarlord"] .card-inner').tap();
  const dcm = page.getByRole("dialog", { name: "Card details and actions", exact: true }).getByText(/^DCM:/);
  const previousDcm = Number((await dcm.innerText()).split(":")[1]);
  await page.getByRole("button", { name: "Increase DCM", exact: true }).tap();
  await expect(dcm).toHaveText(`DCM: ${previousDcm + 1}`);
  await page.getByRole("button", { name: "Decrease DCM", exact: true }).tap();
  await expect(dcm).toHaveText(`DCM: ${previousDcm}`);
  await page.getByRole("button", { name: /image full screen/ }).tap();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "Close full screen image" })).toBeFocused();
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Close card details and actions", exact: true }).tap();
  await expect(
    page.getByRole("button", { name: "Cancel", exact: true }),
  ).toHaveCount(0);
});

test("short landscape pages keep home and deck cards fully reachable", async ({ page }) => {
  await signInAs(page, "e2e-player-one");
  for (const size of [
    { width: 568, height: 320 },
    { width: 667, height: 375 },
    { width: 844, height: 390 },
    { width: 1024, height: 568 },
  ]) {
    await page.setViewportSize(size);
    for (const [route, label] of [
      ["/", "Open published deck E2E Public Deck"],
      ["/decks", "Edit deck E2E Player 1 Deck"],
      ["/browse", "Open published deck E2E Public Deck"],
      ["/cards", "Inspect E2E Warrior 8"],
    ]) {
      await page.goto(route);
      const card = page.getByRole("button", { name: label, exact: true });
      await card.scrollIntoViewIfNeeded();
      await expect(card, `${route} at ${size.width}×${size.height}`).toBeInViewport({ ratio: 1 });
      await card.click({ trial: true });
      await expectNoDocumentHorizontalOverflow(page);
    }
    if (size.width < 1024) {
      await page.goto("/decks");
      await page.getByRole("button", { name: "Edit deck E2E Player 1 Deck", exact: true }).click();
      await page.waitForURL(/\/decks\/[a-f\d]{24}$/);
      await page.getByRole("tab", { name: "Find cards", exact: true }).click();
      const add = page.getByRole("button", { name: "Add one E2E Warrior 1", exact: true });
      await add.scrollIntoViewIfNeeded();
      // Allow fractional-pixel rounding at the scrollport edge.
      await expect(add).toBeInViewport({ ratio: 0.99 });
      await add.click({ trial: true });
      await expectNoDocumentHorizontalOverflow(page);
    }
  }
});

test("real portrait routes and filters have reachable touch controls at every supported phone width", async ({
  page,
}) => {
  test.setTimeout(180_000);
  await signInAs(page, "e2e-player-one");
  const decks = await (
    await page.request.get("/api/decks?view=summary")
  ).json();
  const deck = decks.find(
    (item: { name: string }) => item.name === "E2E Player 1 Deck",
  );
  for (const viewport of ["narrow", "small", "standard", "wide"] as const) {
    await setMobileViewport(page, viewport);
    for (const route of [
      "/",
      "/decks",
      "/cards",
      "/browse",
      `/decks/${deck._id}`,
    ]) {
      await page.goto(route);
      if (route === "/") {
        await expect(
          page.getByRole("button", {
            name: "Open published deck E2E Public Deck",
          }),
        ).toBeVisible();
        await expect(
          page.getByRole("button", { name: /Edit deck/ }).first(),
        ).toBeVisible();
      }
      if (route === "/decks")
        await expect(
          page.getByRole("button", {
            name: "Edit deck E2E Player 1 Deck",
            exact: true,
          }),
        ).toBeVisible();
      if (route === "/cards")
        await expect(
          page.getByRole("button", {
            name: "Inspect E2E Warrior 1",
            exact: true,
          }),
        ).toBeVisible();
      if (route === "/browse")
        await expect(
          page.getByRole("button", {
            name: "Open published deck E2E Public Deck",
          }),
        ).toBeVisible();
      if (route.startsWith("/decks/"))
        await expect(
          page.getByRole("button", {
            name: "Inspect E2E Warrior 1",
            exact: true,
          }),
        ).toBeVisible();
      await expectNoDocumentHorizontalOverflow(page);
      await expectControlsReachable(page);
    }
    await page.getByRole("tab", { name: "Find cards", exact: true }).click();
    await expect(
      page.getByRole("button", { name: "Add one E2E Warrior 1", exact: true }),
    ).toBeVisible();
    await expectControlsReachable(page);
  }
});
