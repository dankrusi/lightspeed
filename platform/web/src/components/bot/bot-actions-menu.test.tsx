// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { BotActionsMenu } from "./bot-actions-menu";

let root: Root;
let container: HTMLDivElement;
beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});
afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
});

/** Opens the menu and reads its text, one entry per group between separators. */
async function groups(props: Partial<Parameters<typeof BotActionsMenu>[0]>): Promise<string[]> {
  await act(async () => root.render(<BotActionsMenu botId="helper" onSettings={() => undefined} {...props} />));
  const trigger = container.querySelector<HTMLButtonElement>('button[aria-label="Bot actions"]')!;
  if (trigger.getAttribute("aria-expanded") !== "true") await act(async () => trigger.click());
  const menu = container.querySelector('[role="menu"]')!;
  const parts: string[] = [""];
  for (const child of menu.children) {
    if (child.getAttribute("role") === "separator") parts.push("");
    else parts[parts.length - 1] += ` ${child.textContent ?? ""}`;
  }
  return parts.map((part) => part.trim());
}

it("offers settings and pausing, then the bot's id", async () => {
  const onToggle = vi.fn();
  const [actions, identity, ...rest] = await groups({ pause: { enabled: true, pending: false, onToggle } });
  expect(actions).toMatch(/^Bot settings\s*Pause bot$/);
  expect(identity).toMatch(/^Bot ID\s*helper/);
  expect(container.querySelector('[aria-label="Copy bot id"]')).not.toBeNull();
  expect(rest).toEqual([]);
  const pause = [...container.querySelectorAll('[role="menuitem"]')].find((item) => item.textContent === "Pause bot") as HTMLElement;
  await act(async () => pause.click());
  expect(onToggle).toHaveBeenCalledOnce();
});

it("offers resuming a paused bot, and only settings to someone who cannot manage it", async () => {
  const [paused] = await groups({ pause: { enabled: false, pending: false, onToggle: () => undefined } });
  expect(paused).toContain("Resume bot");
  const [actions] = await groups({});
  expect(actions).toBe("Bot settings");
});
