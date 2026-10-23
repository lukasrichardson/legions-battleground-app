import { test, expect } from "@playwright/test";
import { csrfHeaders, signInAs } from "./fixtures";

test("populated home panels stay separate and reachable across responsive breakpoints", async ({ page, browser }) => {
  await signInAs(page, "e2e-player-one");
  const decksResponse = await page.request.get("/api/decks?view=summary");
  expect(decksResponse.ok()).toBe(true);
  const [deck] = await decksResponse.json();
  const prefix = `Layout ${Date.now()}`;

  // Use real authenticated API data and Socket.IO room discovery, not DOM fixtures.
  for (let index = 0; index < 3; index += 1) {
    const response = await page.request.post("/api/decks", { headers: await csrfHeaders(page),
      data: { name: `${prefix} recent deck ${index}`, legion: "E2E Legion" },
    });
    expect(response.status()).toBe(201);
  }
  for (let index = 0; index < 8; index += 1) {
    const response = await page.request.post("/createRoom", { headers: await csrfHeaders(page),
      data: {
        roomName: `${prefix} room ${index} with a deliberately long name`,
        deckId: deck._id,
        sandboxMode: index % 2 === 0,
        roomPassword: index % 2 === 0 ? "" : "layout-test",
      },
    });
    expect(response.status()).toBe(201);
  }

  const guestContext = await browser.newContext();
  try {
    const guest = await guestContext.newPage();
    for (const current of [page, guest]) {
      const signedIn = current === page;
      await current.goto("/?ui=arena");
      await expect(current.getByRole("article").filter({ hasText: `${prefix} room` })).toHaveCount(8);
      await expect(current.getByRole("button", { name: "Open published deck E2E Public Deck" })).toBeAttached();
      if (signedIn) {
        await expect(current.getByRole("button", { name: new RegExp(`Edit deck ${prefix} recent deck`) })).toHaveCount(3);
      } else {
        await expect(current.getByText("Your Recent Decks", { exact: true })).toHaveCount(0);
      }

      for (const height of [850, 375]) {
        for (const width of [390, 639, 640, 700, 767, 768, 1024]) {
          await test.step(`${signedIn ? "signed in" : "guest"}: ${width}x${height}`, async () => {
            await current.setViewportSize({ width, height });
            const activeGames = current.getByText("Active Games", { exact: true });
            await expect.poll(() => activeGames.evaluate((element) => {
              const lobby = element.closest("section")!;
              const panels = lobby.parentElement!;
              const home = panels.parentElement!;
              const published = panels.lastElementChild!;
              const lobbyBounds = lobby.firstElementChild!.getBoundingClientRect();
              const publishedBounds = published.getBoundingClientRect();
              const stacked = getComputedStyle(panels).flexDirection === "column";
              const shortLandscape = matchMedia("(orientation: landscape) and (max-height: 600px) and (max-width: 1100px)").matches;
              // Short landscape pages now deliberately grow inside the shell's
              // main scrollport instead of keeping a tiny nested home scroller.
              const scrollOwner = shortLandscape ? home.closest("main")! : home;
              return {
                stacked,
                overlapping: stacked && lobbyBounds.bottom > publishedBounds.top + 1,
                homeWithinShell: (shortLandscape ? scrollOwner : home).getBoundingClientRect().bottom <= innerHeight + 1,
                horizontalOverflow: document.documentElement.scrollWidth > innerWidth + 1,
                canScroll: getComputedStyle(scrollOwner).overflowY === "auto",
              };
            })).toEqual({
              stacked: width < 768,
              overlapping: false,
              homeWithinShell: true,
              horizontalOverflow: false,
              canScroll: width < 768 || (width > height && height <= 600 && width <= 1100),
            });

            // Scroll into view, then hit-test: visible DOM alone misses clipped
            // or overlapping controls beneath overflow-hidden ancestors.
            const lastRoom = current.getByRole("article").filter({ hasText: `${prefix} room 7` }).getByRole("button", { name: "Join", exact: true });
            const targets = [lastRoom, current.getByRole("button", { name: "Open published deck E2E Public Deck" })];
            if (signedIn) targets.push(current.getByRole("button", { name: new RegExp(`Edit deck ${prefix} recent deck`) }).last());
            for (const target of targets) {
              await target.scrollIntoViewIfNeeded();
              await expect.poll(() => target.evaluate((element) => {
                const bounds = element.getBoundingClientRect();
                const hit = document.elementFromPoint(bounds.left + bounds.width / 2, bounds.top + bounds.height / 2);
                return hit !== null && element.contains(hit);
              })).toBe(true);
            }
          });
        }
      }
    }
  } finally {
    await guestContext.close();
  }
});
