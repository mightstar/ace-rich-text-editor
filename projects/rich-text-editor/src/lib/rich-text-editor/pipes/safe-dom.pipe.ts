import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

@Pipe({
  name: 'safeDOMPipe', 
  standalone: true 
})
export class SafeDOMPipe implements PipeTransform {

  constructor(private sanitizer: DomSanitizer) {}

  transform(embedContent: string) {
    return this.sanitizer.bypassSecurityTrustHtml(embedContent);
  }
}