/** DOM paths survive a history restore without inserting marker spans into authored content. */
export type RichTextSelection = { anchor: number[]; anchorOffset: number; focus: number[]; focusOffset: number };

export function readRichTextSelection(root: HTMLElement): RichTextSelection | null {
  const selection = root.ownerDocument.getSelection();
  if (!selection?.anchorNode || !selection.focusNode || !root.contains(selection.anchorNode) || !root.contains(selection.focusNode)) return null;
  const path = (node: Node) => {
    const indexes: number[] = [];
    while (node !== root && node.parentNode) {
      indexes.unshift(Array.prototype.indexOf.call(node.parentNode.childNodes, node));
      node = node.parentNode;
    }
    return indexes;
  };
  return { anchor: path(selection.anchorNode), anchorOffset: selection.anchorOffset, focus: path(selection.focusNode), focusOffset: selection.focusOffset };
}

export function restoreRichTextSelection(root: HTMLElement, bookmark: RichTextSelection | null): void {
  root.focus({ preventScroll: true });
  const selection = root.ownerDocument.getSelection();
  if (!selection) return;
  const resolve = (path: number[]) => path.reduce<Node>((node, index) => node.childNodes[index] ?? node, root);
  const limit = (node: Node, offset: number) => Math.min(offset, node.nodeType === Node.TEXT_NODE ? node.textContent?.length ?? 0 : node.childNodes.length);
  if (bookmark) {
    const anchor = resolve(bookmark.anchor), focus = resolve(bookmark.focus);
    selection.setBaseAndExtent(anchor, limit(anchor, bookmark.anchorOffset), focus, limit(focus, bookmark.focusOffset));
  } else {
    const range = root.ownerDocument.createRange();
    range.selectNodeContents(root); range.collapse(false);
    selection.removeAllRanges(); selection.addRange(range);
  }
}

/** A format command may split/replace text nodes. Text offsets preserve forward and backward selections across that change. */
export function textSelection(root: HTMLElement): [number, number] | null {
  const selected = root.ownerDocument.getSelection();
  if (!selected?.anchorNode || !selected.focusNode || !root.contains(selected.anchorNode) || !root.contains(selected.focusNode) || !root.textContent) return null;
  const offset = (node: Node, position: number) => {
    const range = root.ownerDocument.createRange(); range.selectNodeContents(root); range.setEnd(node, position);
    return range.toString().length;
  };
  return [offset(selected.anchorNode, selected.anchorOffset), offset(selected.focusNode, selected.focusOffset)];
}

export function restoreTextSelection(root: HTMLElement, offsets: [number, number]): void {
  const point = (offset: number): [Node, number] => {
    const walker = root.ownerDocument.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const length = walker.currentNode.textContent?.length ?? 0;
      if (offset <= length) return [walker.currentNode, offset];
      offset -= length;
    }
    return [root, root.childNodes.length];
  };
  root.ownerDocument.getSelection()?.setBaseAndExtent(...point(offsets[0]), ...point(offsets[1]));
}
