import { expect, test, type Locator, type Page } from "@playwright/test";
import { signInAs, createRoomFromLobby } from "./fixtures";
import { expectNoDocumentHorizontalOverflow } from "./mobile";

// Cover each layout mode and both sides of the builder's desktop breakpoint.
// Specific long-list and resize regressions below keep their own edge cases.
const sizes = [
  { width: 320, height: 568 }, { width: 568, height: 320 },
  { width: 768, height: 1024 },
  { width: 1023, height: 600 }, { width: 1024, height: 568 },
  { width: 1280, height: 720 },
];

async function expectMenuAnchored(page: Page, trigger: Locator, menu: Locator) {
  await expect(menu).toBeVisible();
  // Radix makes the surrounding form aria-hidden while its modal listbox is open.
  const anchorTrigger = trigger.or(page.locator('[role="combobox"][data-state="open"]'));
  let geometry: unknown;
  await expect.poll(async () => {
    const anchor = await anchorTrigger.boundingBox();
    const popup = await menu.boundingBox();
    geometry = { anchor, popup, viewport: page.viewportSize() };
    if (!anchor || !popup) return false;
    const size = page.viewportSize()!;
    const gap = Math.min(Math.abs(popup.y - anchor.y - anchor.height), Math.abs(anchor.y - popup.y - popup.height));
    return popup.x >= 0 && popup.y >= 0 && popup.x + popup.width <= size.width + 1
      && popup.y + popup.height <= size.height + 1 && gap <= 12;
  }, { message: "Options must stay within the viewport and adjacent to their trigger" }).toBe(true).catch(async (error) => {
    throw new Error(`${error.message}\nGeometry: ${JSON.stringify(geometry)}`);
  });
}

async function expectInsideViewport(page: Page, element: Locator) {
  await expect(element).toBeVisible();
  await expect(element).toBeInViewport({ ratio: 0.99 });
  const box = await element.boundingBox();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(page.viewportSize()!.width + 1);
}

