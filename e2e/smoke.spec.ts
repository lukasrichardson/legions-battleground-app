import { test, expect } from "@playwright/test";
import { createRoomFromLobby, joinRoomFromLobby, newSignedInPage, signInAs } from "./fixtures";

test("a signed-in player can manage decks and copy a public deck", async ({ page }) => {
  await signInAs(page, "e2e-player-one");

  await page.goto("/decks");
  await page.getByRole("button", { name: /create deck/i }).first().click();
  await page.getByLabel("Deck Name").fill("E2E Created Deck");
  await page.getByRole("combobox").click();
  await page.getByRole("option", { name: "E2E Legion", exact: true }).click();
  const createResponse = page.waitForResponse((response) => response.url().includes("/api/decks") && response.request().method() === "POST");
  await page.getByRole("button", { name: "Create Deck", exact: true }).click();
  await expect((await createResponse).status()).toBe(201);
  await expect(page).toHaveURL(/\/decks\/[a-f\d]{24}$/, { timeout: 30_000 });
  await page.getByRole("button", { name: "Rename", exact: true }).click();
  await page.getByPlaceholder("Deck name").fill("E2E Renamed Deck");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByRole("combobox")).toContainText("E2E Renamed Deck");

  await page.goto("/browse");
  await page.getByText("E2E Public Deck", { exact: true }).click();
  await page.getByRole("button", { name: "Copy to My Decks", exact: true }).click();
  await expect(page).toHaveURL(/\/decks\/[a-f\d]{24}$/);
});

test("two players can create, join, synchronize a match action, and reconnect", async ({ browser }) => {
  const playerOneContext = await browser.newContext();
  const playerTwoContext = await browser.newContext();
  try {
    const playerOne = await newSignedInPage(playerOneContext, "e2e-player-one");
    const playerTwo = await newSignedInPage(playerTwoContext, "e2e-player-two");
    const roomName = `e2e-regular-${Date.now()}`;

    await createRoomFromLobby(playerOne, roomName, false);
    await joinRoomFromLobby(playerTwo, roomName, "E2E Player 2 Deck");

    await expect(playerOne.getByRole("heading", { name: "Ready Up" })).toBeVisible();
    await expect(playerTwo.getByRole("heading", { name: "Ready Up" })).toBeVisible();
    await playerOne.getByRole("button", { name: "Ready", exact: true }).click();
    await expect(playerTwo.getByText("Opponent", { exact: true }).locator("..")).toContainText("Ready");
    await playerTwo.getByRole("button", { name: "Ready", exact: true }).click();
    await expect(playerOne.getByRole("heading", { name: "Rock Paper Scissors" })).toBeVisible();
    await expect(playerTwo.getByRole("heading", { name: "Rock Paper Scissors" })).toBeVisible();

    await playerOne.getByRole("button", { name: "Rock", exact: true }).click();
    await playerTwo.getByRole("button", { name: "Scissors", exact: true }).click();
    await expect(playerOne.getByRole("heading", { name: "Choose turn order" })).toBeVisible();
    await expect(playerTwo.getByRole("heading", { name: "Choose turn order" })).toBeVisible();
    await playerOne.getByRole("button", { name: "Go first", exact: true }).click();
    await expect(playerOne.getByRole("button", { name: "Keep hand", exact: true })).toBeVisible();
    await playerOne.getByRole("button", { name: "Keep hand", exact: true }).click();
    await expect(playerTwo.getByRole("button", { name: "Keep hand", exact: true })).toBeVisible();
    await playerTwo.getByRole("button", { name: "Keep hand", exact: true }).click();

    const playerTwoStatus = playerTwo.getByRole("region", { name: "Regular match status" });
    await expect(playerOne.getByRole("button", { name: "Advance phase", exact: true })).toBeVisible();
    const statusBeforeAdvance = await playerTwoStatus.innerText();
    await playerOne.getByRole("button", { name: "Advance phase", exact: true }).click();
    await expect.poll(() => playerTwoStatus.innerText()).not.toBe(statusBeforeAdvance);
    const statusAfterAdvance = await playerTwoStatus.innerText();

    await playerTwo.reload();
    await expect.poll(() => playerTwoStatus.innerText()).toBe(statusAfterAdvance);
  } finally {
    await playerOneContext.close();
    await playerTwoContext.close();
  }
});

test("a signed-in player can enter sandbox mode", async ({ page }) => {
  await signInAs(page, "e2e-player-one");
  await createRoomFromLobby(page, `e2e-sandbox-${Date.now()}`, true);
  await expect(page.getByTestId("game-board").last()).toHaveAttribute("data-game-mode", "sandbox");
  await expect(page.getByRole("heading", { name: "Ready Up" })).toHaveCount(0);
});
