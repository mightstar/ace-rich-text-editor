import { Component, ViewChild, TemplateRef, OnInit, ElementRef, HostListener,ViewContainerRef, ComponentFactoryResolver } from '@angular/core';
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


  toggleBlock = (format: any) => {
    const isActive = this.isBlockActive(format);
    const isList = LIST_TYPES.includes(format);

  };


  toggleMark = (format: any) => {
    console.log(format);
    this.editor.toggleMark(format);
  };

  isBlockActive = (format: any) => {
    return false;
  };

  isMarkActive = (format: any) => {
    return this.editor.isMarkActive(format);
  };

  selectionChanged(event : Selection) {
    console.log("selectionChanged" , event);
  }

  toolbarItems = [
    {
      format: MarkTypes.bold,
      icon: 'format_bold',
      active: this.isMarkActive,
      action: this.toggleMark
    },
    {
      format: MarkTypes.italic,
      icon: 'format_italic',
      active: this.isMarkActive,
      action: this.toggleMark
    },
    {
      format: MarkTypes.underline,
      icon: 'format_underlined',
      active: this.isMarkActive,
      action: this.toggleMark
    },
    {
      format: MarkTypes.code,
      icon: 'code',
      active: this.isMarkActive,
      action: this.toggleMark
    },
    {
      format: 'heading-one',
      icon: 'looks_one',
      active: this.isBlockActive,
      action: this.toggleMark
    },
    {
      format: 'heading-two',
      icon: 'looks_two',
      active: this.isBlockActive,
      action: this.toggleBlock
    },
    {
      format: 'block-quote',
      icon: 'format_quote',
      active: this.isBlockActive,
      action: this.toggleBlock
    },
    {
      format: 'numbered-list',
      icon: 'format_list_numbered',
      active: this.isBlockActive,
      action: this.toggleBlock
    },
    {
      format: 'bulleted-list',
      icon: 'format_list_bulleted',
      active: this.isBlockActive,
      action: this.toggleBlock
    }
  ];



  
}
