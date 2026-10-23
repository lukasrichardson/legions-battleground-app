import { expect, test } from "@playwright/test";
import { io, type Socket } from "socket.io-client";
import { signInAs } from "./fixtures";

test("ordinary accounts cannot write the global banlist", async ({ page }) => {
  await signInAs(page, "e2e-player-one");
  const before = await (await page.request.get("/api/banlist")).json();
  const response = await page.request.post("/api/banlist", {
    data: { name: { $ne: null }, status: "unrestricted" },
  });
  expect(response.status()).toBe(403);
  expect(await (await page.request.get("/api/banlist")).json()).toEqual(before);
});

test("deck imports reject Mongo operators before querying or saving cards", async ({ page }) => {
  await signInAs(page, "e2e-player-one");
  const response = await page.request.post("/api/importDecks", {
    data: { id: "security-invalid-import", name: "Invalid import", legion: "E2E Legion", cards_in_deck: [{ code: { $ne: null } }] },
  });
  expect(response.status()).toBe(400);
  expect(await response.text()).toContain("string code or name");
});

test("sandbox reset cannot load another account's private deck through Socket.IO", async ({ page, browser, baseURL }) => {
  await signInAs(page, "e2e-player-one");
  const ownerDecks = await (await page.request.get("/api/decks?view=summary")).json();
  const ownerDeck = ownerDecks.find((deck: { name: string }) => deck.name === "E2E Player 1 Deck");
  const otherContext = await browser.newContext();
  let socket: Socket | undefined;
  try {
    const otherPage = await otherContext.newPage();
    await signInAs(otherPage, "e2e-player-two");
    const otherDecks = await (await otherPage.request.get("/api/decks?view=summary")).json();
    const privateDeck = otherDecks.find((deck: { name: string }) => deck.name === "E2E Player 2 Deck");
    const creation = await page.request.post("/createRoom", {
      data: { roomName: `security-reset-${Date.now()}`, deckId: ownerDeck._id, sandboxMode: true },
    });
    expect(creation.status()).toBe(201);
    const { admissionToken } = await creation.json();
    socket = io(baseURL!, { auth: { admissionToken }, transports: ["websocket"], autoConnect: false });
    await new Promise<void>((resolve, reject) => {
      socket!.once("connect", resolve);
      socket!.once("connect_error", reject);
      socket!.connect();
    });
    const started = new Promise<{ data: { p1DeckFromServer: { _id: string } } }>((resolve) => socket!.once("gameEvent", resolve));
    socket.emit("joinGame");
    expect((await started).data.p1DeckFromServer._id).toBe(ownerDeck._id);
    const rejected = new Promise<{ message: string }>((resolve) => socket!.once("error", resolve));
    socket.emit("gameEvent", { type: "resetGame", data: { p1DeckId: privateDeck._id, userId: "e2e-player-two" } });
    expect((await rejected).message).toContain("permission");
  } finally {
    socket?.disconnect();
    await otherContext.close();
  }
});
