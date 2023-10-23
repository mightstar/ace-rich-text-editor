import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, ViewEncapsulation, OnInit, reflectComponentType, ElementRef, EmbeddedViewRef, EventEmitter, Input, Output, TemplateRef, Type, ViewChild, ViewContainerRef } from '@angular/core';
import { CircularProgressComponent } from './circular-progressive.component';
import { CdkSuggestionComponent, CdkSuggestionItem, CdkSuggestionSelect } from './suggestion.component';
import { focusElementWithRange, focusElementWithRangeIfNotFocused, getRangeFromPosition, isRectEmpty } from '../utils/DOM';
import { TOOLBAR_ITEMS } from '../utils/config';
import { loadImage } from '../utils/image';

interface ToolbarItem {
  action: string,
  icon: string,
  active: boolean,
  payload?: any,
}

export interface CdkToolbarItemSetting {
  action: string,
  payload?: any,
}

export interface CdkSuggestionSetting {
  trigger: string,
  itemTemplate: TemplateRef<any>,
  inputTemplate: TemplateRef<any>,
  queryFilter: (query: string, key: string) => boolean,
  data: CdkSuggestionItem[]
}
type EditAction = 'insert' | 'remove' | 'copy' | 'cut' | 'paste' | 'drop';
type ContentType = 'component' | 'image' | 'format' | 'tag' | 'plaintext' | 'template';

export interface CdkSelection {
  startContainerPath: number[],
  startOffest: number,
  endContainerPath: number[],
  endOffset: number,
  selectionContent?: DocumentFragment
}

export interface CdkEditAction {
  action: EditAction,
  previousState: CdkSelection,
  currentState: CdkSelection,
  contentType: ContentType, // component | image | format | tag | plainText | template
  content: any
}

@Component({
  selector: 'rte-text-editor',
  templateUrl: './rte.component.html',
  styleUrls: ['./rte.component.scss'],
  imports: [CommonModule, CdkSuggestionComponent, CircularProgressComponent],
  standalone: true,
  encapsulation: ViewEncapsulation.None
})
export class CdkRichTextEditorComponent implements OnInit {


  @ViewChild('templates') templates!: ElementRef<HTMLElement>;
  @ViewChild('richText') richText!: ElementRef<HTMLElement>;
  @ViewChild('richText', { read: ViewContainerRef }) richTextContainer!: ViewContainerRef;
  @ViewChild('quickToolbar') quickToolbarElement!: ElementRef<HTMLElement>;
  @ViewChild('suggestion') suggestion!: CdkSuggestionComponent;

  @ViewChild('default_quick_toolbar') default_quick_toolbar!: TemplateRef<any>;


  @Input('cdkQuickToolbar')
  quick_toolbar!: TemplateRef<any>;

  @Input('cdkDefaultToolbarItems')
  defaultToolbarItems!: CdkToolbarItemSetting[];


  @Input('cdkSuggestions')
  suggestionList: CdkSuggestionSetting[] = [];

  @Input('cdkSuggestionEnabled')
  suggestionEnabled: boolean = true;

  @Input('cdkImageUploadUrl')
  imageUploadUrl: string = "";

  @Output('cdkEditorSelectionChanged')
  selectionChanged = new EventEmitter<Selection>();

  @Output('cdkContentChanged')
  contentChanged = new EventEmitter<string>();

  @Output()
  focus = new EventEmitter();

  @Output()
  blur = new EventEmitter();




  isSeggestionVisible: boolean = false;

  isUploading = false;

  suggestionInputTemplate!: TemplateRef<any>;

  toolbarItems: ToolbarItem[] = [];

