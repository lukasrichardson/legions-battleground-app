import { expect, test, type Locator, type Page } from "@playwright/test";
import { MongoClient, ObjectId } from "mongodb";
import { resolveE2eEnvironment } from "./environment.mjs";
import { signInAs } from "./fixtures";
import { expectNoDocumentHorizontalOverflow } from "./mobile";

async function expectUnclipped(target: Locator) {
  await target.scrollIntoViewIfNeeded();
  await expect(target).toBeInViewport({ ratio: 0.99 });
  await target.click({ trial: true });
}

async function scrollPanel(page: Page, target: Locator, amount: number) {
  const bounds = await target.boundingBox();
  expect(bounds).not.toBeNull();
  await page.mouse.move(bounds!.x + bounds!.width / 2, Math.min(bounds!.y + 100, bounds!.y + bounds!.height / 2));
  await page.mouse.wheel(0, amount);
}

test("populated personal decks stay scrollable to the last card on phones and tablets", async ({ page }) => {
  const env = resolveE2eEnvironment(process.env);
  const client = new MongoClient(env.MONGO_URL);
  const ids = Array.from({ length: 17 }, () => new ObjectId());
  await client.connect();
  try {
    const collection = client.db(env.MONGO_DB_NAME).collection("decks");
    const original = await collection.findOne({ userId: "e2e-player-one", name: "E2E Player 1 Deck" });
    expect(original).not.toBeNull();
    const expectedCount = await collection.countDocuments({ userId: "e2e-player-one" }) + ids.length;
    await collection.insertMany(ids.map((_id, index) => ({ ...original, _id, name: `Scroll fixture ${index}` })));
    await signInAs(page, "e2e-player-one");
    for (const size of [{ width: 320, height: 568 }, { width: 390, height: 844 }, { width: 768, height: 1024 }, { width: 844, height: 390 }]) {
      await page.setViewportSize(size);
      await page.goto("/decks");
      const cards = page.getByRole("button", { name: /^Edit deck / });
      await expect(cards).toHaveCount(expectedCount);
      const main = page.locator(".arena-shell > div > main");
      // A real user scroll, rather than scrollIntoView (which can move hidden
      // overflow containers), must expose the final card and its delete action.
      await scrollPanel(page, main, 10000);
      await expect(cards.last()).toBeInViewport({ ratio: 0.99 });
      await cards.last().click({ trial: true });
      await expectUnclipped(page.getByRole("button", { name: /^Delete / }).last());
      await expectNoDocumentHorizontalOverflow(page);
    }
  } finally {
    await client.db(env.MONGO_DB_NAME).collection("decks").deleteMany({ _id: { $in: ids } });
    await client.close();
  }
});

test("mobile navbar hides on down-scroll, restores on up-scroll and focus, and stays visible on desktop", async ({ page }) => {
  await signInAs(page, "e2e-player-one");
  for (const size of [{ width: 390, height: 568 }, { width: 844, height: 390 }]) {
    await page.setViewportSize(size);
    await page.goto("/cards");
    await expect(page.getByRole("button", { name: "Inspect E2E Warrior 8", exact: true })).toBeVisible();
    const shell = page.locator(".arena-shell");
    const nav = page.locator(".arena-navigation");
    const scrollable = await page.getByRole("button", { name: "Inspect E2E Warrior 8", exact: true }).evaluate((el) => {
      let parent = el.parentElement;
      while (parent) {
        if (/(auto|scroll)/.test(getComputedStyle(parent).overflowY) && parent.scrollHeight > parent.clientHeight + 64) {
          parent.setAttribute("data-e2e-scroll-panel", "");
          return true;
        }
        parent = parent.parentElement;
      }
      return false;
    });
    expect(scrollable).toBe(true);
    const panel = page.locator("[data-e2e-scroll-panel]");
    await scrollPanel(page, panel, 300);
    await expect(shell).toHaveAttribute("data-navigation-hidden", "true");
    await expect(page.locator(".arena-navigation-slot")).toHaveCSS("height", "0px");
    await expect.poll(() => nav.evaluate((el) => el.getBoundingClientRect().bottom)).toBeLessThanOrEqual(1);
    await scrollPanel(page, panel, -100);
    await expect(shell).toHaveAttribute("data-navigation-hidden", "false");
    await expect(nav).toBeInViewport({ ratio: 1 });
    await scrollPanel(page, panel, 300);
    await expect(shell).toHaveAttribute("data-navigation-hidden", "true");
    await page.getByRole("link", { name: "Legions Battleground home", exact: true }).focus();
    await expect(shell).toHaveAttribute("data-navigation-hidden", "false");
    await expect(nav).toBeInViewport({ ratio: 1 });
    await page.setViewportSize({ width: 1440, height: 900 });
    await expect(nav).toBeInViewport({ ratio: 1 });
    await scrollPanel(page, panel, 300);
    await expect(nav).toBeInViewport({ ratio: 1 });
  }
});

test("mobile route content and builder sections remain reachable at their bottom edges", async ({ page }) => {
  await signInAs(page, "e2e-player-one");
  const decks = await (await page.request.get("/api/decks?view=summary")).json();
  const published = await (await page.request.get("/api/published_decks?limit=1")).json();
  const deckId = decks.find((deck: { name: string }) => deck.name === "E2E Player 1 Deck")._id;
  const publicId = published[0]._id;
  for (const size of [{ width: 320, height: 568 }, { width: 390, height: 844 }, { width: 844, height: 390 }]) {
    await page.setViewportSize(size);
    for (const route of ["/", "/browse", "/cards", `/browse/${publicId}`, `/decks/${deckId}`]) {
      await page.goto(route, { waitUntil: "domcontentloaded" });
      if (route === "/") await expectUnclipped(page.getByRole("button", { name: "Open published deck E2E Public Deck", exact: true }));
      else if (route === "/browse") await expectUnclipped(page.getByRole("button", { name: "Open published deck E2E Public Deck", exact: true }));
      else if (route === "/cards") await expectUnclipped(page.getByRole("button", { name: "Inspect E2E Warrior 8", exact: true }));
      else if (route.startsWith("/decks/")) {
        await page.getByRole("tab", { name: "Find cards", exact: true }).click();
        await expectUnclipped(page.getByRole("button", { name: "Add one E2E Warrior 8", exact: true }));
        await page.getByRole("tab", { name: "Details", exact: true }).click();
        await expectUnclipped(page.getByRole("tab", { name: "Deck", exact: true }));
      } else await expectUnclipped(page.getByRole("button", { name: "Copy to My Decks", exact: true }));
      await expectNoDocumentHorizontalOverflow(page);
    }
  }
});
