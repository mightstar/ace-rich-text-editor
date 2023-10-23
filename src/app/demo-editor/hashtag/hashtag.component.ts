import {
  Component,
  ElementRef,
} from '@angular/core';

@Component({
  selector: 'app-hashtag',
  templateUrl: './hashtag.component.html',
  styleUrls: ['./hashtag.component.scss'],
  standalone: true,
  imports: [],
})
export class HashtagComponent {
  constructor(private elementRef: ElementRef<HTMLElement>) {}

  handleClick(ev: MouseEvent) {
    this.elementRef.nativeElement.remove();
  }
}