  /**
   *
   * @param tag
   */
  private _wrapTag(tag: string, classlists: string[]) {

    const selection = document.getSelection();
    if (selection) {

      const range = selection.getRangeAt(0);

      const tagTemplate = this.templates.nativeElement.querySelector(tag);
      classlists.forEach(item => tagTemplate?.classList.add(item));

      if (tagTemplate) {
        const element = tagTemplate.cloneNode(true);
        element.appendChild(range.extractContents());
        range.insertNode(element);
      }

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

  private _getPathFromNode(node: Node | ChildNode | Text | null): number[] {
    let path: number[] = [];


    while (node && node !== this.richText.nativeElement) {

      let parent = node.parentElement;
      path.push(Array.prototype.indexOf.call(parent, node));

      node = parent;
    }
    if (node == this.richText.nativeElement) {
      path = [];
    }

    return path;

  }

  private _getNodeFromPath(path: number[]): Node | null {

    let i = 0;
    let node: Node = this.richText.nativeElement;

    if (path.length == 0)
      return null;
    for (i = path.length - 1; i >= 0; i--) {
      if (path[i] == -1 && node.childNodes.length <= path[i]) {
        return null;
      }
      node = node.childNodes[path[i]];

      if (node == null)
        return null;
    }

    return node;


  }

  private _getSelectorName(componentName: Type<Component>): string | undefined {
    const metadata = reflectComponentType(componentName);
    const selectorName = metadata?.selector // my-component

    return selectorName;

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
        setTimeout(() => this._contentChanged(), 0);
        // this._contentChanged();

        range.collapse();

      }

    }
    this.suggestion.show(false);

  }


  private _contentChanged = () => {
    this.contentChanged.emit(this.richText.nativeElement.innerHTML);
  }
  // TODO for undo/redo
  private _pushHistory = (action: EditAction, contentType: ContentType, previousState: CdkSelection, currentState: CdkSelection, content: any) => {
    this.undoStack.push({
      action,
      previousState,
      currentState,
      contentType,
      content
    })
  }

  private _undoInsert(action: CdkEditAction) {
    switch (action.contentType) {
      case 'plaintext':

        break;
      case 'component':

        break;

      case 'format':
        break;

      case 'tag':
        break;

      case 'image':
        break;

      case 'template':
        break;
      default:
        break;
    }
  }

  private _undoRemove(action: CdkEditAction) {

  }
  undoStack: CdkEditAction[] = [];
  redoStack: CdkEditAction[] = [];

  undo = () => {

    if (this.undoStack.length >= 1) {

      let lastAction = this.undoStack.pop();
      if (lastAction) {

        switch (lastAction.action) {
          case 'insert':

            this._undoInsert(lastAction);
            break;
          case 'remove':
            this._undoRemove(lastAction);
            break;
          default:
            break;
          // 'insert' | 'remove' | 'copy' | 'cut' | 'paste' | 'drop'

        }
      }

    }

  }
  //

  updateToolbar() {
    this.toolbarItems.forEach(item => {
      item.active = this.isFormatActive(item.action);

      if (item.action == 'image')
        item.active = false;
      if (item.action == 'component') {
        if (item.payload) {
          const component: Type<Component> = item.payload;
          item.active = this.isComponentActive(component);
        }

      }
    });



  }

  handleClickAddImage = () => {
    // this.showImageSetting = true;
    const url = window.prompt('Input image url');
    if (url)
      this.insertImage(url, 500, 500);


  }

  toggleFormat(format: any) {
    if (!this.isFormatActive(format)) {


      this.addFormat(format);
    } else {
      this.removeFormat(format);
    }

    this._contentChanged();
  }

  isFormatActive(format: any): boolean {
    const selection = document.getSelection();

    if (format == 'heading1') {
      return (this._isChildOfTag(selection?.anchorNode, 'h1'));
    }
    if (format == 'heading2') {
      return (this._isChildOfTag(selection?.anchorNode, 'h2'));
    }
    if (format == 'quote') {
      return (this._isChildOfTag(selection?.anchorNode, 'blockquote'));
    }
    if (format == 'code') {
      return this._checkInlineTag('code');
    }




    return document.queryCommandState(format);


  }

