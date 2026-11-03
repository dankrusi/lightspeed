// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { SetupsPage } from "./SetupsPage";

const mocks = vi.hoisted(() => ({ api: vi.fn() }));
vi.mock("@/api", async (original) => ({ ...await original<typeof import("@/api")>(), api: mocks.api }));
vi.mock("@/lib/universes", () => ({
  useActiveUniverse: () => ({ universe: { id: "platform-universe" }, slug: "factory", isLoading: false }),
}));
vi.mock("@/lib/permissions", () => ({ useActionPermissions: () => ({ can: () => true }) }));
let root: Root;
let container: HTMLDivElement;
let client: QueryClient;
const setup = {
  id: "configurator", name: "Configurator", description: "", version: 5, available: true, status: "ready", installedVersion: 5,
  resources: { keyPrefix: "lsk_cfg", keyGroups: ["mcp", "profiles"], keySource: "minted", profileId: "lightspeed-configurator" },
};
const keys = [
  { keyPrefix: "lsk_cfg", displayName: "Configurator", groups: ["mcp", "profiles"], revokedAtMs: null },
  { keyPrefix: "lsk_mine", displayName: "Mine", groups: ["profiles"], revokedAtMs: null },
  { keyPrefix: "lsk_gone", displayName: "Gone", groups: ["profiles"], revokedAtMs: 5 },
];
beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  vi.stubGlobal("PointerEvent", MouseEvent);
  mocks.api.mockReset().mockImplementation(async (method: string, path: string) =>
    method === "POST" ? setup : path.endsWith("/api-keys") ? keys : [setup]);
  client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});
afterEach(async () => {
  await act(async () => root.unmount());
  client.clear();
  container.remove();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});
async function settle() {
  for (let step = 0; step < 4; step++) await act(async () => { await vi.advanceTimersByTimeAsync(5); });
}
async function openDialog() {
  await act(async () => root.render(<QueryClientProvider client={client}><SetupsPage admin /></QueryClientProvider>));
  await settle();
  expect(container.textContent).toContain("May call: MCP servers, Profiles");
  await act(async () => button("Repair")!.click());
  await settle();
}
const button = (label: string) => [...document.body.querySelectorAll<HTMLButtonElement>("button")].find((node) => node.textContent?.trim() === label);
const submit = () => act(async () => document.querySelector<HTMLFormElement>('[role="dialog"] form')!.requestSubmit());
const install = "/api/v1/universes/platform-universe/setups/configurator/install";

it("repairs with the current key by default", async () => {
  await openDialog();
  expect(button("Keep current key")!.getAttribute("aria-pressed")).toBe("true");
  await submit();
  await settle();
  expect(mocks.api).toHaveBeenCalledWith("POST", install, { key: { kind: "current" } });
});

it("switches to an existing active key with its pasted secret", async () => {
  await openDialog();
  await act(async () => button("Use an existing key")!.click());
  await settle();
  const label = [...document.querySelectorAll<HTMLLabelElement>('[role="dialog"] label')].find((node) => node.textContent === "Key")!;
  const select = document.getElementById(label.htmlFor) as HTMLSelectElement;
  expect(select.tagName).toBe("SELECT");
  expect([...select.options].map((option) => option.value)).toEqual(["", "lsk_cfg", "lsk_mine"]);
  await act(async () => { select.value = "lsk_mine"; select.dispatchEvent(new Event("change", { bubbles: true })); });
  const secret = document.querySelector<HTMLInputElement>("#configurator-existing-secret")!;
  await act(async () => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(secret, " lsk_mine_secret ");
    secret.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await settle();
  await submit();
  await settle();
  expect(mocks.api).toHaveBeenCalledWith("POST", install, {
    key: { kind: "existing", keyPrefix: "lsk_mine", secret: "lsk_mine_secret" },
  });
});
