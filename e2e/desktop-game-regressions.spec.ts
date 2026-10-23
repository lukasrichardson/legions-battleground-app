import { expect, test } from "@playwright/test";
import { createRoomFromLobby, signInAs } from "./fixtures";

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