  addFormat(format: any, value?: string) {

    switch (format) {
      case "heading1":
        document.execCommand('formatBlock', false, 'h1');
        break;
      case "heading2":
        document.execCommand('formatBlock', false, 'h2');
        break;
      case "code":
        this._wrapTag('code', ['rte-code']);
        // document.execCommand('formatBlock', false, 'pre');
        break;
      case "quote":
        document.execCommand('formatBlock', false, 'blockquote');

        break;
      case "numbered-list":
        document.execCommand('insertUnorderedList');

        break;
      case "ordered-list":
        document.execCommand('insertOrderedList');

        break;


      default:
        document.execCommand(format);
        break;
    }

  }

  removeFormat(format: any) {
    const selection = document.getSelection();

    switch (format) {
      case "heading1":
        selection?.anchorNode && this._untagParent(selection?.anchorNode, 'h1');
        break;
      case "heading2":
        selection?.anchorNode && this._untagParent(selection?.anchorNode, 'h2');
        break;
      case "quote":
        selection?.anchorNode && this._untagParent(selection?.anchorNode, 'blockquote');
        break;
      case "code":
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

      this._contentChanged();

    }
  }

  toggleComponent(componentName: Type<Component>) {
    if (!this.isComponentActive(componentName)) {
      this.insertComponent(componentName);

    } else {
      this.removeComponent(componentName);
    }

    this._contentChanged();

  }

  insertComponent(componentName: Type<Component>) {

    const selection = window.getSelection();

    if (selection && selection.anchorNode) {

      const componentRef = this.richTextContainer.createComponent(componentName);

      const range = selection.getRangeAt(0);

      range.insertNode(componentRef.location.nativeElement);

    }
  }

  removeComponent(componentName: Type<Component>) {

    let selector = this._getSelectorName(componentName);

    let componentNode = selector ? this._findParentWithTag(this._getSelectedNode(), selector) : undefined;

    if (componentNode && componentNode instanceof HTMLElement) {



      let componentElement: HTMLElement = componentNode;

      const cdkContents = componentElement.querySelector('[cdkContent]')?.cloneNode(true);

      if (cdkContents)
        componentElement.replaceWith(...Array.from(cdkContents.childNodes));
      else
        componentElement.remove();

    }
  }

