import { Type, Component, QueryList, Injector, ElementRef, ViewChild, ContentChild, ContentChildren, Input, TemplateRef, Output, EventEmitter, ViewContainerRef, ComponentFactoryResolver, createComponent } from '@angular/core';
import { CommonModule } from '@angular/common';



@Component({
  selector: 'rte-root',
  templateUrl: './rte.component.html',
  styleUrls: ['./rte.component.scss'],
  imports: [CommonModule],
  standalone: true
})
export class CdkRichTextEditorComponent {


  //Get div element to pass content to input
  @ViewChild('richText') richText!: ElementRef<HTMLElement>;
  @ViewChild('richText', { read: ViewContainerRef }) richTextContainer!: ViewContainerRef;
  @ViewChild('quickToolbar') quickToolbar!: ElementRef<HTMLElement>;
  @ViewChild('seggestionBox') suggestionBox!: ElementRef<HTMLElement>;
  // @ViewChild('cdkContent', { read: ViewContainerRef }) container!: ViewContainerRef;

  @Input('cdkQuickToolbar') quick_toolbar!: TemplateRef<any>;
  @Output('cdkEditorSelectionChanged') selectionChanged = new EventEmitter<Selection>();

  @ContentChildren('*') contents!: QueryList<ElementRef>;

  isSeggestionVisible: boolean = false;



  private _mapTagToComponent = new Map<string, Type<Component>>();


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

      cdkContents && componentElement.replaceWith(...Array.from(cdkContents.childNodes));


    }
  }

  isActiveComponent(componentName: Type<Component>): boolean {

    return this._isChildOfTag(this._getSelectedNode(), this._getSelectorName(componentName));
  }

  suggestionEnabled = true;

  onMouseDown = (event: MouseEvent) => {

    this._showSuggestion(false);

    // create the component factory

    // pass some data to the component
    // componentRef.instance.index = this._counter++;
    // const dynamicComponentFactory = this.componentFactoryResolver.resolveComponentFactory(DynamicComponent);
    // const dynamicComponentRef = createComponent(DynamicComponent, {hostElement: this.richText.nativeElement, environmentInjector: this.injector})
    // // dynamicComponentRef.instance = this.cdkContent.nativeElement.innerHTML;
    // 
    // // this.richText.nativeElement.appendChild(dynamicComponentRef.instance)
    // 


    // this.previousSelection = window.getSelection();
  }

  onMouseUp = (event: MouseEvent) => {

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
  private _isSuggestionVisible = () => {
    return this.suggestionEnabled && this.isSeggestionVisible;
  }

  private _showSuggestion = (visible: boolean) => {
    console.log("_showSuggestion", visible);
    if (!this.suggestionEnabled)
      return;

    if (!visible) {
      this.isSeggestionVisible = visible;
      this.suggestionBox.nativeElement.classList.toggle('show', false);
      return;
    }


    const selection = window.getSelection();
    if (selection) {
      if (selection.isCollapsed) {
        this.suggestionKeySelected = "";

        this.isSeggestionVisible = visible;

        const rect = selection.getRangeAt(0).getBoundingClientRect();
        const editorRect = this.richText.nativeElement.getBoundingClientRect();
        console.log('rect', rect);

        this.suggestionBox.nativeElement.style.top = "" + (rect.bottom - editorRect.top) + "px";
        this.suggestionBox.nativeElement.style.left = "" + (rect.right - editorRect.x) + "px";
        this.suggestionBox.nativeElement.classList.toggle('show', true);

      }
    }
  }

  suggestions = [
    { key: "hello", value: "Hello World" },
    { key: "student", value: "student" },
    { key: "love", value: "love" },
    { key: "name", value: "name" },
  ];

  suggestionKeySelected: string = "";

  onKeyDown = (event: KeyboardEvent) => {

    
    if (event.key == '@') {
      this._showSuggestion(true);
    }

    if (event.key == 'ArrowLeft' || event.key == 'ArrowRight') {
      if (this._isSuggestionVisible())
        this._showSuggestion(false);
    }

    if (event.key == 'ArrowDown') {
      if (this._isSuggestionVisible()) {

        event.preventDefault();

        this._moveSelected(1);
      }
    }

    if (event.key == 'ArrowUp') {
      if (this._isSuggestionVisible()) {

        event.preventDefault();

        this._moveSelected(-1);
      }
    }

    if (event.key == 'Enter') {
      if (this._isSuggestionVisible()) {
        event.preventDefault();

        this._enterSuggestion();
      }
    }






  }

  private _moveSelected = (step: number) => {
    let currentIndex = this.suggestions.findIndex((item) => { return item.key == this.suggestionKeySelected });


    let newIndex = currentIndex == -1 ? 0 : currentIndex + step;

    newIndex = (newIndex + this.suggestions.length) % this.suggestions.length;

    this.suggestionKeySelected = this.suggestions[newIndex].key; 
  }


  private _enterSuggestion = () => {

    this._showSuggestion(false);
    const currentIndex = this.suggestions.findIndex((item) => item.key == this.suggestionKeySelected);

    if (currentIndex < 0 || currentIndex >= this.suggestions.length)
    {
      return;
    }

    const selection  = window.getSelection();

    if (!selection) {
      return ;
    } else {
      const focusNode = selection.focusNode;

      if (focusNode && focusNode instanceof Text) {
        let text = focusNode.textContent;
        let startIndex = 0;
        let endIndex = startIndex;
        if (text && (startIndex = text?.slice(0, selection.focusOffset)?.lastIndexOf('@')) >= 0 ) {
          
          text = text.slice(0,startIndex) + this.suggestions[currentIndex].value + text.slice(selection.focusOffset);
          endIndex = startIndex + this.suggestions[currentIndex].value.length;
        }

        focusNode.textContent = text;

       

        const range = document.createRange();
        range.selectNodeContents(focusNode);
        range.setStart(focusNode, startIndex);
        range.setEnd(focusNode, endIndex);

        selection.removeAllRanges();
        selection.addRange(range);

        this._wrapInlineTag('b');

      }

    }


  }




  constructor(
    private elementRef: ElementRef<HTMLElement>,

    private componentFactoryResolver: ComponentFactoryResolver,

  ) { }

}
