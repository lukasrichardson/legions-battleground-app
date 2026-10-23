import { test, expect } from "@playwright/test";
import {
  createRoomFromLobby,
  joinRoomFromLobby,
  newSignedInPage,
  signInAs,
} from "./fixtures";
import {
  expectNoDocumentHorizontalOverflow,
  setMobileViewport,
} from "./mobile";

test("published deck browsing and inspection work at a narrow phone width", async ({
  page,
}) => {
  await setMobileViewport(page, "narrow");
  await page.goto("/browse");
  const publicDeck = page.getByRole("button", {
    name: "Open published deck E2E Public Deck",
  });
  await expect(publicDeck).toBeVisible();
  await expectNoDocumentHorizontalOverflow(page);
  await publicDeck.click();
  await page.waitForURL(/\/browse\/[a-f\d]{24}$/);
  await expect(
    page.getByRole("heading", { name: "E2E Public Deck" }),
  ).toBeVisible();
  await expect(page.getByLabel("2 copies")).toBeVisible();
  const card = page
    .getByRole("button", { name: /Inspect E2E Warrior 1/i })
    .first();
  await expect(card).toBeVisible();
  await expect(card.locator("img")).toBeVisible();
  const mainDeck = page.getByLabel("Main deck");
  await mainDeck.locator("summary").click();
  await expect(card).not.toBeVisible();
  await mainDeck.locator("summary").click();
  await expect(card).toBeVisible();
  await card.click();
  await expect(
    page.getByRole("dialog", { name: "Published deck card details" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Close card details" }).click();
  await expectNoDocumentHorizontalOverflow(page);
  await setMobileViewport(page, "wide");
  await expect(page.getByRole("heading", { name: "E2E Public Deck" })).toBeVisible();
  await expect(card).toBeVisible();
  await expectNoDocumentHorizontalOverflow(page);
});

test("a signed-in player can manage decks and copy a public deck", async ({
  page,
}) => {
  await signInAs(page, "e2e-player-one");

  await page.goto("/decks");
  await page
    .getByRole("button", { name: /create deck/i })
    .first()
    .click();
  await page.getByLabel("Deck Name").fill("E2E Created Deck");
  await page.getByRole("combobox").click();
  await page.getByRole("option", { name: "E2E Legion", exact: true }).click();
  const createResponse = page.waitForResponse(
    (response) =>
      response.url().includes("/api/decks") &&
      response.request().method() === "POST",
  );
  await page.getByRole("button", { name: "Create Deck", exact: true }).click();
  await expect((await createResponse).status()).toBe(201);
  await expect(page).toHaveURL(/\/decks\/[a-f\d]{24}$/, { timeout: 30_000 });
  await page.getByRole("button", { name: "Rename", exact: true }).click();
  await page.getByPlaceholder("Deck name").fill("E2E Renamed Deck");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByRole("combobox")).toContainText("E2E Renamed Deck");

  await page.goto("/browse");
  await page.getByText("E2E Public Deck", { exact: true }).click();
  await page
    .getByRole("button", { name: "Copy to My Decks", exact: true })
    .click();
  await expect(page).toHaveURL(/\/decks\/[a-f\d]{24}$/);
});

for (const mobile of [false, true])
  test(`two players can create, join, synchronize a match action, and reconnect (${mobile ? "touch landscape" : "desktop"})`, async ({
    browser,
  }) => {
    const playerOneContext = await browser.newContext(
      mobile ? { hasTouch: true, viewport: { width: 568, height: 320 } } : {},
    );
    const playerTwoContext = await browser.newContext(
      mobile ? { hasTouch: true, viewport: { width: 667, height: 375 } } : {},
    );
    try {
      const playerOne = await newSignedInPage(
        playerOneContext,
        "e2e-player-one",
      );
      const playerTwo = await newSignedInPage(
        playerTwoContext,
        "e2e-player-two",
      );
      const roomName = `e2e-regular-${Date.now()}`;

      await createRoomFromLobby(playerOne, roomName, false);
      await joinRoomFromLobby(playerTwo, roomName, "E2E Player 2 Deck");

      await expect(
        playerOne.getByRole("heading", { name: "Ready Up" }),
      ).toBeVisible();
      await expect(
        playerTwo.getByRole("heading", { name: "Ready Up" }),
      ).toBeVisible();
      await playerOne
        .getByRole("button", { name: "Ready", exact: true })
        .click();
      await expect(
        playerTwo.getByText("Opponent", { exact: true }).locator(".."),
      ).toContainText("Ready");
      await playerTwo
        .getByRole("button", { name: "Ready", exact: true })
        .click();
      await expect(
        playerOne.getByRole("heading", { name: "Rock Paper Scissors" }),
      ).toBeVisible();
      await expect(
        playerTwo.getByRole("heading", { name: "Rock Paper Scissors" }),
      ).toBeVisible();

      await playerOne
        .getByRole("button", { name: "Rock", exact: true })
        .click();
      await playerTwo
        .getByRole("button", { name: "Scissors", exact: true })
        .click();
      await expect(
        playerOne.getByRole("heading", { name: "Choose turn order" }),
      ).toBeVisible();
      await expect(
        playerTwo.getByRole("heading", { name: "Choose turn order" }),
      ).toBeVisible();
      await playerOne
        .getByRole("button", { name: "Go first", exact: true })
        .click();
      await expect(
        playerOne.getByRole("button", { name: "Keep hand", exact: true }),
      ).toBeVisible();
      await playerOne
        .getByRole("button", { name: "Keep hand", exact: true })
        .click();
      await expect(
        playerTwo.getByRole("button", { name: "Keep hand", exact: true }),
      ).toBeVisible();
      await playerTwo
        .getByRole("button", { name: "Keep hand", exact: true })
        .click();

      const playerTwoStatus = playerTwo.getByRole("region", {
        name: "Regular match status",
      });
      await expect(
        playerOne.getByRole("button", { name: "Advance phase", exact: true }),
      ).toBeVisible();
      const statusBeforeAdvance = await playerTwoStatus.innerText();
      const advance = playerOne.getByRole("button", {
        name: "Advance phase",
        exact: true,
      });
      if (mobile) {
        await expect
          .poll(async () => (await advance.boundingBox())?.height ?? 0)
          .toBeGreaterThanOrEqual(44);
        await advance.tap();
      } else await advance.click();
      await expect
        .poll(() => playerTwoStatus.innerText())
        .not.toBe(statusBeforeAdvance);
      const statusAfterAdvance = await playerTwoStatus.innerText();

      await playerTwo.reload();
      await expect
        .poll(() => playerTwoStatus.innerText())
        .toBe(statusAfterAdvance);
    } finally {
      await playerOneContext.close();
      await playerTwoContext.close();
    }
  });
