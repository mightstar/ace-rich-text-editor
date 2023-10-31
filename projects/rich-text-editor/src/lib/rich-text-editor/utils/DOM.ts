
export function isRectEmpty(rect: DOMRect) {
    return rect.x == 0 && rect.y == 0 && rect.right == 0 && rect.bottom == 0;
}

export function focusElementWithRangeIfNotFocused(element: HTMLElement, range: Range) {
    if (document.activeElement !== element) {
        element.focus();

        const selection = window.getSelection();
        selection?.removeAllRanges();
        range && selection?.addRange(range);
    }
}

export function focusElementWithRange(element: HTMLElement, range: Range) {
    if (document.activeElement !== element) {
        element.focus();
    }

    const selection = window.getSelection();
    selection?.removeAllRanges();
    range && selection?.addRange(range);
}


// COMPAT: In Firefox, `caretRangeFromPoint` doesn't exist. (2016/07/25)
export function getRangeFromPosition(x: number, y: number): Range | null {
    let domRange: Range | null = null;
    if (document.caretRangeFromPoint) {
        domRange = document.caretRangeFromPoint(x, y);
    } else {
        const position = (document as any).caretPositionFromPoint(x, y);

        if (position) {
            domRange = document.createRange();
            domRange.setStart(position.offsetNode, position.offset);
            domRange.setEnd(position.offsetNode, position.offset);
        }
    }

    return domRange;
}


export function findTextNodes(element: Element, pattern: string): Array<{ text: Text, index: number }> {
    let textNodes: Array<{ text: Text, index: number }> = [];
    let matches: IterableIterator<RegExpMatchArray> | null = null;
    element.childNodes.forEach(child => {

      if (child.nodeType == Node.TEXT_NODE && child.textContent && (matches = child.textContent.matchAll(new RegExp(pattern, "g")))) {

        for (let match of matches) {
          match.index !== undefined && textNodes.push({ index: match.index, text: child as Text });
        }

      }
    });

    (textNodes.length % 2 == 1) && textNodes.pop();

    return textNodes;
  }