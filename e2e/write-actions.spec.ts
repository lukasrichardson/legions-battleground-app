import { expect, test, type Page } from "@playwright/test";
import { MongoClient, ObjectId } from "mongodb";
import { csrfHeaders, signInAs } from "./fixtures";
import { resolveE2eEnvironment } from "./environment.mjs";

async function openUsernameEditor(page: Page) {
  await page.getByRole("button", { name: "Open account menu", exact: true }).click();
  await page.getByRole("menuitem", { name: "Edit username", exact: true }).click();
  const editor = page.getByRole("dialog", { name: "Set Battleground username", exact: true });
  await expect(editor.getByRole("textbox", { name: "Username", exact: true })).toBeEnabled();
  return editor;
}

test("username save, removal and sign-out work through their real buttons", async ({ page }) => {
  await signInAs(page, "e2e-player-one");
  const alias = `CSRF_${Date.now()}`;
  let editor = await openUsernameEditor(page);
  await editor.getByRole("textbox", { name: "Username", exact: true }).fill(alias);
  const save = page.waitForResponse((response) => new URL(response.url()).pathname === "/api/me/alias" && response.request().method() === "PUT");
  await editor.getByRole("button", { name: /^(Set|Update) username$/ }).click();
  expect((await save).status()).toBe(200);
  await expect(editor).toHaveCount(0);
  await page.reload();
  editor = await openUsernameEditor(page);
  await expect(editor.getByRole("textbox", { name: "Username", exact: true })).toHaveValue(alias);
  await editor.getByRole("button", { name: "Remove username", exact: true }).click();
  await expect(editor.getByText("Remove this username and use your provider name instead?", { exact: true })).toBeVisible();
  const removal = page.waitForResponse((response) => new URL(response.url()).pathname === "/api/me/alias" && response.request().method() === "DELETE");
  await editor.getByRole("button", { name: "Remove username", exact: true }).click();
  expect((await removal).status()).toBe(204);
  expect((await removal).request().headers()["x-csrf-token"]).toBeTruthy();
  await expect(editor).toHaveCount(0);
  expect(await (await page.request.get("/api/me/alias")).json()).toEqual({ alias: null });
  await page.getByRole("button", { name: "Open account menu", exact: true }).click();
  await page.getByRole("menuitem", { name: "Sign out", exact: true }).click();
  await expect.poll(async () => (await (await page.request.get("/api/auth/session")).json()).user?.id).toBeUndefined();
});

test("Toolbox import, editor copy, publication and editor deletion send valid CSRF tokens", async ({ page }) => {
  await signInAs(page, "e2e-player-one");
  // Toolbox uses short numeric IDs; the editor supports these legacy URLs.
  const id = "934821";
  const name = `CSRF import ${Date.now()}`;
  let importedId: string | undefined;
  let publishedId: string | undefined;
  // Only the public Toolbox preview is stubbed. Writes use real Express routes
  // and the disposable test database, with existing seeded cards and no uploads.
  await page.route("https://api.legionstoolbox.com/**", (route) => route.fulfill({ json: [{ data: {
    name, legion: "E2E Legion",
    cards_in_deck: [{ id: "fixture-warrior", code: "E2E-1", qty: 1, type: "Warrior", image: "/logo.svg", thumb: "/logo.svg" }],
  } }] }));
  try {
    await page.goto("/decks");
    await page.getByRole("button", { name: /Import/i }).first().click();
    await page.getByLabel("Toolbox Deck ID", { exact: true }).fill(id);
    await page.getByRole("button", { name: "Generate Preview", exact: true }).click();
    const imported = page.waitForResponse((response) => new URL(response.url()).pathname === "/api/importDecks" && response.request().method() === "POST");
    await page.getByRole("button", { name: "Import Deck To Battleground", exact: true }).click();
    const importResponse = await imported;
    expect(importResponse.status()).toBe(200);
    importedId = (await importResponse.json())._id;
    await expect(page).toHaveURL(new RegExp(`/decks/${id}$`), { timeout: 30_000 });
    const copied = page.waitForResponse((response) => response.url().endsWith("/duplicate") && response.request().method() === "POST");
    await page.getByRole("button", { name: "Copy", exact: true }).click();
    const copyResponse = await copied;
    expect(copyResponse.status()).toBe(201);
    const { deck: copy } = await copyResponse.json();
    await expect(page).toHaveURL(new RegExp(`/decks/${copy._id}$`), { timeout: 30_000 });
    await expect(page.getByRole("combobox", { name: "Select deck", exact: true })).toContainText(copy.name);
    const published = page.waitForResponse((response) => new URL(response.url()).pathname === "/api/published_decks" && response.request().method() === "POST");
    await page.getByRole("button", { name: "Publish", exact: true }).click();
    const publishedResponse = await published;
    expect(publishedResponse.status()).toBe(201);
    publishedId = (await publishedResponse.json()).deck._id;
    await expect(page).toHaveURL(new RegExp(`/browse/${publishedId}$`), { timeout: 30_000 });
    await expect(page.getByRole("heading", { name: copy.name, exact: true })).toBeVisible();
    await page.goto(`/decks/${copy._id}`);
    const deleted = page.waitForResponse((response) => response.url().endsWith(`/api/decks/${copy._id}`) && response.request().method() === "DELETE");
    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: "Delete", exact: true }).click();
    expect((await deleted).status()).toBe(200);
    await expect(page).toHaveURL(/\/decks$/);
    expect((await page.request.get(`/api/decks/${copy._id}`)).status()).toBe(404);
  } finally {
    if (importedId) await page.request.delete(`/api/decks/${importedId}`, { headers: await csrfHeaders(page) });
    if (publishedId) {
      const env = resolveE2eEnvironment(process.env);
      const client = new MongoClient(env.MONGO_URL);
      try {
        await client.connect();
        await client.db(env.MONGO_DB_NAME).collection("published_decks").deleteOne({ _id: new ObjectId(publishedId), userId: "e2e-player-one" });
      } finally { await client.close(); }
    }
  }
});
