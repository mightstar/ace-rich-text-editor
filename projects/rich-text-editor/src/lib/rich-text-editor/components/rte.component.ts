import { Component, ElementRef, ViewChild, Input, TemplateRef, Output, EventEmitter, ViewContainerRef, ComponentFactoryResolver } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Editor, Transforms, createEditor, Element as SlateElement, Range, Descendant } from 'slate';
@Component({
  selector: 'rte-root',
  templateUrl: './rte.component.html',
  styleUrls: ['./rte.component.scss'],
  imports: [CommonModule],
  standalone: true
})
export class CdkRichTextEditorComponent {

  oDoc: any;

  editor = createEditor();

  //Get div element to pass content to input
  @ViewChild('richText') richText!: ElementRef<HTMLElement>;
  @ViewChild('quickToolbar') quickToolbar!: ElementRef<HTMLElement>;

  @Input('cdkQuickToolbar') quick_toolbar!: TemplateRef<any>;
  @Output('cdkEditorSelectionChanged') selectionChanged = new EventEmitter<Selection>();

  private previousSelection!: Selection | null;

  isMarkActive(format: any): boolean {
    const selection = document.getSelection();

    if (format == 'heading-one') {
      return (this.isChildOfTag(selection?.anchorNode, 'h1'));
    }
    if (format == 'heading-two') {
      return (this.isChildOfTag(selection?.anchorNode, 'h2'));
    }
    if (format == 'blockquote') {
      return (this.isChildOfTag(selection?.anchorNode, 'blockquote'));
    }
    if (format == 'code-line') {
      return this.checkInlineTag('code');
    }

    return document.queryCommandState(format);


  }

