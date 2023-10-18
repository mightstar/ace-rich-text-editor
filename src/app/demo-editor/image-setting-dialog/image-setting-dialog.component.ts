import {
  Component,
  ElementRef,
  EventEmitter,
  Output,
  Renderer2,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
export interface ImageSettingInfo {
  event: MouseEvent;
  action: string;
  setting?: {
    url: string;
    width: number;
    height: number;
  };
}

@Component({
  selector: 'image-setting-dialog',
  templateUrl: './image-setting-dialog.component.html',
  styleUrls: ['./image-setting-dialog.component.scss'],
  standalone: true,
  imports: [FormsModule],
})
export class ImageSettingDialog {
  @Output('btnClicked') onButtonClick: EventEmitter<ImageSettingInfo> = new EventEmitter();

  url: string = '';
  width: number = 500;
  height: number = 500;
  handleClick(ev: MouseEvent, action: string) {
    ev.preventDefault();
    const settingInfo: ImageSettingInfo = { event: ev, action };
    if (action == 'add') {
      settingInfo.setting = {
        url: this.url,
        width: this.width,
        height: this.height,
      };
    }

    this.onButtonClick.emit(settingInfo);
  }
}
