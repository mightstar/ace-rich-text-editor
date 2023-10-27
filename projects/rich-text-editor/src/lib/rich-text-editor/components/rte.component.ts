import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, ElementRef, EmbeddedViewRef, EventEmitter, Input, OnInit, Output, TemplateRef, Type, ViewChild, ViewContainerRef, ViewEncapsulation, reflectComponentType } from '@angular/core';
import { focusElementWithRange, focusElementWithRangeIfNotFocused, getRangeFromPosition, isRectEmpty } from '../utils/DOM';
import { TOOLBAR_ITEMS } from '../utils/config';
import { loadImage } from '../utils/image';
import { CircularProgressComponent } from './circular-progressive/circular-progressive.component';
import { CdkSuggestionComponent, CdkSuggestionItem, CdkSuggestionSelect } from './suggestion/suggestion.component';



interface ToolbarItem {
  action: string,
  icon: string,
  active: boolean,
  payload?: any,
}
export type CdkEditAction = "heading1" | "heading2" | "heading3" | "heading4" | "heading5" | "quote" | "component" | "image" | "bold" | "italic" | "underline" | "code" | "ordered-list" | "numbered-list";

export interface CdkToolbarItemSetting {
  action: CdkEditAction,
  payload?: any,
}

export interface CdkSuggestionSetting {
  trigger: string,
  tag: string,
  itemTemplate: TemplateRef<any>,
  selectionTemplate: TemplateRef<any>,
  queryFilter?: (query: string, key: string) => boolean,
  data: CdkSuggestionItem[]
}

