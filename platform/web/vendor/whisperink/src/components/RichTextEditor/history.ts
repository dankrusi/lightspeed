import type { RichTextSelection } from "./selection.js";

export type RichTextMode = "visual" | "markdown" | "html";
export type EditorSnapshot = {
  mode: RichTextMode;
  markdown: string;
  html: string;
  source: string;
  selection: RichTextSelection | null;
  sourceSelection: [number, number, "forward" | "backward" | "none"] | null;
};

/** One history across all three views. Typing coalesces only while the caret continues in place. */
export class RichTextHistory {
  private undoStack: { before: EditorSnapshot; after: EditorSnapshot; kind: string; time: number }[] = [];
  private redoStack: typeof this.undoStack = [];
  get canUndo() { return this.undoStack.length > 0; }
  get canRedo() { return this.redoStack.length > 0; }
  clear() { this.undoStack = []; this.redoStack = []; }
  push(before: EditorSnapshot, after: EditorSnapshot, kind = "command") {
    if (before.html === after.html && before.source === after.source && before.markdown === after.markdown) return;
    const previous = this.undoStack.at(-1), time = Date.now();
    const continuous = previous && previous.after.mode === before.mode && previous.kind === kind && time - previous.time < 750
      && JSON.stringify(previous.after.selection ?? previous.after.sourceSelection) === JSON.stringify(before.selection ?? before.sourceSelection);
    if ((kind === "insertText" || kind === "deleteContentBackward" || kind === "deleteContentForward") && continuous) {
      previous.after = after; previous.time = time;
    } else {
      this.undoStack.push({ before, after, kind, time });
      if (this.undoStack.length > 100) this.undoStack.shift();
    }
    this.redoStack = [];
  }
  undo(): EditorSnapshot | null {
    const entry = this.undoStack.pop();
    if (!entry) return null;
    this.redoStack.push(entry); return entry.before;
  }
  redo(): EditorSnapshot | null {
    const entry = this.redoStack.pop();
    if (!entry) return null;
    this.undoStack.push(entry); return entry.after;
  }
}
