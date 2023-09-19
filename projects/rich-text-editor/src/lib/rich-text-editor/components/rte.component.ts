import { Type, Component, QueryList, Injector, ElementRef, ViewChild, ContentChild, ContentChildren, Input, TemplateRef, Output, EventEmitter, ViewContainerRef, ComponentFactoryResolver, createComponent, EmbeddedViewRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkSuggestionComponent, CdkSuggestionItem, CdkSuggestionSelect } from './suggestion.component';
import { isRectEmpty } from '../utils/DOM';

export interface CdkSuggestionSetting {
  trigger: string,
  itemTemplate: TemplateRef<any>,
  inputTemplate: TemplateRef<any>,
  queryFilter: (query: string, key: string) => boolean,
  data: CdkSuggestionItem[]
}

@Component({
  selector: 'rte-root',
  templateUrl: './rte.component.html',
  styleUrls: ['./rte.component.scss'],
  imports: [CommonModule, CdkSuggestionComponent],
  standalone: true
})
export class CdkRichTextEditorComponent {

  @ViewChild('richText') richText!: ElementRef<HTMLElement>;
  @ViewChild('richText', { read: ViewContainerRef }) richTextContainer!: ViewContainerRef;
  @ViewChild('quickToolbar') quickToolbar!: ElementRef<HTMLElement>;
  @ViewChild('suggestion') suggestion!: CdkSuggestionComponent;



  @Input('cdkQuickToolbar')
  quick_toolbar!: TemplateRef<any>;

  @Input('cdkSuggestions')
  suggestionList: CdkSuggestionSetting[] = [];

  suggestionInputTemplate!: TemplateRef<any>;

  @Input('cdkSuggestionEnabled')
  suggestionEnabled: boolean = true;




  @Output('cdkEditorSelectionChanged')
  selectionChanged = new EventEmitter<Selection>();




  isSeggestionVisible: boolean = false;

  previousSelection!: Selection | null;

  /**
   * 
   * @param tag 
   */
  private _wrapInlineTag(tag: string) {
    const selection = document.getSelection();
    if (selection) {
      const range = selection.getRangeAt(0);

      const code = document.createElement(tag);
      code.appendChild(range.extractContents());

      range.insertNode(code);
    }

  }

  private _checkInlineTag(tag: string): boolean {
    const selectedNode = this._getSelectedNode();
    if (selectedNode == null) return false;
    return this._isChildOfTag(selectedNode, tag);
  }

  private _removeInlineTag(tag: string) {
    const selectedNode = this._getSelectedNode();
    selectedNode && this._untagParent(selectedNode, tag);
  }

  private _getSelectedNode(): Node | ChildNode | null {
    const selection = window.getSelection();


    if (!selection?.anchorNode)
      return null;
    // ('selection.anchorNode', selection.getRangeAt(0));
    const anchorNode = selection.anchorNode;
    let element: Node | ChildNode | null = anchorNode;

    if (anchorNode instanceof Text) {

      // ('textAnchor', selection.anchorOffset, textAnchor.textContent?.length);
      if ((anchorNode as Text).textContent?.length == selection.anchorOffset) {
        element = anchorNode.nextSibling;

      } else {
        element = anchorNode.parentNode;


      }
    } else {
      if ((anchorNode as HTMLElement).childNodes.length == selection.anchorOffset) {
        element = anchorNode.nextSibling;
      } else {
      }
    }
    return element;
  }

  private _untagParent(node: ChildNode | Node | null, tag: string): void {
    let element = this._findParentWithTag(node, tag);
    if (element && element instanceof HTMLElement) {
      const htmlElement = element as HTMLElement;

      htmlElement.replaceWith(...Array.from(htmlElement.childNodes));

    }
  }

  private _isChildOfTag(node: any, tag: string): boolean {
    let parentElement: Node | ChildNode | null = node;

    while (parentElement && parentElement !== this.richText.nativeElement) {


      if (parentElement.nodeName.toLocaleLowerCase() === tag)
        return true;
      parentElement = parentElement.parentElement;
    }

    return false;
  }

  private _findParentWithTag(node: Node | ChildNode | null, tag: string): Node | null {
    let parentElement = node;

    while (parentElement) {

      if (parentElement.nodeName.toLowerCase() === tag && parentElement !== this.richText.nativeElement)
        return parentElement;
      parentElement = parentElement.parentElement;
    }

    return null;
  }

  private _getSelectorName(componentName: Type<Component>): string {
    let componentFactory = this.componentFactoryResolver.resolveComponentFactory(componentName);
    let selector = componentFactory.selector;
    return selector;
  }

  private _enterSuggestion = (item: CdkSuggestionItem, triggerIndex: number) => {
    const selection = window.getSelection();
    const startedNode = this.suggestion.startedNode;
    const startedOffset = this.suggestion.startedOffset;
    if (selection && startedNode) {

      const focusNode = selection.focusNode;

      if (focusNode && focusNode instanceof Text && focusNode == startedNode) {
        let text = focusNode.textContent;
        let startIndex = 0;

        if (text && (startIndex = startedOffset - 1) >= 0) {
          text = text.slice(0, startIndex) + text.slice(selection.focusOffset);
        }


        focusNode.textContent = text;

        const range = document.createRange();

        const documentFragment = document.createDocumentFragment();

        const viewRef: EmbeddedViewRef<Node> = this.suggestionList[triggerIndex].inputTemplate.createEmbeddedView({ value: item.value });


        this.richTextContainer.insert(viewRef);
        for (let node of viewRef.rootNodes) {
          documentFragment.appendChild(node);

        }


        range.selectNodeContents(focusNode);
        range.setStart(focusNode, startIndex);
        range.setEnd(focusNode, startIndex);

        selection.removeAllRanges();
        selection.addRange(range);

        range.insertNode(documentFragment);

        range.collapse();
      }

    }
    this.suggestion.show(false);

  }

