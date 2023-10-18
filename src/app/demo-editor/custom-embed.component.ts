import {
  Component,
  ElementRef,
  Input,
  ViewChild,
  Pipe,
  PipeTransform,
} from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

@Pipe({ name: 'safeDOM', standalone: true })
export class SafeDOMPipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}

  transform(embedContent: string) {
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

  constructor() {}

  ngAfterViewChecked() {
    // this.contentElement.nativeElement.innerHTML = this.content;
  }
}
