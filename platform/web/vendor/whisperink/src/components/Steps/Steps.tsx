import { cn } from "../../cn.js";
import { Check } from "../../icons.js";
import { uiMetadata, type UiMetadataProps } from "../../metadata.js";

/**
 * Numbered steps for wizards; the active step is filled, completed steps show a check.
 * On a narrow screen only the active step keeps its name, so the row still fits.
 * @category feedback
 */
export function Steps({ uiId, uiDescription, uiComponentId, uiComponentDescription, steps, current, className }: ({ steps: readonly string[]; current: number; className?: string }) & UiMetadataProps) {
  const _ui = uiMetadata("steps", "Show workflow progress", { uiId, uiDescription, uiComponentId, uiComponentDescription });
  return (
    <ol className={cn("flex items-center gap-2", className)} {..._ui.attributes}>
      {steps.map((step, index) => {
        const state = index < current ? "done" : index === current ? "active" : "todo";
        return (
          <li key={step} className="flex min-w-0 items-center gap-2" aria-current={state === "active" ? "step" : undefined}>
            <span
              className={cn(
                "grid size-6 shrink-0 place-items-center rounded-full text-2xs font-semibold",
                state === "done" && "bg-primary text-primary-fg",
                state === "active" && "bg-primary text-primary-fg ring-4 ring-primary/15",
                state === "todo" && "border border-border-strong text-fg-muted",
              )}
            >
              {state === "done" ? <Check className="size-3.5" aria-hidden="true" /> : index + 1}
            </span>
            <span className={cn("truncate text-sm", state === "todo" ? "text-fg-muted" : "font-medium", state !== "active" && "max-sm:sr-only")}>{step}</span>
            {index < steps.length - 1 && <span className="mx-1 h-px w-4 shrink-0 bg-border-strong sm:w-8" aria-hidden="true" />}
          </li>
        );
      })}
    </ol>
  );
}
