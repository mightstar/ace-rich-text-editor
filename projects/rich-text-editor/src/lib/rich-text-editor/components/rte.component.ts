import { Component, ElementRef, ViewChild, Input, TemplateRef, Output, EventEmitter, ViewContainerRef, ComponentFactoryResolver } from '@angular/core';
import { CommonModule } from '@angular/common'
@Component({
  selector: 'rte-root',
  templateUrl: './rte.component.html',
  styleUrls: ['./rte.component.scss'],
  imports: [CommonModule],
  standalone: true
})
export class CdkRichTextEditorComponent {

  oDoc: any;

  //Get div element to pass content to input
  @ViewChild('richText') richText!: ElementRef<HTMLElement>;
  @ViewChild('quickToolbar') quickToolbar!: ElementRef<HTMLElement>;

  @Input('cdkQuickToolbar') quick_toolbar!: TemplateRef<any>;


  ngAfterViewInit() {

  }


  //Text formatting function
  //Initializing variable


  addMark(format: any) {

  }

  removeMark(format: any) {

  }

  isMarkActive(format: any): boolean {
    return false;

  }

  toggleMark(format: any) {
    this.formatDoc(format);
    if (!this.isMarkActive(format)) {
      this.addMark(format);
    } else {
      this.removeMark(format);
    }
  }


  formatDoc(cmd: any) {
    this.oDoc = document.getElementById("textBox");
    let format: string = cmd;
    if (format == 'heading-one') {
      document.execCommand('heading', false, 'h1');
    } else
      document.execCommand(cmd);
    this.oDoc?.focus();


  }
  @Output('cdkEditorSelectionChanged') selectionChanged = new EventEmitter<Selection>();

  private previousSelection!: Selection | null;



  onMouseDown(event: MouseEvent) {
    // this.previousSelection = window.getSelection();
    console.log('event', event);
  }

  onMouseUp(event: MouseEvent) {
    setTimeout(() => {
      console.log('event', event);
      const currentSelection = window.getSelection();

      console.log('currentSelection', currentSelection?.toString());

      if (currentSelection && currentSelection?.toString() != '') {
        let quickToolbar = this.quickToolbar.nativeElement;
        quickToolbar.style.opacity = '1';
        quickToolbar.style.zIndex = "10";
        const x = event.clientX - this.richText.nativeElement.getBoundingClientRect().x;
        const y = event.clientY- this.richText.nativeElement.getBoundingClientRect().y;
        quickToolbar.style.top = y + 'px';
        quickToolbar.style.left = x + 'px';

        console.log('quickToolbar', quickToolbar);
      } else {
        // this.quickToolbar.nativeElement.style.opacity = '0';
        let quickToolbar = this.quickToolbar.nativeElement;
        quickToolbar.style.opacity = '0';
        quickToolbar.style.zIndex = "-1";


      }
      if (currentSelection !== this.previousSelection) {
        currentSelection && this.selectionChanged.emit(currentSelection);
        this.previousSelection = currentSelection;
      }
    }, 10);

  }
  onSelect(event: any) {
    const selectedText = window.getSelection()?.toString();
    console.log(selectedText);
  }
  constructor(
    private elementRef: ElementRef<HTMLElement>,
    private viewContainerRef: ViewContainerRef,
    private componentFactoryResolver: ComponentFactoryResolver
  ) { }

}
