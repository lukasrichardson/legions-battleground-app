import { expect, test, type Page } from "@playwright/test";
import { MongoClient, ObjectId } from "mongodb";
import { csrfHeaders, signInAs } from "./fixtures";

async function setupDeck(page: Page) {
  await signInAs(page, "e2e-player-one");
  const summaries = await (await page.request.get("/api/decks?view=summary")).json();
  const fixtureId = summaries.find((deck: { name: string }) => deck.name === "E2E Player 1 Deck")._id;
  const fixture = await (await page.request.get(`/api/decks/${fixtureId}`)).json();
  const response = await page.request.post("/api/decks", {
    headers: await csrfHeaders(page),
    data: { name: `Grouped regression ${Date.now()}`, legion: "E2E Legion" },
  });
  expect(response.status()).toBe(201);
  return { id: (await response.json()).deck._id as string, cards: fixture.cards as { _id: string; title: string }[] };
}

async function patch(page: Page, id: string, operations: object[]) {
  const response = await page.request.patch(`/api/decks/${id}`, {
    headers: { ...await csrfHeaders(page), "content-type": "application/json-patch+json" },
    data: operations,
  });
  expect(response.ok(), await response.text()).toBe(true);
}

async function savedDeck(page: Page, id: string) {
  return (await page.request.get(`/api/decks/${id}`)).json();
}

test("grouped quantity actions save exactly one change and keep card moves safe", async ({ page }) => {
  test.setTimeout(180_000);
  const { id, cards } = await setupDeck(page);
  const card = cards.find((item) => item.title === "E2E Warrior 1")!;
  await patch(page, id, [{ op: "replace", path: "/cards_in_deck", value: [card._id, card._id] }]);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`/decks/${id}`);
  await page.getByRole("checkbox", { name: "Grouped View" }).check();
  const main = page.locator(`[data-deck-card-id="${card._id}"][data-deck-card-list="cards_in_deck"]`);
  await expect(main.getByLabel("2 copies")).toBeAttached();
  await main.getByRole("button", { name: "Add one E2E Warrior 1 to main deck" }).click();
  await expect.poll(async () => (await savedDeck(page, id)).cards_in_deck.length).toBe(3);
  const remove = main.getByRole("button", { name: "Remove one E2E Warrior 1 from main deck" });
  await remove.focus();
  await remove.press("Enter");
  await expect.poll(async () => (await savedDeck(page, id)).cards_in_deck.length).toBe(2);
  await main.getByLabel("2 copies").click();
  await expect.poll(async () => (await savedDeck(page, id)).cards_in_deck.length).toBe(2);
  await remove.click();
  await expect.poll(async () => (await savedDeck(page, id)).cards_in_deck.length).toBe(1);
  await page.reload();
  await expect(main.getByLabel("1 copies")).toBeAttached();

  const side = page.getByRole("heading", { name: /Side Deck.*Deck-building only/ });
  await main.locator(".cursor-grab").dragTo(side);
  await expect.poll(async () => (await savedDeck(page, id)).side_deck.length).toBe(1);
  const sideCard = page.locator(`[data-deck-card-id="${card._id}"][data-deck-card-list="side_deck"]`);
  await sideCard.getByRole("button", { name: "Add one E2E Warrior 1 to side deck" }).click();
  await expect.poll(async () => (await savedDeck(page, id)).side_deck.length).toBe(2);
  await sideCard.getByRole("button", { name: "Remove one E2E Warrior 1 from side deck" }).click();
  await expect.poll(async () => (await savedDeck(page, id)).side_deck.length).toBe(1);
  await page.reload();
  await expect(sideCard.getByLabel("1 copies")).toBeAttached();
});

test("a full side deck does not lose a card when add is rejected", async ({ page }) => {
  const { id, cards } = await setupDeck(page);
  const ids = cards.filter((card) => card.title.startsWith("E2E Warrior")).slice(0, 5).flatMap((card) => [card._id, card._id, card._id]);
  await patch(page, id, [{ op: "replace", path: "/side_deck", value: ids }]);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`/decks/${id}`);
  await page.getByRole("checkbox", { name: "Grouped View" }).check();
  const sideCard = page.locator(`[data-deck-card-id="${ids[0]}"][data-deck-card-list="side_deck"]`);
  await sideCard.getByRole("button", { name: /^Add one .* to side deck$/ }).click();
  await expect(page.getByText(/side deck can contain at most 15 cards/i)).toBeVisible();
  expect((await savedDeck(page, id)).side_deck).toEqual(ids);
  await page.reload();
  expect((await savedDeck(page, id)).side_deck).toEqual(ids);
});

test("same-title printings remain separately identifiable and special-only decks are not empty", async ({ page }) => {
  const { id, cards } = await setupDeck(page);
  const original = cards.find((card) => card.title === "E2E Warrior 1")!;
  const mongo = new MongoClient(process.env.MONGO_URL!);
  await mongo.connect();
  const collection = mongo.db(process.env.MONGO_DB_NAME).collection("cards");
  const source = await collection.findOne({ _id: new ObjectId(original._id) });
  const variantId = new ObjectId();
  await collection.insertOne({ ...source!, _id: variantId, card_code: "E2E-VARIANT" });
  try {
  await patch(page, id, [{ op: "replace", path: "/cards_in_deck", value: [original._id, variantId.toString()] }]);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`/decks/${id}`);
  await page.getByRole("checkbox", { name: "Grouped View" }).check();
  const first = page.locator(`[data-deck-card-id="${original._id}"]`);
  const variant = page.locator(`[data-deck-card-id="${variantId}"]`);
  await expect(first.getByLabel("1 copies")).toBeAttached();
  await expect(variant.getByLabel("1 copies")).toBeAttached();
  await expect(variant.getByText("E2E-VARIANT", { exact: true })).toBeVisible();
  await variant.getByRole("button", { name: "Remove one E2E Warrior 1 from main deck" }).click();
  await expect.poll(async () => (await savedDeck(page, id)).cards_in_deck).toEqual([original._id]);
  await page.reload();
  expect((await savedDeck(page, id)).cards_in_deck).toEqual([original._id]);
  await page.getByRole("button", { name: "Add one E2E Xenora", exact: true }).click();
  await expect.poll(async () => (await savedDeck(page, id)).warlords.length).toBe(1);
  await first.getByRole("button", { name: "Remove one E2E Warrior 1 from main deck" }).click();
  await expect.poll(async () => (await savedDeck(page, id)).cards_in_deck.length).toBe(0);
  await expect(page.getByText("No cards in deck", { exact: true })).toHaveCount(0);
  } finally {
    await collection.deleteOne({ _id: variantId });
    await mongo.close();
  }
});