  isComponentActive(componentName: Type<Component>): boolean {
    let selectorName = this._getSelectorName(componentName);
    return selectorName ? this._isChildOfTag(this._getSelectedNode(), selectorName) : false;
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
        this.updateToolbar();

        let quickToolbar = this.quickToolbarElement.nativeElement;

        quickToolbar.classList.toggle('rte-show', true);
        const PADDING = 10;
        const range = currentSelection.getRangeAt(0);
        let selectedRect = range.getBoundingClientRect();

        const editorRect = this.richText.nativeElement.getBoundingClientRect();
        const toolbarRect = this.quickToolbarElement.nativeElement.getBoundingClientRect();

        if (isRectEmpty(selectedRect)) {

          selectedRect = (range).getBoundingClientRect();
        }
        let newY = selectedRect.y - quickToolbar.getBoundingClientRect().height - PADDING;
        let newX = selectedRect.x + selectedRect.width / 2 - toolbarRect.width / 2;

        // if (newY < editorRect.y) {
        //   newY = selectedRect.bottom + PADDING;
        // }

        if (newX + toolbarRect.width > editorRect.right) {
          newX = editorRect.right - toolbarRect.width - PADDING;
        }



        const x = newX - this.richText.nativeElement.getBoundingClientRect().x;
        const y = newY - this.richText.nativeElement.getBoundingClientRect().y;


        quickToolbar.style.top = y + 'px';
        quickToolbar.style.left = x + 'px';

      } else {
        let quickToolbar = this.quickToolbarElement.nativeElement;
        quickToolbar.classList.toggle('rte-show', false);
      }
    }, 0);


  }

  onKeyDown = (event: KeyboardEvent) => {

    if (event.ctrlKey && event.key === 'z') {

    } else if (event.ctrlKey && event.key === 'y') {
      // event.preventDefault();
    }


    if (this.suggestionEnabled) {
      this.suggestion.onKeyDown(event);
    }
  }

  onFocusIn = () => {
    this.focus.emit();

  }

  onFocusOut() {
    this.blur.emit();

    // this.suggestion.show(false);

  }


  onValueChange = (event: Event) => {
    event = event as KeyboardEvent;


    // console.log(event.type, event);


    // const selection  = window.getSelection();
    // if (selection && selection.rangeCount > 0) {
    //   const range = selection.getRangeAt(0);

    //   const previousState : CdkSelection = {
    //     startContainerPath: this._getPathFromNode(range.startContainer),

    //   }
    // }

    if (this.suggestionEnabled)
      this.suggestion.onValueChange(event);

    this._contentChanged();
  }

  onSuggestionSelected = (event: CdkSuggestionSelect) => {
    if (this.suggestionEnabled) {
      this.suggestion.currentRange && focusElementWithRangeIfNotFocused(this.richText.nativeElement, this.suggestion.currentRange);

      this._enterSuggestion(event.item, event.triggerIndex);
    }

  }

  onDrop = (event: DragEvent) => {

    let file = event.dataTransfer?.files[0];
    let x = event.clientX;
    let y = event.clientY;
    if (file && file.type.startsWith('image/')) {
      event.preventDefault();
      event.stopPropagation();
      const range = getRangeFromPosition(x, y);

      const formData = new FormData();

      file && formData.append('photo', file, file.name);
      this.isUploading = true;

      this.http.post('http://localhost:3000/upload', formData).subscribe((response) => {
        let url = (response as { url: string }).url;
        range && focusElementWithRange(this.richText.nativeElement, range);
        range && this.insertImage(url, 500, 500);
        range && this._contentChanged();
        this.isUploading = false;

      }, error => {
        if (error) {
          console.log('error', error);
          file && loadImage(file, (dataURI: string) => {
            setTimeout(() => {
              range && focusElementWithRange(this.richText.nativeElement, range);
              range && this.insertImage(dataURI.toString(), 500, 500);
              range && this._contentChanged();
              this.isUploading = false;

            }, 10);
          });
        }
      });





    }
  }

  onDragOver = (event: Event) => {
  }

  onPaste = (event: ClipboardEvent) => {
    const fileList = event.clipboardData?.files;
    if (fileList && fileList.length > 0) {

      const pasteFile = (file: File | null) => {
        loadImage(file, (dataURI: string) => {
          this.insertImage(dataURI.toString(), 500, 500);
          this._contentChanged();
        })
      }

      for (let i = 0; i < fileList.length; i++)
        pasteFile(fileList.item(i));
    }

  }

  onToolbarItemClick(event: Event, item: ToolbarItem) {
    if (item.action == 'component') {
      if (item.payload) {
        let component: Type<Component> = item.payload;
        this.toggleComponent(component);
        item.active = this.isComponentActive(component);
      }
    } else if (item.action == 'image') {
      this.handleClickAddImage();
    }
    else {
      this.toggleFormat(item.action);
      item.active = this.isFormatActive(item.action);
    }

  }

  ngAfterContentChecked() {
    if (!this.quick_toolbar) {

      this.quick_toolbar = this.default_quick_toolbar;

      if (this.defaultToolbarItems) {
        this.toolbarItems = [];
        for (let item of this.defaultToolbarItems) {
          let itemConfig = TOOLBAR_ITEMS.filter(config => config.action == item.action);
          if (itemConfig.length == 1) {
            this.toolbarItems.push({
              action: item.action,
              icon: itemConfig[0].icon,
              active: false,
              payload: item?.payload
            });
          }

        }
        console.log('this.toolbarItems :>> ', this.toolbarItems);

      }
      console.log('this.quick_toolbar :>> ', this.quick_toolbar);
    }


  }


  constructor(
    private elementRef: ElementRef<HTMLElement>,
    private http: HttpClient,


  ) {
    this.toolbarItems = TOOLBAR_ITEMS.map(item => ({ action: item.action, icon: item.icon, active: false })).filter(item => item.action !== 'component');
  }

  ngOnInit(): void {

  }

}