test.describe("app-wide control QA", () => {
  test.use({ hasTouch: true, actionTimeout: 10_000 });

  test("collection filter menus stay anchored, selectable and dismissible at every breakpoint", async ({ page }) => {
    test.setTimeout(180_000);
    await signInAs(page, "e2e-player-one");
    for (const size of sizes) {
      await page.setViewportSize(size);
      for (const route of ["/browse", "/decks"]) {
        await test.step(`${route} ${size.width}x${size.height}`, async () => {
          await page.goto(route);
          const trigger = page.getByRole("button", { name: "All legions", exact: true });
          // The first visit also compiles its data endpoint on the dev server.
          // Wait for fixture data before starting the shorter control checks.
          await expect(page.getByRole("button", { name: route === "/browse" ? "Open published deck E2E Public Deck" : "Edit deck E2E Player 1 Deck", exact: true })).toBeVisible({ timeout: 30_000 });
          await trigger.click();
          const listbox = page.getByRole("listbox");
          await expectMenuAnchored(page, trigger, listbox.locator(".."));
          await page.getByRole("option", { name: "E2E Legion", exact: true }).click();
          await expect(page.getByRole("option", { name: "E2E Legion", exact: true })).toHaveAttribute("aria-selected", "true");
          await page.keyboard.press("Escape");
          await expect(listbox).toHaveCount(0);
          await expect(page.locator('button[aria-haspopup="listbox"]').first()).toBeFocused();
          await page.getByRole("group", { name: "Filter by legion", exact: true }).getByRole("button", { name: "Clear", exact: true }).click();
          await expect(trigger).toBeVisible();
          await expect(page.getByRole("group", { name: "Filter by legion", exact: true }).getByRole("button", { name: "Clear", exact: true })).toHaveCount(0);
          await expectNoDocumentHorizontalOverflow(page);
        });
      }
    }
  });

  test("gallery filters apply, cancel, clear and search without losing keyboard access", async ({ page }) => {
    test.setTimeout(180_000);
    for (const size of sizes) {
      await test.step(`${size.width}x${size.height}`, async () => {
        await page.setViewportSize(size);
        await page.goto("/cards");
        await expect(page.getByRole("button", { name: "Inspect E2E Warrior 1", exact: true })).toBeVisible();
        const search = page.getByRole("textbox", { name: "Search cards", exact: true });
        await search.fill("E2E Warrior 8");
        await expect(page.getByRole("button", { name: "Inspect E2E Warrior 8", exact: true })).toBeVisible();
        await expect(page.getByRole("button", { name: "Inspect E2E Warrior 1", exact: true })).toHaveCount(0);
        await search.fill("");
        const mobile = size.width < 1024;
        if (mobile) await page.getByRole("button", { name: /^Filters/ }).click();
        const type = page.getByRole("button", { name: "Type", exact: true });
        const typeId = await type.getAttribute("aria-controls");
        await type.press("ArrowDown");
        const typeOptions = page.getByRole("listbox").getByRole("option");
        await expect(typeOptions.first()).toBeFocused();
        const warriorIndex = await typeOptions.evaluateAll((options) =>
          options.findIndex((option) => option.textContent?.trim() === "Warrior"),
        );
        expect(warriorIndex).toBeGreaterThanOrEqual(0);
        for (let index = 0; index < warriorIndex; index += 1) {
          await page.keyboard.press("ArrowDown");
        }
        const warrior = typeOptions.filter({ hasText: /^Warrior$/ });
        await expect(warrior).toBeFocused();
        if (!mobile) await expectMenuAnchored(page, type, page.getByRole("listbox").locator(".."));
        await warrior.press("Space");
        await expect(warrior).toHaveAttribute("aria-selected", "true");
        await warrior.press("Escape");
        await expect(page.locator(`button[aria-controls="${typeId}"]`)).toBeFocused();
        if (mobile) {
          await expect(page.getByRole("dialog", { name: "Card filters" })).toBeVisible();
          await page.getByRole("button", { name: "Apply (1)", exact: true }).click();
          await expect(page.getByRole("dialog", { name: "Card filters" })).toHaveCount(0);
          await page.getByRole("button", { name: /^Filters/ }).click();
        }
        await page.getByRole("button", { name: mobile ? "Reset" : "Clear all", exact: true }).click();
        if (mobile) await page.getByRole("button", { name: "Apply", exact: true }).click();
        await expectNoDocumentHorizontalOverflow(page);
      });
    }
  });

  test("create forms keep inputs and single-select options reachable and Escape preserves the form", async ({ page }) => {
    test.setTimeout(180_000);
    await signInAs(page, "e2e-player-one");
    for (const size of sizes) {
      await page.setViewportSize(size);
      await page.goto("/decks");
      await page.getByRole("button", { name: /create deck/i }).first().click();
      const name = page.getByLabel("Deck Name", { exact: false });
      await name.fill("QA unsaved deck");
      const legion = page.getByRole("combobox");
      await legion.click();
      await expectMenuAnchored(page, legion, page.getByRole("listbox"));
      await page.keyboard.press("Escape");
      await expect(name).toBeVisible();
      await expect(legion).toBeFocused();
      await legion.click();
      await page.getByRole("option", { name: "E2E Legion", exact: true }).click();
      await expect(legion).toContainText("E2E Legion");
      await name.fill("");
      await page.getByRole("button", { name: "Create Deck", exact: true }).click();
      expect(await name.evaluate((input: HTMLInputElement) => input.validity.valueMissing)).toBe(true);
      await page.getByRole("button", { name: "Close create deck", exact: true }).click();
      await page.goto("/");
      await page.getByRole("button", { name: "Play", exact: true }).click();
      await page.getByLabel("Room Name", { exact: true }).fill("QA unsaved room");
      await page.getByLabel("Room Password", { exact: false }).fill("not-a-real-password");
      for (const label of ["Deck", "P2 Deck (Optional)"]) {
        const picker = page.getByLabel(label, { exact: true });
        await picker.click();
        await expectMenuAnchored(page, picker, page.getByRole("listbox"));
        await page.getByRole("option", { name: "E2E Player 1 Deck", exact: true }).click();
        await expect(picker).toContainText("E2E Player 1 Deck");
      }
      const sandbox = page.getByLabel("Sandbox Mode", { exact: true });
      await sandbox.uncheck(); await expect(sandbox).not.toBeChecked();
      await sandbox.check(); await expect(sandbox).toBeChecked();
      const create = page.getByRole("button", { name: "Create New Game", exact: true });
      await create.scrollIntoViewIfNeeded();
      await expectInsideViewport(page, create);
      await page.getByRole("button", { name: "Close create game", exact: true }).click();
      await expectNoDocumentHorizontalOverflow(page);
    }
  });

  test("builder search filters and deck selector remain usable in narrow and short workspaces", async ({ page }) => {
    test.setTimeout(180_000);
    await signInAs(page, "e2e-player-one");
    const decks = await (await page.request.get("/api/decks?view=summary")).json();
    const deck = decks.find((item: { name: string }) => item.name === "E2E Player 1 Deck");
    for (const size of sizes) {
      await page.setViewportSize(size);
      await page.goto(`/decks/${deck._id}`);
      const picker = page.getByRole("combobox");
      await expect(picker).toContainText("E2E Player 1 Deck");
      if (size.width < 1024) await expect(page.getByRole("tab", { name: "Deck", exact: true })).toBeVisible();
      await picker.click();
      await expectMenuAnchored(page, picker, page.getByRole("listbox"));
      await page.keyboard.press("End");
      await page.keyboard.press("Escape");
      if (size.width < 1024) await page.getByRole("tab", { name: "Find cards", exact: true }).click();
      await expect(page.getByRole("button", { name: "Add one E2E Warrior 1", exact: true })).toBeVisible();
      for (const label of ["Legion", "Type", "Rarity", "Set", "S/R/L"]) {
        const filter = page.getByRole("button", { name: label, exact: true });
        await filter.click();
        const list = page.getByRole("listbox");
        await expectMenuAnchored(page, filter, list.locator(".."));
        if (size.width === 568 && label === "Legion") {
          // A surrounding layout change can move the trigger without a scroll
          // or a resize; the open menu must follow it.
          await filter.evaluate((element) => { element.parentElement!.style.position = "relative"; element.parentElement!.style.top = "50px"; });
          await expectMenuAnchored(page, filter, list.locator(".."));
          await filter.evaluate((element) => { element.parentElement!.style.position = ""; element.parentElement!.style.top = ""; });
          await expectMenuAnchored(page, filter, list.locator(".."));
        }
        const option = list.getByRole("option").first();
        if (await option.count()) {
          await option.click();
          await expect(option).toHaveAttribute("aria-selected", "true");
        }
        await page.keyboard.press("Escape");
        await page.getByRole("button", { name: "Clear", exact: true }).click();
      }
      const search = page.getByRole("textbox", { name: "Search cards" });
      await search.fill("this-card-does-not-exist");
      await expect(page.locator("[data-deck-builder-search-pane]").getByRole("button", { name: /^Add one/ })).toHaveCount(0);
      await search.fill("E2E Warrior 1");
      await expect(page.getByRole("button", { name: "Add one E2E Warrior 1", exact: true })).toBeVisible();
      await expectNoDocumentHorizontalOverflow(page);
    }
  });

  test("sandbox settings selectors, chat and pile search work at landscape breakpoints", async ({ page }) => {
    test.setTimeout(180_000);
    await signInAs(page, "e2e-player-one");
    await page.setViewportSize({ width: 844, height: 390 });
    await createRoomFromLobby(page, `control-qa-${Date.now()}`, true, "E2E Player 1 Deck");
    for (const size of sizes.filter((size) => size.width > size.height)) {
      await page.setViewportSize(size);
      if (size.width <= 1100) await page.getByRole("button", { name: "Open navigation", exact: true }).click();
      await page.getByRole("button", { name: "Tools & settings", exact: true }).click();
      await page.getByRole("button", { name: "Change Deck(s)", exact: true }).click();
      for (const name of ["Player 1 Deck", "Player 2 Deck"]) {
        const select = page.getByRole("combobox", { name, exact: true });
        await select.click();
        await expectMenuAnchored(page, select, page.getByRole("listbox"));
        await page.keyboard.press("Escape");
        await expect(page.getByRole("dialog")).toBeVisible();
      }
      const checkbox = page.getByRole("checkbox", { name: "Open Hand", exact: true });
      const checked = await checkbox.isChecked();
      await checkbox.setChecked(!checked); await expect(checkbox).toBeChecked({ checked: !checked });
      await checkbox.setChecked(checked);
      await page.getByRole("button", { name: "Close", exact: true }).click();
      if (size.width <= 1100) {
        await page.getByRole("button", { name: "Close menu", exact: true }).click();
        await page.getByRole("button", { name: "Match log and chat", exact: true }).click();
      }
      const chat = page.getByRole("textbox", { name: "Match chat", exact: true });
      await chat.fill("QA control check"); await chat.press("Enter");
      await expect(chat).toHaveValue("");
      if (size.width <= 1100) await page.getByRole("button", { name: "Close Activity", exact: true }).click();
      await expectNoDocumentHorizontalOverflow(page);
    }
  });

  test("long filter lists stay on-screen through resize and support last-option selection", async ({ page }) => {
    const options = Array.from({ length: 40 }, (_, index) => `Option ${index + 1} with a deliberately long label to exercise wrapping`);
    await page.route("**/api/cards/filterOptions", (route) => route.fulfill({ json: { legion: ["E2E Legion"], type: options, rarity: [], set: [], srlStatus: [] } }));
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto("/cards");
    await page.getByRole("button", { name: "Type", exact: true }).press("ArrowDown");
    // ArrowDown focuses the first option on the next animation frame.
    // Sending End before that handoff can target the trigger instead.
    const first = page.getByRole("option", { name: options[0], exact: true });
    await expect(first).toBeFocused();
    await page.keyboard.press("End");
    const last = page.getByRole("option", { name: options[39], exact: true });
    await expect(last).toBeFocused(); await expectInsideViewport(page, last);
    await last.press("Space"); await expect(last).toHaveAttribute("aria-selected", "true");
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: "Set", exact: true }).click();
    await expect(page.getByText("No options available", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Select all", exact: true })).toBeDisabled();
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: "Rarity", exact: true }).click();
    await page.getByRole("textbox", { name: "Search cards" }).click();
    await expect(page.getByRole("listbox")).toHaveCount(0);
    for (const size of [{ width: 568, height: 240 }, { width: 390, height: 320 }, { width: 320, height: 568 }]) {
      await page.setViewportSize(size);
      await page.getByRole("button", { name: /^Filters/ }).click();
      const close = page.getByRole("button", { name: "Close filters", exact: true });
      await expect(close).toBeFocused();
      const type = page.getByRole("button", { name: options[39], exact: true });
      await type.scrollIntoViewIfNeeded();
      await type.press("ArrowDown");
      await expect(first).toBeFocused();
      await expectMenuAnchored(page, type, page.getByRole("listbox").locator(".."));
      await page.keyboard.press("End");
      await expect(last).toBeFocused(); await expectInsideViewport(page, last);
      await page.keyboard.press("Escape");
      await expect(page.getByRole("dialog", { name: "Card filters" })).toBeVisible();
      await close.click();
      await expect(page.getByRole("dialog", { name: "Card filters" })).toHaveCount(0);
    }
  });

  test("import and username inputs validate, recover from errors, and stay reachable", async ({ page }) => {
    test.setTimeout(180_000);
    await signInAs(page, "e2e-player-one");
    await page.route("https://api.legionstoolbox.com/**", (route) => route.fulfill({ status: 503, body: "QA simulated upstream outage" }));
    for (const size of sizes) {
      await page.setViewportSize(size);
      await page.goto("/decks");
      await page.getByRole("button", { name: /Import/i }).first().click();
      const id = page.getByLabel("Toolbox Deck ID", { exact: true });
      await id.fill("4938");
      await expectInsideViewport(page, id);
      await page.getByRole("button", { name: "Generate Preview", exact: true }).click();
      await expect(page.getByRole("dialog").getByRole("alert")).toContainText("503");
      await expect(id).toBeEnabled();
      await page.getByRole("button", { name: "Close deck import", exact: true }).click();
      if (size.width < 768) {
        await page.getByRole("button", { name: "Open navigation", exact: true }).click();
        await page.getByRole("button", { name: "Edit username", exact: true }).click();
      } else {
        await page.getByRole("button", { name: "Open account menu", exact: true }).click();
        await page.getByRole("menuitem", { name: "Edit username", exact: true }).click();
      }
      const username = page.getByRole("textbox", { name: "Username", exact: true });
      await expect(page.getByRole("button", { name: "Close username editor", exact: true })).toBeFocused();
      await username.fill("x");
      await expectInsideViewport(page, username);
      await page.getByRole("button", { name: /^(Set|Update) username$/ }).click();
      await expect(page.getByRole("dialog", { name: "Set Battleground username" }).getByRole("alert")).toBeVisible();
      await expect(username).toHaveValue("x");
      await username.press("Escape");
      await expect(page.getByRole("dialog", { name: "Set Battleground username" })).toHaveCount(0);
      await expect(page.getByRole("button", { name: size.width < 768 ? "Open navigation" : "Open account menu", exact: true })).toBeFocused();
      await expect(page.getByRole("button", { name: "Close navigation", exact: true })).toHaveCount(0);
      await expectNoDocumentHorizontalOverflow(page);
    }
  });

  test("join-room form keeps deck, password and error recovery reachable", async ({ browser, page }) => {
    test.setTimeout(180_000);
    const hostContext = await browser.newContext();
    try {
      const host = await hostContext.newPage();
      await signInAs(host, "e2e-player-one");
      const room = `join-control-qa-${Date.now()}`;
      await host.getByRole("button", { name: "Play", exact: true }).click();
      await host.getByLabel("Room Name", { exact: true }).fill(room);
      await host.getByLabel("Room Password", { exact: false }).fill("QA-password");
      await host.getByLabel("Deck", { exact: true }).click();
      await host.getByRole("option", { name: "E2E Player 1 Deck", exact: true }).click();
      await host.getByRole("button", { name: "Create New Game", exact: true }).click();
      await expect(host).toHaveURL(/\/play\?/);
      await signInAs(page, "e2e-player-two");
      for (const size of sizes) {
        await page.setViewportSize(size);
        await page.goto("/");
        await page.getByRole("article").filter({ has: page.getByText(room, { exact: true }) }).getByRole("button", { name: "Join", exact: true }).click();
        const picker = page.getByLabel("Deck", { exact: true });
        await picker.click();
        await expectMenuAnchored(page, picker, page.getByRole("listbox"));
        await page.getByRole("option", { name: "E2E Player 2 Deck", exact: true }).click();
        const password = page.getByLabel("Room Password", { exact: true });
        await password.fill("incorrect");
        await page.getByRole("button", { name: "Join Room", exact: true }).click();
        await expect(page.getByRole("dialog").getByRole("alert")).toBeVisible();
        await expect(password).toBeEnabled();
        await password.fill("QA-password");
        await expect(password).toHaveValue("QA-password");
        await page.getByRole("button", { name: "Close join room", exact: true }).click();
        await expectNoDocumentHorizontalOverflow(page);
      }
    } finally { await hostContext.close(); }
  });

  test("pile search and numeric plunder input reject invalid values without clipping or runtime errors", async ({ page }) => {
    test.setTimeout(120_000);
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await signInAs(page, "e2e-player-one");
    await page.setViewportSize({ width: 844, height: 390 });
    await createRoomFromLobby(page, `pile-control-qa-${Date.now()}`, true, "E2E Player 1 Deck");
    for (const size of [{ width: 568, height: 320 }, { width: 667, height: 375 }, { width: 844, height: 390 }]) {
      await page.setViewportSize(size);
      await page.getByRole("button", { name: "Open deck actions", exact: true }).click();
      await page.getByRole("menuitem", { name: "Search Deck", exact: true }).click();
      const search = page.getByRole("textbox", { name: "Search card pile", exact: true });
      await expectInsideViewport(page, search);
      await search.fill("not-a-real-card");
      await expect(page.getByRole("dialog").locator(".card-inner")).toHaveCount(0);
      await search.fill("");
      await expect(page.getByRole("dialog").locator(".card-inner").first()).toBeVisible();
      await page.getByRole("dialog").getByRole("button", { name: "Unified", exact: true }).click();
      await expect(page.getByRole("dialog").locator(".card-inner")).toHaveCount(0);
      await page.getByRole("dialog").getByRole("button", { name: "All", exact: true }).click();
      await page.getByRole("button", { name: "Close Your deck", exact: true }).click();
      await page.getByRole("button", { name: "Open deck actions", exact: true }).click();
      await page.getByRole("menuitem", { name: "Plunder", exact: true }).click();
      const number = page.getByRole("spinbutton", { name: "card to draw:", exact: true });
      await expectInsideViewport(page, number);
      const plunder = page.getByRole("button", { name: "Plunder", exact: true });
      for (const value of ["", "0", "-1", "1", "2.5", "999"]) {
        await number.fill(value); await expect(plunder).toBeDisabled();
        await expect(number).toHaveValue(value);
      }
      await number.fill("2"); await expect(plunder).toBeEnabled();
      await page.getByRole("button", { name: "close", exact: true }).click();
    }
    expect(errors).toEqual([]);
  });

  test("rapidly clearing a deck filter cannot let an older response replace the latest results", async ({ page }) => {
    await signInAs(page, "e2e-player-one");
    let release: () => void;
    let filteredRequested: () => void;
    const pending = new Promise<void>((resolve) => { release = resolve; });
    const requested = new Promise<void>((resolve) => { filteredRequested = resolve; });
    let delivered: () => void;
    const complete = new Promise<void>((resolve) => { delivered = resolve; });
    await page.route("**/api/decks?*", async (route) => {
      if (!new URL(route.request().url()).searchParams.has("legion")) return route.continue();
      const response = await route.fetch();
      const data = await response.json();
      filteredRequested();
      await pending;
      await route.fulfill({ json: [{ ...data[0], name: "Outdated filtered result" }] });
      delivered();
    });
    await page.goto("/decks");
    await expect(page.getByRole("button", { name: "Edit deck E2E Player 1 Deck", exact: true })).toBeVisible();
    await page.getByRole("button", { name: "All legions", exact: true }).click();
    await page.getByRole("option", { name: "E2E Legion", exact: true }).click();
    await requested;
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: "Clear", exact: true }).click();
    await expect(page.getByRole("button", { name: "Edit deck E2E Player 1 Deck", exact: true })).toBeVisible();
    release(); await complete;
    await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
    await expect(page.getByRole("button", { name: "Edit deck Outdated filtered result", exact: true })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Edit deck E2E Player 1 Deck", exact: true })).toBeVisible();
  });

  test("single-select long lists keep the last option readable on short and narrow screens", async ({ page }) => {
    await signInAs(page, "e2e-player-one");
    const legions = Array.from({ length: 30 }, (_, index) => `QA Legion ${index + 1} with an intentionally long and descriptive name`);
    await page.route("**/api/cards/filterOptions", (route) => route.fulfill({ json: { legion: legions, type: [], rarity: [], set: [], srlStatus: [] } }));
    for (const size of [{ width: 320, height: 568 }, { width: 568, height: 240 }, { width: 844, height: 390 }, { width: 1280, height: 500 }]) {
      await page.setViewportSize(size);
      await page.goto("/decks");
      await page.getByRole("button", { name: /create deck/i }).first().click();
      const legion = page.getByRole("combobox");
      await legion.click();
      await expectMenuAnchored(page, legion, page.getByRole("listbox"));
      await page.keyboard.press("End");
      const last = page.getByRole("option", { name: legions[29], exact: true });
      await expect(last).toBeFocused();
      await expectInsideViewport(page, last);
      await last.press("Enter");
      await expect(legion).toContainText(legions[29]);
      await page.getByRole("button", { name: "Close create deck", exact: true }).click();
    }
  });

  test("touch text inputs retain a no-zoom font size in both orientations", async ({ page }) => {
    expect(await page.evaluate(() => matchMedia("(any-pointer: coarse)").matches)).toBe(true);
    for (const size of [{ width: 320, height: 568 }, { width: 568, height: 320 }]) {
      await page.setViewportSize(size);
      await page.goto("/cards");
      const input = page.getByRole("textbox", { name: "Search cards", exact: true });
      await expect(input).toBeVisible();
      expect(await input.evaluate((element) => parseFloat(getComputedStyle(element).fontSize))).toBeGreaterThanOrEqual(16);
    }
  });

  test("cancelled filter drafts stay unapplied and select-all and reset remain consistent", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/cards");
    await page.getByRole("button", { name: "Filters", exact: true }).click();
    await page.getByRole("button", { name: "Type", exact: true }).click();
    await page.getByRole("button", { name: "Select all", exact: true }).click();
    await expect(page.getByRole("option", { name: "Warrior", exact: true })).toHaveAttribute("aria-selected", "true");
    await page.getByRole("button", { name: "Clear all", exact: true }).click();
    await expect(page.getByRole("option", { name: "Warrior", exact: true })).toHaveAttribute("aria-selected", "false");
    await page.getByRole("option", { name: "Warrior", exact: true }).click();
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: "Close filters", exact: true }).click();
    await expect(page.getByRole("button", { name: "Filters", exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Filters", exact: true }).click();
    await page.getByRole("button", { name: "Type", exact: true }).click();
    await expect(page.getByRole("option", { name: "Warrior", exact: true })).toHaveAttribute("aria-selected", "false");
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: "Close filters", exact: true }).click();
  });

  test("published viewer grouping remains usable in mobile and desktop layouts", async ({ page }) => {
    await page.goto("/browse");
    await page.getByRole("button", { name: "Open published deck E2E Public Deck", exact: true }).click();
    await page.waitForURL(/\/browse\/[a-f\d]{24}$/);
    const route = page.url();
    // Inspector interactions belong to the smoke and overlay suites.
    for (const size of [{ width: 320, height: 568 }, { width: 768, height: 1024 }, { width: 1280, height: 720 }]) {
      await page.setViewportSize(size);
      await page.goto(route);
      await expect(page.getByRole("heading", { name: "E2E Public Deck", exact: true })).toBeVisible();
      if (size.width >= 768) {
        const grouped = page.getByRole("checkbox", { name: "Grouped View", exact: true });
        const checked = await grouped.isChecked();
        await grouped.setChecked(!checked);
        await expect(grouped).toBeChecked({ checked: !checked });
        await grouped.setChecked(checked);
      }
      await expect(page.getByRole("button", { name: "Inspect E2E Warrior 1", exact: true }).first()).toBeVisible();
      await expectNoDocumentHorizontalOverflow(page);
    }
  });
});
