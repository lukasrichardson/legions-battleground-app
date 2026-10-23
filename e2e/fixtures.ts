import { expect, type BrowserContext, type Page } from "@playwright/test";

export type E2eUser = "e2e-player-one" | "e2e-player-two";

export async function signInAs(page: Page, userId: E2eUser) {
  await page.goto("/api/auth/signin/e2e?callbackUrl=/");
  await page.getByLabel("Test user").fill(userId);
  // A fresh development server may compile the home route during sign-in.
  // Keep that navigation budget separate from short control-action timeouts.
  await page.getByRole("button", { name: /sign in with e2e test user/i }).click({ timeout: 30_000 });
  // A trailing-slash regex also matches the sign-in URL's callbackUrl=/ query.
  await page.waitForURL((url) => url.pathname === "/", { timeout: 30_000 });
  await expect.poll(async () => {
    const response = await page.request.get("/api/auth/session");
    return (await response.json()).user?.id;
  }).toBe(userId);
}

export async function createRoomFromLobby(page: Page, roomName: string, sandboxMode: boolean, deckName?: string) {
  await page.goto("/");
  await page.getByRole("button", { name: "Play", exact: true }).click();
  await page.getByLabel("Room Name").fill(roomName);
  if (deckName) {
    await page.getByLabel("Deck", { exact: true }).click();
    await page.getByRole("option", { name: deckName, exact: true }).click();
  }
  if (!sandboxMode) await page.getByLabel("Sandbox Mode").uncheck();
  await page.getByRole("button", { name: "Create New Game", exact: true }).click();
  await expect(page).toHaveURL(/\/play\?/);
  await expect(page.getByTestId("game-board").last()).toBeVisible();
}

export async function joinRoomFromLobby(page: Page, roomName: string, deckName: string) {
  await page.goto("/");
  const roomRow = page.getByRole("article").filter({ has: page.getByText(roomName, { exact: true }) });
  await expect(roomRow).toBeVisible();
  await roomRow.getByRole("button", { name: "Join", exact: true }).click();
  await page.getByLabel("Deck", { exact: true }).click();
  await page.getByRole("option", { name: deckName, exact: true }).click();
  await page.getByRole("button", { name: "Join Room", exact: true }).click();
  await expect(page).toHaveURL(/\/play\?/);
  await expect(page.getByTestId("game-board").last()).toBeVisible();
}

export async function newSignedInPage(context: BrowserContext, userId: E2eUser) {
  const page = await context.newPage();
  await signInAs(page, userId);
  return page;
}
