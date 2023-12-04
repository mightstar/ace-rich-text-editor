import { EmbeddedViewRef, TemplateRef, ViewContainerRef } from "@angular/core";
import  hljs from 'highlight.js';
import { convert } from 'html-to-text'; 

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


export function createLiveHashtag(tag: string, value: any, template: TemplateRef<any>, viewContainer?: ViewContainerRef): HTMLElement {
  const element = document.createElement('span');
  element.setAttribute('hashtag_component', '' + tag);
  element.setAttribute('contenteditable', 'false');
  element.innerHTML = '';
  const realHashtag = document.createElement('span');
  const hiddenHashtag = document.createElement('span');
  hiddenHashtag.style.display = "none";
  hiddenHashtag.setAttribute('hashtag_code', tag);
  hiddenHashtag.innerHTML = `${tag}${value}${tag}`;

  const viewRef: EmbeddedViewRef<Node> = template.createEmbeddedView({ value });
  viewContainer?.insert(viewRef);
  viewRef.detectChanges();
  for (let node of viewRef.rootNodes) {
    realHashtag.appendChild(node);
  }

  element.innerHTML = '';
  element.appendChild(realHashtag);
  element.appendChild(hiddenHashtag);

  return element;

}

function isHashtagElement(element: Element, pattern: RegExp): boolean {

  let textNodes: Text[] = [];
  element.childNodes.forEach(child => {
    if (child.nodeType == Node.TEXT_NODE) {
      textNodes.push(child as Text);
    }
  });

  let text = textNodes.map(textNode => textNode.textContent).join('');

  if (text.match(pattern)) {
    return true;
  }
  return false;
}


export function makeLiveHashtags(root: HTMLElement, tag: string, template: TemplateRef<any>, viewContainer?: ViewContainerRef) {
  const selection = window.getSelection();
  if (selection == null) {
    return;
  }
  let hashtag = tag;

  const nodes: Element[] = [];
  const elements = root.querySelectorAll('*'); // Select all elements

  const pattern = new RegExp(`${hashtag}(.*?)${hashtag}`);

  if (isHashtagElement(root, pattern)) {
    nodes.push(root);
  }
  elements.forEach(element => {
    if (isHashtagElement(element, pattern)) {
      nodes.push(element);
    }
  });

  for (let element of nodes) {
    let textNodes = findTextNodes(element, hashtag);
    for (let i = 0; i < textNodes.length; i += 2) {

      const startNode = textNodes[i].text;
      const startIndex = textNodes[i].index + hashtag.length;
      const endNode = textNodes[i + 1].text;
      const endIndex = textNodes[i + 1].index;

      if (startNode !== endNode || !startNode.textContent)
        continue;

      let value = startNode.textContent.substring(startIndex, endIndex);

      const liveHashtag = createLiveHashtag(tag, JSON.parse(value), template, viewContainer);

      const range = document.createRange();
      range.setStart(startNode, startIndex - hashtag.length);
      range.setEnd(endNode, endIndex + hashtag.length);

      selection.removeAllRanges();
      selection.addRange(range);
      range.extractContents();
      range.insertNode(liveHashtag);

      textNodes = findTextNodes(element, hashtag);
      i -= 2;
    }
  }
  selection.removeAllRanges();
}

export function convertHTML2Hightlighted(htmlContent: string): string {
  let textContent = htmlContent;
  console.log("textContent = ", textContent);
  if (textContent) {
    // textContent = textContent.replaceAll('\n', '');
    // textContent = textContent.replaceAll('&nbsp;', ' ');
    // textContent = textContent.replaceAll('&nbsp', ' ');
    // textContent = textContent.replaceAll('</div>', '\n');
    // textContent = textContent.replaceAll('</p>', '\n');
    // textContent = textContent.replaceAll('<br/>', '\n');
    // textContent = textContent.replaceAll('<br>', '\n');
    // textContent = textContent.replace( /(<([^>]+)>)/ig, '');
    textContent = textContent.replaceAll('<div><br></div>', '<div></div>');
    textContent = textContent.replaceAll('<div><br/></div>', '<div></div>');
    textContent = convert(textContent,{ wordwrap: false });
    const hresult = hljs.highlightAuto(textContent)
    return hresult.value.replaceAll('\n', '<br/>');
  } 
  return "";
}
