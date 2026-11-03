// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { SessionActionsMenu } from "./session-actions-menu";

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

/** The menu, opened, as its groups, each the text of what it holds. */
async function groups(props: Partial<Parameters<typeof SessionActionsMenu>[0]>): Promise<string[]> {
  await act(async () => root.render(
    <MemoryRouter>
      <SessionActionsMenu variant="more" sessionId="session-1" metadata={{ team: "core" }} {...props} />
    </MemoryRouter>,
  ));
  const trigger = menuTrigger();
  if (trigger.getAttribute("aria-expanded") !== "true") await act(async () => trigger.click());
  const menu = container.querySelector('[role="menu"]')!;
  const parts = [""];
  for (const child of menu.children) {
    if (child.getAttribute("role") === "separator") parts.push("");
    else parts[parts.length - 1] += child.textContent ?? "";
  }
  return parts.map((part) => part.trim());
}

function menuTrigger(): HTMLButtonElement {
  return container.querySelector<HTMLButtonElement>('[aria-haspopup="menu"]')!;
}

it("keeps compaction directly above close in the action group", async () => {
  const [actions, preferences, identity, metadata, ...rest] = await groups({
    onSettings: () => undefined,
    onShare: () => undefined,
    onCompact: () => undefined,
    lifecycle: <span>Close session…</span>,
  });
  expect(actions).toMatch(/^Session settings\s*Share with universe…\s*Compact context\s*Close session…$/);
  expect(preferences).toMatch(/^Collapse completed runs\s*Show run statistics\s*Show session resources$/);
  expect(identity).toMatch(/^Session ID\s*session-1/);
  expect(metadata).toContain("team");
  expect(rest).toEqual([]);
});

it("starts with view preferences for someone who can do nothing", async () => {
  const [first, identity, metadata] = await groups({});
  expect(first).toMatch(/^Collapse completed runs/);
  expect(identity).toContain("session-1");
  expect(metadata).toContain("team");
});

it.each(["more", "tab"] as const)("offers compaction in the %s menu and prevents duplicate requests", async (variant) => {
  const compact = vi.fn();
  const menuGroups = await groups({
    variant,
    onCompact: compact,
    open: { label: "Open session", href: "/session-1", icon: null },
    lifecycle: <span>{variant === "tab" ? "Reset conversation…" : "Close session…"}</span>,
  });
  expect(menuGroups[0]).toMatch(variant === "tab"
    ? /^Open session\s*Reset conversation…\s*Compact context$/
    : /^Open session\s*Compact context\s*Close session…$/);
  expect(menuGroups).toHaveLength(4);
  expect(menuGroups[1]).toMatch(/^Collapse completed runs/);
  expect(menuGroups.at(-1)).toContain("team");
  const button = [...container.querySelectorAll("button")].find((item) => item.textContent === "Compact context")!;
  await act(async () => button.click());
  expect(compact).toHaveBeenCalledTimes(1);
  for (const compactionLabel of ["Requesting compaction…", "Context compaction queued…", "Compacting context…"]) {
    await groups({ variant, onCompact: compact, compactionLabel });
    const busy = [...container.querySelectorAll("button")].find((item) => item.textContent === compactionLabel)!;
    expect(busy.disabled).toBe(true);
    const trigger = menuTrigger();
    expect(trigger.querySelector(".animate-spin")).toBeNull();
    expect(trigger.querySelector(variant === "more" ? ".lucide-ellipsis" : ".lucide-chevron-down")).not.toBeNull();
    await act(async () => busy.click());
    expect(compact).toHaveBeenCalledTimes(1);
  }
});