@Component({
  selector: 'recruitler-rte',
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
  @ViewChild('defaultToolbar') defaultToolbar!: TemplateRef<any>;


  @Input('toolbarTemplate')
  toolbarTemplate!: TemplateRef<any>;

  @Input('cdkDefaultToolbarItems')
  defaultToolbarItems!: CdkToolbarItemSetting[];

  @Input('cdkSuggestions')
  suggestionList: CdkSuggestionSetting[] = [];

  @Input('cdkSuggestionEnabled')
  suggestionEnabled: boolean = true;

  @Input('cdkImageUploadUrl')
  imageUploadUrl!: string;

  @Input('cdkContent')
  content: string = "";

  @Output('cdkEditorSelectionChanged')
  selectionChanged = new EventEmitter<Selection>();

  @Output('cdkContentChanged')
  contentChanged = new EventEmitter<string>();

  @Output()
  focus = new EventEmitter();

  @Output()
  blur = new EventEmitter();


  isSuggestionVisible: boolean = false;

  isUploading = false;

  suggestionSelectionTemplate!: TemplateRef<any>;

  toolbarItems: ToolbarItem[] = [];



  private _wrapTag(tag: string, classLists: string[]) {

    const selection = document.getSelection();
    if (selection) {

      const range = selection.getRangeAt(0);

      // const tagTemplate = this.templates.nativeElement.querySelector(tag);
      const tagTemplate = document.createElement('code');

      classLists.forEach(item => tagTemplate?.classList.add(item));

      if (tagTemplate) {
        const element = tagTemplate.cloneNode(true);
        element.appendChild(range.extractContents());
        range.insertNode(element);
      }
    }
  }

  private _isInlineTag(tag: string): boolean {
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
    const anchorNode = selection.anchorNode;
    let element: Node | ChildNode | null = anchorNode;

    if (anchorNode instanceof Text) {
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
        const suggestion = this.suggestionList[triggerIndex];
        console.log('focusNode :>> ', focusNode);
        let text = focusNode.textContent;
        let startIndex = 0;

        if (text && (startIndex = startedOffset - 1) >= 0) {
          text = text.slice(0, startIndex) + text.slice(selection.focusOffset);
        }

        focusNode.textContent = text;
        const range = document.createRange();
        const documentFragment = document.createElement('span');
        documentFragment.setAttribute('hashtag_component', '' + suggestion.tag);
        documentFragment.setAttribute('contenteditable', 'false');

        const realHashtag = document.createElement('span');
        const viewRef: EmbeddedViewRef<Node> = suggestion.selectionTemplate.createEmbeddedView({ value: item.value });
        this.richTextContainer.insert(viewRef);
        for (let node of viewRef.rootNodes) {
          realHashtag.appendChild(node);
        }

        const hiddenHashtag = document.createElement('span');
        hiddenHashtag.setAttribute('hashtag_code', suggestion.tag);
        hiddenHashtag.style.display = "none";
        hiddenHashtag.innerHTML = `${suggestion.tag}${JSON.stringify(item.value)}${suggestion.tag}`;

        documentFragment.appendChild(realHashtag);
        documentFragment.appendChild(hiddenHashtag);

        range.selectNodeContents(focusNode);
        range.setStart(focusNode, startIndex);
        range.setEnd(focusNode, startIndex);

        selection.removeAllRanges();
        selection.addRange(range);

        range.insertNode(documentFragment);
        setTimeout(() => this._contentChanged(), 0);

        range.collapse();


      }

    }
    this.suggestion.show(false);
  }

  private _contentChanged = () => {
    const clonedTextNode = this.richText.nativeElement.cloneNode(true) as HTMLElement;
    let hashtags = clonedTextNode.querySelectorAll('span[hashtag_component]');

    for (let i = 0; i < hashtags.length; i++) {
      let hidden_tag = hashtags[i].querySelector('span[hashtag_code]');
      const code = hidden_tag ? hidden_tag.innerHTML : "";
      const span = document.createElement('span');
      span.innerHTML = code;
      hashtags[i].replaceWith(document.createTextNode(code));
    }

    this.contentChanged.emit(clonedTextNode.innerHTML);
  }

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
    if (format == 'heading3') {
      return (this._isChildOfTag(selection?.anchorNode, 'h3'));
    }
    if (format == 'heading4') {
      return (this._isChildOfTag(selection?.anchorNode, 'h4'));
    }
    if (format == 'heading5') {
      return (this._isChildOfTag(selection?.anchorNode, 'h5'));
    }
    if (format == 'quote') {
      return (this._isChildOfTag(selection?.anchorNode, 'blockquote'));
    }
    if (format == 'code') {
      return this._isInlineTag('code');
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
      case "heading3":
        document.execCommand('formatBlock', false, 'h3');
        break;
      case "heading4":
        document.execCommand('formatBlock', false, 'h4');
        break;
      case "heading5":
        document.execCommand('formatBlock', false, 'h5');
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
      case "heading3":
        selection?.anchorNode && this._untagParent(selection?.anchorNode, 'h3');
        break;
      case "heading4":
        selection?.anchorNode && this._untagParent(selection?.anchorNode, 'h4');
        break;
      case "heading5":
        selection?.anchorNode && this._untagParent(selection?.anchorNode, 'h5');
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
        document.execCommand('removeFormat', false);
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
      const componentRef = this.richTextContainer.createComponent(componentName, {
        projectableNodes: [[selection.getRangeAt(0).extractContents()]]
      });
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
  }


  onValueChange = (event: Event) => {
    event = event as KeyboardEvent;

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

      const loadDataURI = () => {
        file && loadImage(file, (dataURI: string) => {
          setTimeout(() => {
            range && focusElementWithRange(this.richText.nativeElement, range);
            range && this.insertImage(dataURI.toString(), 500, 500);
            range && this._contentChanged();
            this.isUploading = false;

          }, 10);
        });
      }

      this.isUploading = true;

      if (this.imageUploadUrl)
        this.http.post(this.imageUploadUrl, formData).subscribe((response) => {
          let url = (response as { url: string }).url;
          range && focusElementWithRange(this.richText.nativeElement, range);
          range && this.insertImage(url, 500, 500);
          range && this._contentChanged();
          this.isUploading = false;

        }, error => {
          if (error) {
            loadDataURI();
          }
        });

      else
        loadDataURI();
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

  clickToolbarItem(item: ToolbarItem) {
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

    this.updateToolbar();
  }
  triggerToolbarAction(item: CdkToolbarItemSetting) {
    if (item.action == 'component') {
      if (item.payload) {
        let component: Type<Component> = item.payload;
        this.toggleComponent(component);
      }
    } else if (item.action == 'image') {
      this.handleClickAddImage();
    }
    else {
      this.toggleFormat(item.action);
    }

    this.updateToolbar();
  }

  ngAfterContentChecked() {
    if (!this.toolbarTemplate) {

      this.toolbarTemplate = this.defaultToolbar;

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
      }
    }
  }

  ngAfterViewInit() {
    console.log('loading content');

    this.loadContent();

    console.log('loading finished');
  }

  isHashtagElement(element: Element, pattern: RegExp): boolean {




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

  findTextNodes(element: Element, pattern: string): Array<{ text: Text, index: number }> {
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

  loadContent = () => {

    console.log('this.content :>> ', this.content);
    this.richText.nativeElement.innerHTML = this.content;
    this.suggestionList.forEach(suggestion => this.filterHashtags(suggestion));


  }

  filterHashtags = (suggestion: CdkSuggestionSetting) => {

    const selection = window.getSelection();
    if (selection == null) {
      return;
    }
    let hashtag = suggestion.tag;

    const nodes: Element[] = [];
    const elements = this.richText.nativeElement.querySelectorAll('*'); // Select all elements

    const pattern = new RegExp(`${hashtag}(.*?)${hashtag}`);

    if (this.isHashtagElement(this.richText.nativeElement, pattern)) {
      nodes.push(this.richText.nativeElement);

    }
    elements.forEach(element => {
      if (this.isHashtagElement(element, pattern)) {
        nodes.push(element);
      }

    });

    for (let element of nodes) {
      let textNodes = this.findTextNodes(element, hashtag);

      for (let i = 0; i < textNodes.length; i += 2) {
        const startNode = textNodes[i].text;
        const startIndex = textNodes[i].index + hashtag.length;
        const endNode = textNodes[i + 1].text;
        const endIndex = textNodes[i + 1].index;

        const range = document.createRange();
        // range.selectNodeContents(element);
        range.setStart(startNode, startIndex);
        range.setEnd(endNode, endIndex);

        selection.removeAllRanges();
        selection.addRange(range);

        let value = selection.toString();

        const documentFragment = document.createElement('span');
        documentFragment.setAttribute('hashtag_component', '' + suggestion.tag);
        documentFragment.setAttribute('contenteditable', 'false');

        const realHashtag = document.createElement('span');

        const hiddenHashtag = document.createElement('span');
        hiddenHashtag.style.display = "none";
        hiddenHashtag.setAttribute('hashtag_code', suggestion.tag);
        hiddenHashtag.innerHTML = `${suggestion.tag}${value}${suggestion.tag}`;
        const viewRef: EmbeddedViewRef<Node> = suggestion.selectionTemplate.createEmbeddedView({ value: JSON.parse(value) });
        this.richTextContainer.insert(viewRef);

        for (let node of viewRef.rootNodes) {
          realHashtag.appendChild(node);
        }

        documentFragment.appendChild(realHashtag);
        documentFragment.appendChild(hiddenHashtag);

        range.extractContents();
        range.insertNode(documentFragment);


        textNodes = this.findTextNodes(element, hashtag);
      }

      this.findTextNodes(element, hashtag).forEach(item => item.text.textContent && (item.text.textContent = item.text.textContent?.replaceAll(hashtag, '')));
    }
    selection.removeAllRanges();
  }

  getAllHashtags() {

  }

  constructor(
    private http: HttpClient,
  ) {
    this.toolbarItems = TOOLBAR_ITEMS.map(item => ({ action: item.action, icon: item.icon, active: false })).filter(item => item.action !== 'component');
  }

  ngOnInit(): void {

  }
}