  private _focusElementAfterSuggestion(element: HTMLElement) {
    if (document.activeElement !== element) {

      element.focus();

      const selection = window.getSelection();
      selection?.removeAllRanges();
      this.suggestion.currentRange && selection?.addRange(this.suggestion.currentRange);
    }
  }

  toggleMark(format: any) {
    if (!this.isMarkActive(format)) {
      this.addMark(format);
    } else {
      this.removeMark(format);
    }
  }

  isMarkActive(format: any): boolean {
    const selection = document.getSelection();

    if (format == 'heading-one') {
      return (this._isChildOfTag(selection?.anchorNode, 'h1'));
    }
    if (format == 'heading-two') {
      return (this._isChildOfTag(selection?.anchorNode, 'h2'));
    }
    if (format == 'blockquote') {
      return (this._isChildOfTag(selection?.anchorNode, 'blockquote'));
    }
    if (format == 'code-line') {
      return this._checkInlineTag('code');
    }

    return document.queryCommandState(format);


  }

  addMark(format: any, value?: string) {

    switch (format) {
      case "heading-one":
        document.execCommand('formatBlock', false, 'h1');
        break;
      case "heading-two":
        document.execCommand('formatBlock', false, 'h2');
        break;
      case "code-line":
        this._wrapInlineTag('code');
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

  }

  removeMark(format: any) {
    const selection = document.getSelection();

    switch (format) {
      case "heading-one":
        selection?.anchorNode && this._untagParent(selection?.anchorNode, 'h1');
        break;
      case "heading-two":
        selection?.anchorNode && this._untagParent(selection?.anchorNode, 'h2');
        break;
      case "blockquote":
        selection?.anchorNode && this._untagParent(selection?.anchorNode, 'blockquote');
        break;
      case "code-line":
        this._removeInlineTag('code');
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
  }

  insertImage(url: string, width: number, height: number) {

    let selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      let img = document.createElement('img');
      img.src = url;
      // img.width = width;
      // img.height = height;

      const range = selection.getRangeAt(0);
      range.insertNode(img);

    }
  }

  toggleComponent(componentName: Type<Component>) {
    if (!this.isActiveComponent(componentName)) {
      this.insertComponent(componentName);

    } else {
      this.removeComponent(componentName);
    }
  }

  insertComponent(componentName: Type<Component>) {
    const selection = window.getSelection();

    if (selection && selection.anchorNode) {
      const componentFactory = this.componentFactoryResolver.resolveComponentFactory(componentName);

      const componentRef = this.richTextContainer.createComponent(componentFactory, undefined, undefined, [[selection.getRangeAt(0).extractContents()]]);

      const range = selection.getRangeAt(0);

      range.insertNode(componentRef.location.nativeElement);
    }
  }

  removeComponent(componentName: Type<Component>) {

    let componentNode = this._findParentWithTag(this._getSelectedNode(), this._getSelectorName(componentName));

    if (componentNode && componentNode instanceof HTMLElement) {
      let componentElement: HTMLElement = componentNode;

      const cdkContents = componentElement.querySelector('[cdkContent]')?.cloneNode(true);

      if (cdkContents)
        componentElement.replaceWith(...Array.from(cdkContents.childNodes));
      else
        componentElement.remove();

    }
  }

  isActiveComponent(componentName: Type<Component>): boolean {

    return this._isChildOfTag(this._getSelectedNode(), this._getSelectorName(componentName));
  }


  onMouseDown = (event: MouseEvent) => {
    if (this.suggestionEnabled)
      this.suggestion.onMouseDown(event);
  }

  onMouseUp = (event: MouseEvent) => {
    setTimeout(() => {
      const currentSelection = window.getSelection();
      currentSelection && this.selectionChanged.emit(currentSelection);

      if (currentSelection && currentSelection?.toString() != '') {
        let quickToolbar = this.quickToolbar.nativeElement;

        quickToolbar.classList.toggle('show', true);
        const PADDING = 10;
        const range = currentSelection.getRangeAt(0);
        let selectedRect = range.getBoundingClientRect();

        const editorRect = this.richText.nativeElement.getBoundingClientRect();
        const toolbarRect = this.quickToolbar.nativeElement.getBoundingClientRect();

        if (isRectEmpty(selectedRect)) {
          selectedRect = (range.startContainer as Element).getBoundingClientRect();
        }
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
        let quickToolbar = this.quickToolbar.nativeElement;
        quickToolbar.classList.toggle('show', false);
      }
    }, 10);

  }

  onKeyDown = (event: KeyboardEvent) => {

    if (this.suggestionEnabled) {
      this.suggestion.onKeyDown(event);
    }
  }

  onFocusIn = () => {



  }

  onFocusOut() {


    // this.suggestion.show(false);

  }

  onValueChange = (event: Event) => {
    if (this.suggestionEnabled)
      this.suggestion.onValueChange(event);
  }

  onSuggestionSelected = (event: CdkSuggestionSelect) => {
    if (this.suggestionEnabled) {
      this._focusElementAfterSuggestion(this.richText.nativeElement);

      this._enterSuggestion(event.item, event.triggerIndex);
    }

  }




  constructor(
    private elementRef: ElementRef<HTMLElement>,

    private componentFactoryResolver: ComponentFactoryResolver,

  ) { }

}