  insertImage(url: string, width: number, height: number) {
    this.oDoc?.focus();

    let selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      let img = document.createElement('img');
      img.src = url;
      img.width = width;
      img.height = height;

      const range = selection.getRangeAt(0);
      range.insertNode(img);

    }



  }

  addMark(format: any, value?: string) {
    this.oDoc = document.getElementById("textBox");

    switch (format) {
      case "heading-one":
        document.execCommand('formatBlock', false, 'h1');
        break;
      case "heading-two":
        document.execCommand('formatBlock', false, 'h2');
        break;
      case "code-line":
        this.wrapInlineTag('code');
        // document.execCommand('formatBlock', false, 'pre');
        break;
      case "blockquote":
        document.execCommand('formatBlock', false, 'blockquote');

        break;
      case "numbered-list":
        document.execCommand('insertUnorderedList');

        break;
      case "bulleted-list":
        document.execCommand('insertOrderedList');

        break;

      default:
        document.execCommand(format);
        break;
    }

    this.oDoc?.focus();
  }
  wrapInlineTag(tag: string) {
    const selection = document.getSelection();
    if (selection) {
      const range = selection.getRangeAt(0);

      const code = document.createElement(tag);
      code.appendChild(range.extractContents());

      range.insertNode(code);
    }

  }
  checkInlineTag(tag: string): boolean {
    const selectedNode = this.getSelectedNode();
    if (selectedNode == null) return false;
    return this.isChildOfTag(selectedNode, tag);
  }

  getSelectedNode(): Node | ChildNode | null {
    const selection = window.getSelection();
    if (!selection?.anchorNode)
      return null;
    // ('selection.anchorNode', selection.getRangeAt(0));
    const anchorNode = selection.anchorNode;
    let element: Node | ChildNode | null = anchorNode;

    if (anchorNode instanceof Text) {
      // ('textAnchor', selection.anchorOffset, textAnchor.textContent?.length);
      if ((anchorNode as Text).textContent?.length == selection.anchorOffset) {
        ("nextContainer");
        element = anchorNode.nextSibling;

      } else {
        ("anchorContainer");
        element = anchorNode.parentNode;
      }
    } else {
      if ((anchorNode as HTMLElement).childNodes.length == selection.anchorOffset) {
        ("nextContainer");
        element = anchorNode.nextSibling;
      } else {
        ("anchorContainer");
      }
    }
    return element;
  }

  removeInlineTag(tag: string) {
    const selectedNode = this.getSelectedNode();
    selectedNode && this.untagParent(selectedNode, tag);
  }

  removeMark(format: any) {
    const selection = document.getSelection();

    this.oDoc = document.getElementById("textBox");
    switch (format) {
      case "heading-one":
        selection?.anchorNode && this.untagParent(selection?.anchorNode, 'h1');
        break;
      case "heading-two":
        selection?.anchorNode && this.untagParent(selection?.anchorNode, 'h2');
        break;
      case "blockquote":
        selection?.anchorNode && this.untagParent(selection?.anchorNode, 'blockquote');
        break;
      case "code-line":
        this.removeInlineTag('code');
        break;
      case "bold":
      case "italic":
      case "underline":

        document.execCommand(format);
        break;
      default:
        document.execCommand('removeForamt', false);
        break;
    }
    this.oDoc?.focus();
  }

  untagParent(node: ChildNode | Node | null, tag: string): void {
    let element = this.findParentWithTag(node, tag);
    if (element && element instanceof HTMLElement) {
      const htmlElement = element as HTMLElement;
      let newElement = document.createElement('span');
      newElement.innerHTML = htmlElement.innerHTML;
      htmlElement.replaceWith(newElement);

    }
  }

  isChildOfTag(node: any, tag: string): boolean {
    let parentElement: Node | ChildNode | null = node;

    while (parentElement && parentElement !== this.richText.nativeElement) {


      if (parentElement.nodeName.toLocaleLowerCase() === tag)
        return true;
      parentElement = parentElement.parentElement;
    }

    return false;
  }

  findParentWithTag(node: Node | ChildNode | null, tag: string): Node | null {
    let parentElement = node;

    while (parentElement) {

      if (parentElement.nodeName.toLowerCase() === tag && parentElement !== this.richText.nativeElement)
        return parentElement;
      parentElement = parentElement.parentElement;
    }

    return null;
  }



  toggleMark(format: any) {
    if (!this.isMarkActive(format)) {
      this.addMark(format);
    } else {
      this.removeMark(format);
    }
  }


  onMouseDown(event: MouseEvent) {
    // this.previousSelection = window.getSelection();
  }

  onMouseUp(event: MouseEvent) {
    setTimeout(() => {
      const currentSelection = window.getSelection();
      currentSelection && this.selectionChanged.emit(currentSelection);


      if (currentSelection /* && currentSelection?.toString() != '' */) {
        let quickToolbar = this.quickToolbar.nativeElement;
        quickToolbar.classList.remove('hide');
        quickToolbar.classList.add('show');
        const PADDING = 10;
        const range = currentSelection.getRangeAt(0);
        const selectedRect = range.getBoundingClientRect();
        const editorRect = this.richText.nativeElement.getBoundingClientRect();
        const toolbarRect = this.quickToolbar.nativeElement.getBoundingClientRect();
        let newY = selectedRect.y - quickToolbar.getBoundingClientRect().height - PADDING;
        let newX = selectedRect.x;
        if (newY < editorRect.y) {
          newY = selectedRect.bottom + PADDING;
        }

        if (newX + toolbarRect.width > editorRect.right) {
          newX = editorRect.right - toolbarRect.width - PADDING;
        }



        const x = newX - this.richText.nativeElement.getBoundingClientRect().x;
        const y = newY - this.richText.nativeElement.getBoundingClientRect().y;
        quickToolbar.style.top = y + 'px';
        quickToolbar.style.left = x + 'px';

      } else {
        // this.quickToolbar.nativeElement.style.opacity = '0';
        let quickToolbar = this.quickToolbar.nativeElement;
        quickToolbar.classList.remove('show');
        quickToolbar.classList.add('hide');
        if (currentSelection !== this.previousSelection) {
          this.previousSelection = currentSelection;
        }
      }
    }, 10);

  }
  onSelect(event: any) {
    const selectedText = window.getSelection()?.toString();
  }
  constructor(
    private elementRef: ElementRef<HTMLElement>,
    private viewContainerRef: ViewContainerRef,
    private componentFactoryResolver: ComponentFactoryResolver
  ) { }

}
