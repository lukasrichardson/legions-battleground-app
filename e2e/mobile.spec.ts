import { test, expect } from "@playwright/test";
import { createRoomFromLobby, newSignedInPage, signInAs } from "./fixtures";
import {
  expectMobileRouteLayout,
  expectControlsReachable,
  expectNoDocumentHorizontalOverflow,
  expectTapTargetVisible,
  expectVisibleInteractiveElementsInViewport,
  setMobileViewport,
} from "./mobile";

test("the mobile bounds helper rejects clipped controls and permits only named scroll strips", async ({
  page,
}) => {
  await setMobileViewport(page, "narrow");
  await page.setContent(`
    <button style="position: fixed; left: calc(100vw - 12px); top: 12px; width: 44px; height: 44px">Clipped action</button>
  `);
  await expect(
    expectVisibleInteractiveElementsInViewport(page),
  ).rejects.toThrow(/Clipped action/);
  await expect(expectControlsReachable(page)).rejects.toThrow(/Clipped action/);

  await page.setContent(`
    <div data-mobile-overflow-exempt="card-strip" data-mobile-horizontal-scroll-affordance>
      <button style="position: fixed; left: calc(100vw - 12px); top: 12px; width: 44px; height: 44px">Card strip item</button>
    </div>
  `);
  await expectVisibleInteractiveElementsInViewport(page);
});

test("control reachability rechecks replacement nodes instead of measuring detached elements", async ({ page }) => {
  await page.setContent('<button style="width:44px;height:44px">Original</button>');
  await page.evaluate(() => {
    const button = document.querySelector("button")!;
    button.scrollIntoView = () => {
      requestAnimationFrame(() => {
        const replacement = button.cloneNode(true) as HTMLButtonElement;
        replacement.textContent = "Replacement";
        button.replaceWith(replacement);
      });
    };
  });
  await expectControlsReachable(page);
  await expect(page.getByRole("button", { name: "Replacement", exact: true })).toBeVisible();
});

test("phone navigation exposes a reachable route and closes after navigation", async ({
  page,
}) => {
  await setMobileViewport(page, "narrow");
  await page.goto("/");

  await expectMobileRouteLayout(page, "narrow");
  await page.getByRole("button", { name: "Open navigation" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  const cardsLink = page.getByRole("link", { name: "Cards", exact: true });
  await expectTapTargetVisible(cardsLink);
  await cardsLink.click();
  await expect(page).toHaveURL(/\/cards$/);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expectNoDocumentHorizontalOverflow(page);
});

test("the card gallery opens and closes an inspector from a phone tap", async ({
  page,
}) => {
  await setMobileViewport(page, "standard");
  await page.goto("/cards");

  const card = page.getByRole("button", { name: /Inspect E2E Warrior 1/i });
  await expectTapTargetVisible(card);
  await card.click();
  const inspector = page.getByRole("dialog", { name: "Card details" });
  await expect(inspector).toBeVisible();
  await expect(inspector.getByLabel("Close card details")).toBeVisible();
  await expectNoDocumentHorizontalOverflow(page);
  await inspector.getByLabel("Close card details").click();
  await expect(inspector).toHaveCount(0);
});

test("the phone deck builder uses explicit quantity controls without a reversal action", async ({
  page,
}) => {
  await signInAs(page, "e2e-player-one");
  await setMobileViewport(page, "standard");
  await page.goto("/decks");
  await page
    .getByRole("button", { name: /create deck/i })
    .first()
    .click();
  await page.getByLabel("Deck Name").fill(`Mobile controls ${Date.now()}`);
  await page.getByRole("combobox").click();
  await page.getByRole("option", { name: "E2E Legion", exact: true }).click();
  const createResponse = page.waitForResponse(
    (response) =>
      response.url().includes("/api/decks") &&
      response.request().method() === "POST",
  );
  await page.getByRole("button", { name: "Create Deck", exact: true }).click();
  await expect((await createResponse).status()).toBe(201);
  await page.waitForURL(/\/decks\/[a-f\d]{24}$/, { timeout: 30_000 });
  await expectNoDocumentHorizontalOverflow(page);

  await page.getByRole("tab", { name: "Find cards", exact: true }).click();
  const inspect = page.getByRole("button", { name: "Inspect E2E Warrior 1" });
  await expectTapTargetVisible(inspect);
  await inspect.click();
  const inspector = page.getByRole("dialog", { name: "Card details" });
  await expect(inspector).toBeVisible();
  // Inspecting content must not mutate the deck; mutations have dedicated controls.
  await inspector.getByRole("button", { name: "Done", exact: true }).click();
  await expect(inspect).toBeVisible();

  const add = page.getByRole("button", { name: "Add one E2E Warrior 1" });
  await expectTapTargetVisible(add);
  await add.click();
  await page.getByRole("tab", { name: "Deck", exact: true }).click();
  await expect(page.getByLabel("1 copies")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Undo", exact: true }),
  ).toHaveCount(0);
  const remove = page.getByRole("button", { name: "Remove one E2E Warrior 1" });
  await expectTapTargetVisible(remove);
  await remove.click();
  await expect(
    page.getByText("No cards in deck", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Undo", exact: true }),
  ).toHaveCount(0);
  await expectNoDocumentHorizontalOverflow(page);
});

test("a phone player can join a lobby and sees the portrait rotate gate only in portrait", async ({
  browser,
}) => {
  const hostContext = await browser.newContext();
  const guestContext = await browser.newContext();
  try {
    const host = await newSignedInPage(hostContext, "e2e-player-one");
    const guest = await newSignedInPage(guestContext, "e2e-player-two");
    const roomName = `e2e-mobile-${Date.now()}`;

    // Create at landscape so the helper can assert the playable board before
    // this test verifies the portrait-only gate.
    await setMobileViewport(host, "landscape");
    await createRoomFromLobby(host, roomName, false);
    await setMobileViewport(host, "narrow");
    await expect(host.getByLabel("Landscape required to play")).toBeVisible();

    await setMobileViewport(guest, "standard");
    await guest.goto("/");
    const roomCard = guest.getByRole("article").filter({ hasText: roomName });
    await expect(roomCard).toBeVisible({ timeout: 30_000 });
    await expectTapTargetVisible(
      roomCard.getByRole("button", { name: "Join", exact: true }),
    );
    await roomCard.getByRole("button", { name: "Join", exact: true }).click();
    await guest.getByLabel("Deck", { exact: true }).click();
    await guest
      .getByRole("option", { name: "E2E Player 2 Deck", exact: true })
      .click();
    await guest.getByRole("button", { name: "Join Room", exact: true }).click();
    await expect(guest).toHaveURL(/\/play\?/);
    await expect(guest.getByLabel("Landscape required to play")).toBeVisible();
    await expectNoDocumentHorizontalOverflow(guest);

    await setMobileViewport(guest, "landscapeWide");
    await expect(guest.getByLabel("Landscape required to play")).toHaveCount(0);
    await expect(guest.getByTestId("game-board").last()).toBeVisible();
  } finally {
    await hostContext.close();
    await guestContext.close();
  }
});
