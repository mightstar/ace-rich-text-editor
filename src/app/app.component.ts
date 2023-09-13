
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';


import { DemoEditorComponent } from './demo-editor/demo-editor.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  imports: [ DemoEditorComponent, RouterOutlet],
  standalone: true,
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'RTE';
}
