// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { CronBuilder } from "./cron-builder";

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

const button = (label: string) =>
  [...container.querySelectorAll("button")].find((node) => node.textContent === label)!;

it("opens from the current expression and closes once a schedule is applied", async () => {
  const onChange = vi.fn();
  await act(async () => root.render(<CronBuilder value="30 8 * * 1-5" onChange={onChange} />));
  const trigger = button("Build visually");
  expect(trigger.getAttribute("aria-expanded")).toBe("false");
  expect(container.textContent).not.toContain("Visual schedule");

  await act(async () => trigger.click());
  expect(trigger.getAttribute("aria-expanded")).toBe("true");
  expect(container.querySelector<HTMLSelectElement>("#cron-builder-frequency")!.value).toBe("weekdays");
  expect(container.querySelector<HTMLInputElement>("#cron-builder-time")!.value).toBe("08:30");

  await act(async () => button("Use schedule").click());
  expect(onChange).toHaveBeenCalledWith("30 8 * * 1-5");
  expect(trigger.getAttribute("aria-expanded")).toBe("false");
  expect(container.textContent).not.toContain("Visual schedule");
});
