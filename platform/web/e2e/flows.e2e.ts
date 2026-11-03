import { expect, test, type Page } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import path from "node:path";

/// `before` is the current UI. `after` is the Whisperink migration.
/// A model reads the pairs; nothing in this file diffs pixels.
const phase = process.env.E2E_PHASE === "after" ? "after" : "before";
const shotDir = path.join("e2e", "shots", phase);

async function shot(page: Page, name: string) {
  await mkdir(shotDir, { recursive: true });
  await page.screenshot({ path: path.join(shotDir, `${name}.png`) });
}

async function hideDemoBanner(page: Page) {
  const hide = page.getByRole("status").getByRole("button", { name: "Hide" });
  if (await hide.isVisible().catch(() => false)) await hide.click();
}

/// The demo backend always reports a session, so the app opens as Ada.
/// The password form is covered by the Login page unit test.
async function enter(page: Page) {
  await page.goto("./");
  await page.waitForURL(/\/u\/[^/]+\//);
  await hideDemoBanner(page);
}

async function openNav(page: Page, name: string) {
  const link = page.getByRole("link", { name, exact: true });
  await expect(link).toBeVisible();
  await link.click();
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("lightspeed:theme", "light");
  });
});

test("opens the signed-in demo on the bot roster", async ({ page }) => {
  await enter(page);
  await expect(page.getByRole("heading", { name: "Bots", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: /Ada Demo/ })).toBeVisible();
  await shot(page, "01-home");
});

test.describe("signed-in demo", () => {
  test.beforeEach(async ({ page }) => {
    await enter(page);
  });

  test("universe home shows the bot roster", async ({ page }) => {
    await expect(page).toHaveURL(/\/bots$/);
    await expect(page.getByRole("heading", { name: "Bots", exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "Sessions", exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "Workspaces", exact: true })).toBeVisible();
    await shot(page, "02-bots");
    const bot = page.locator('a[href*="/bots/"]').first();
    await expect(bot).toBeVisible();
    await bot.click();
    await expect(page).toHaveURL(/\/bots\/[^/]+$/);
    await shot(page, "03-bot-detail");
  });

  test("session transcript accepts a message", async ({ page }) => {
    await openNav(page, "Sessions");
    await expect(page.getByRole("heading", { name: "Sessions", exact: true })).toBeVisible();
    await shot(page, "04-sessions");
    const session = page.locator('a[href*="/sessions/"]').first();
    await expect(session).toBeVisible();
    await session.click();
    await expect(page).toHaveURL(/\/sessions\/[^/]+$/);
    const composer = page.getByRole("textbox", { name: "Message" });
    await expect(composer).toBeVisible();
    await composer.fill("Say status of the pipeline.");
    await expect(composer).toHaveValue("Say status of the pipeline.");
    await shot(page, "05-session-composer");
    await composer.press("Enter");
    await expect(page.getByText("Say status of the pipeline.")).toBeVisible();
    await shot(page, "06-session-sent");
  });

  test("workspace file opens from the tree", async ({ page }) => {
    await openNav(page, "Workspaces");
    await expect(page.getByRole("heading", { name: "Workspaces", exact: true })).toBeVisible();
    await shot(page, "07-workspaces");
    const file = page.getByRole("treeitem").first();
    await expect(file).toBeVisible();
    await file.click();
    await shot(page, "08-workspace-file");
  });

  test("setup and access pages render", async ({ page }) => {
    const pages: Array<[string, string, string]> = [
      ["Profiles", "Profiles", "09-profiles"],
      ["Environments", "Environments", "10-environments"],
      ["MCP servers", "MCP servers", "11-mcp"],
      ["Models", "Models", "12-models"],
      ["Credentials", "Credentials", "13-credentials"],
      ["API keys", "API keys", "14-api-keys"],
      ["Members", "Members", "15-members"],
      ["General", "General", "16-settings-general"],
      ["Channels", "Channels", "17-channels"],
      ["Templates", "Templates", "18-templates"],
    ];
    for (const [nav, heading, file] of pages) {
      await openNav(page, nav);
      await expect(page.getByRole("heading", { name: heading, exact: true })).toBeVisible();
      await shot(page, file);
    }
  });

  test("creating an API key opens the secret dialog", async ({ page }) => {
    await openNav(page, "API keys");
    await page.getByRole("button", { name: "Create key" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByRole("heading", { name: "Create API key" })).toBeVisible();
    await dialog.getByLabel("Name").fill("Harness key");
    await shot(page, "19-api-key-dialog");
    await dialog.getByRole("button", { name: "Cancel" }).click();
    await expect(dialog).toBeHidden();
  });

  test("platform admin and account stay reachable", async ({ page }) => {
    await page.getByRole("button", { name: /Ada Demo/ }).click();
    await page.getByRole("menuitem", { name: "Platform admin" }).click();
    await expect(page.getByRole("heading", { name: "Users", exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "Audit log", exact: true })).toBeVisible();
    await shot(page, "20-admin-users");
    await openNav(page, "Audit log");
    await expect(page.getByRole("heading", { name: /Audit/ })).toBeVisible();
    await shot(page, "21-admin-audit");
    await page.goto("account");
    await hideDemoBanner(page);
    await expect(page.getByRole("heading", { name: "Account", exact: true })).toBeVisible();
    await shot(page, "22-account");
    await page.getByRole("button", { name: /Ada Demo/ }).click();
    await page.getByRole("menuitem", { name: "Sign out" }).click();
    await page.waitForLoadState("domcontentloaded");
    await shot(page, "23-signed-out");
    await expect(page.getByRole("button", { name: /Ada Demo/ }).or(page.getByLabel("Email"))).toBeVisible();
  });
});
