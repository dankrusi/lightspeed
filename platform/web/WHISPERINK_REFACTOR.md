# Demo UI on Whisperink

Whisperink (`@versavolta/whisperink`, vendored from Versavolta/Whisperink `aa94772`) is the demo's UI kit. The product behavior stays in the existing pages. The frame, tokens, and the controls that map cleanly are Whisperink's.

Source of truth for the kit: `vendor/whisperink` and its design guide (`docs/DESIGN.md` in the upstream repo). This file is the mapping for the Lightspeed demo, not a second design guide.

## What moved

| Lightspeed surface | Whisperink |
| --- | --- |
| App shell, sidebar, account header | `WebApp`, `Sidebar`, header account menu |
| Page background, text, borders, status color, type, and radius | `tokens.css` as shipped. `whisperink-theme.css` only exposes those variables as Tailwind utilities |
| Buttons | `buttonClasses` on the existing button (keeps `render` for links) |
| Text fields | `Input`, `Textarea` |
| Checkbox and switch | `Checkbox`, `Switch`, with the app's `checked` / `onCheckedChange` names |
| Account menu | `MenuItem`, `MenuLabel`, `MenuSeparator` |
| Universe switcher | Same menu behavior, plain trigger in the header mark |

`⌘/Ctrl+B` still folds the navigation. The stored preference is the kit's collapsed rail. Dragging the sidebar to an arbitrary width is not part of `WebApp`.

## What stayed

Select, combobox, dialog, alert dialog, sheet, dropdown, popover, tabs, and table keep their current composition. Their colors come from the same tokens (`bg-popover` and `bg-card` resolve to `surface`). Rebuilding them as `Select`, `Modal`, and `Menu` would change every call site for no change in what the screens do.

Session transcripts, the composer, workspace trees, and bot triggers stay product components. They use the token utilities (`text-muted-foreground`, `bg-background`) so they sit on the kit's neutral scale.

The demo backend always has a session, so the password form is not on the happy path. `LoginPage` still renders it when there is no session.

## Checks

`e2e/flows.e2e.ts` drives installed Chrome against `npm run dev:demo`. It asserts the flows and writes a screenshot per step under `e2e/shots/before` and `e2e/shots/after`. A person or a model reads the pairs. The suite does not diff pixels.

```
cd platform/web
$env:E2E_PHASE='before'; npx playwright test
$env:E2E_PHASE='after'; npx playwright test
```
