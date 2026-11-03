# Whisperink migration TODOs

Open follow-ups from moving the web UI onto Whisperink. See `WHISPERINK_REFACTOR.md` for what has already moved.

## Behavior changes to decide on

These came from replacing the local `src/components/ui/` adapters with Whisperink components. That folder is gone: pages import Whisperink directly, and the app's own pieces live in `src/components/` (transcript pieces in `src/components/session/`).

- **ArrowDown no longer opens a menu from its trigger.** The old dropdown adapter added this; Whisperink's `Menu` doesn't support it. Enter and Space still open menus, and arrow keys still move between items once a menu is open. If this is wanted back, add it to `Menu` in the kit rather than at each call site.
- **Checkbox items in menus close the menu when clicked.** Whisperink's `Menu` closes on any item. This affects the session view preferences. The old adapter behaved the same way, but the original intent was to stay open.
- **Dialog descriptions are plain text.** `Modal` takes a string `description`, so descriptions that used monospace for ids, env var names, and `lightspeed-envd` lost that styling. `ConfirmDangerButton` puts a description with markup in the body instead, so it no longer sets `aria-describedby`.
- **Decorative icons were dropped from dialog titles and the workspace picker.** These are the GitHub logo on the GitHub App dialogs, the provider logo on the add-model-provider dialog, the live avatar on the New bot dialog, and the folder icon in the workspace picker (a native select can't hold one).
- **Popovers have a fixed gap and no offsets.** Whisperink's `Popover` places panels 6px from the trigger and has no `sideOffset`/`alignOffset`. The model picker's height cap is now a plain `max-h-[22rem]`, because the old one used a CSS variable that Base UI set and Whisperink doesn't.
- **Tooltips use Whisperink's own delay.** The app-wide `TooltipProvider` delay is gone.
- **A single-select combobox stays open after a choice.** This was already true under the adapter.
- **Icon buttons show a tooltip.** Icon-only buttons are now Whisperink `IconButton`s, which are square and show their label as a tooltip on hover and focus. A few also keep a longer native `title` (dictate, attach, stop, send, cancel queued message, select sessions, rotate pairing code), so they show both tooltips. Fold each pair into one.
- **Card headers have a bottom border.** Cards that moved to Whisperink `CardHeader` (Account, General settings, Channels, Admin channels, the appearance card, Login) get its divider and an `h3` title. The Setups card header kept its own markup because it has an icon-and-status row.

- **Form fields use Whisperink `Field`.** Labels are linked to their control, and hints and errors are announced through `aria-describedby`. Hints now sit below the control in smaller text. "(optional)" in a label is now Whisperink's separate "Optional" tag. Switch and checkbox rows use the control's own `label` and `description`, with `text-base` labels, and the switch sits on the right.
- **View toggles are segmented controls.** The Form/JSON toggle on Profiles, the Markdown view toggle, and the tool-call detail toggle use Whisperink `Segmented`, which is a radio group rather than a tab list.
## Visual checks

- **Wide dialogs:** Whisperink tops out at `xl` (`max-w-5xl`). The bot editor (`max-w-6xl`/`max-w-4xl`) and the new-session setup step (`max-w-4xl`) are now `xl`. The MCP server dialog (`max-w-xl`) is now the default `md` (`max-w-lg`).
- **Session settings dialog:** a body wrapper with a fixed grid height keeps the Apply footer pinned.
- **Multi-line menu item:** "Steer the current run" in the composer overrides `MenuItem`'s `h-8`.

## Changes to the vendored kit

Send these upstream to Whisperink, or the next vendor update will undo them:

- `components/Field/Field.tsx`: `min-w-0 content-start` on the root, so a taller neighbour in a row of fields doesn't push the label away from its control, and long values truncate instead of widening the form.
- `components/Tabs/roving.ts`: `// @ts-nocheck`, like the other kit files that don't pass the app's `noUncheckedIndexedAccess`.
- `components/Modal/Modal.tsx`: changed before this migration started; check what it was for.

## Untracked files

- `pnpm-lock.yaml` and `pnpm-workspace.yaml` at the repo root look like they came from an accidental pnpm run, since the repo uses npm. `platform/web/surface-check.mjs` is a one-off Playwright debug script. Delete or ignore them.
