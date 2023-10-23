import { CommonModule } from '@angular/common';
import {
    Component,
    Directive,
    ElementRef,
    EventEmitter,
    HostBinding,
    HostListener,
    Input,
    OnChanges,
    Output,
    Renderer2,
    ViewChild, Pipe, PipeTransform,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Pipe({ name: 'safeDOM', standalone: true })
export class SafeDOMPipe implements PipeTransform {
    constructor(private sanitizer: DomSanitizer) {
    }

    public transform(embedContent: string) {
        return this.sanitizer.bypassSecurityTrustHtml(embedContent);
    }
}

@Component({
    selector: 'custom-embed',
    template: '<div #content style="border: 1px solid grey" [innerHTML]="contents | safeDOM"></div>',
    imports: [SafeDOMPipe],
    standalone: true,
    
})
export class CustomEmbedComponent {

    @ViewChild('content') contentElement!: ElementRef<HTMLElement>;

    @Input('content') contents!: string;

    constructor() { }



    ngAfterViewChecked() {
        // this.contentElement.nativeElement.innerHTML = this.content;



    }


}
