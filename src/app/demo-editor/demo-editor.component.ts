import { Component, ViewChild, TemplateRef, OnInit, ElementRef, HostListener, ViewContainerRef, ComponentFactoryResolver } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkRichTextEditor } from 'projects/rich-text-editor/src/lib/rich-text-editor';
import { CdkRichTextEditorComponent } from 'projects/rich-text-editor/src/lib/rich-text-editor/components/rte.component';
import { DemoButtonComponent } from './demo-button.component';
export enum MarkTypes {
  bold = 'bold',
  italic = 'italic',
  underline = 'underline',
  strike = 'strikeThrough',
  code = 'code-line'
}

const LIST_TYPES = ['numbered-list', 'bulleted-list'];


@Component({
  selector: 'app-demo-editor',
  templateUrl: './demo-editor.component.html',
  imports: [CdkRichTextEditorComponent, DemoButtonComponent, CommonModule],
  styleUrls: ['./demo-editor.component.scss'],
  standalone: true
})
export class DemoEditorComponent {
  @ViewChild('quick_toolbar', { read: TemplateRef, static: true })
  quick_toolbar!: TemplateRef<any>;

  @ViewChild('editor', { read: CdkRichTextEditorComponent, static: true })
  editor!: CdkRichTextEditorComponent;

  toggleMark = (format: any) => {
    this.editor.toggleMark(format);
    this.updateToolbar();
  };

  isMarkActive = (format: any) => {
    let isActive = this.editor.isMarkActive(format);
    return isActive;
  };

  selectionChanged(event: Selection) {
    this.updateToolbar();
  }

  updateToolbar() {
    this.toolbarItems.forEach(item => {
      item.active = this.isMarkActive(item.format);
    });
  }

  toolbarItems = [
    {
      format: MarkTypes.bold,
      icon: 'format_bold',
      active: false,
      action: this.toggleMark
    },
    {
      format: MarkTypes.italic,
      icon: 'format_italic',
      active: false,
      action: this.toggleMark
    },
    {
      format: MarkTypes.underline,
      icon: 'format_underlined',
      active: false,
      action: this.toggleMark
    },
    {
      format: MarkTypes.code,
      icon: 'code',
      active: false,
      action: this.toggleMark
    },
    {
      format: 'heading-one',
      icon: 'looks_one',
      active: false,
      action: this.toggleMark
    },
    {
      format: 'heading-two',
      icon: 'looks_two',
      active: false,
      action: this.toggleMark
    },
    {
      format: 'blockquote',
      icon: 'format_quote', 
      active: false,
      action: this.toggleMark
    },
    {
      format: 'numbered-list',
      icon: 'format_list_numbered',
      active: false,
      action: this.toggleMark
    },
    {
      format: 'bulleted-list',
      icon: 'format_list_bulleted',
      active: false,
      action: this.toggleMark
    }
  ];




}
