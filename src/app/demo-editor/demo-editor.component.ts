import { Component, ViewChild, ViewEncapsulation, TemplateRef, OnInit, ElementRef, HostListener, ViewContainerRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkEditAction, CdkRichTextEditorComponent, CdkSuggestionSetting, CdkToolbarItemSetting } from 'projects/rich-text-editor/src/lib/rich-text-editor/components/rte.component';
import { CdkSuggestionItem } from 'projects/rich-text-editor/src/lib/rich-text-editor/components/suggestion/suggestion.component';
import { HashtagComponent } from './hashtag/hashtag.component';
import { FormsModule } from '@angular/forms';
import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

import { HttpClientModule } from '@angular/common/http';
import { CustomEmbedComponent } from './custom-embed.component';
import { RichTextEditorComponent } from 'projects/rich-text-editor/src/lib/rich-text-editor.component';
export enum MarkTypes {
  bold = 'bold',
  italic = 'italic',
  underline = 'underline',
  strike = 'strikeThrough',
  code = 'code-line'
}

const LIST_TYPES = ['numbered-list', 'bulleted-list'];

@Component({
  selector: 'app-dynamic-component',
  standalone: true,
  template: `
    <span style="border: 1px solid grey">
      <b>Unusual: </b>  
      <a href="#" onClick="window.alert('hashtag');">
        <span cdkContent>
          <ng-content></ng-content>
        </span>
      </a>
    </span>
  `
})
export class UnusualInlineComponent { }

@Pipe({ name: 'SafeURL', standalone: true })
export class SafeUrlPipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {
  }

  public transform(url: string) {
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }
}

@Component({
  selector: 'app-demo-editor',
  templateUrl: './demo-editor.component.html',
  imports: [SafeUrlPipe, CdkRichTextEditorComponent, HttpClientModule, HashtagComponent, FormsModule, CommonModule, CustomEmbedComponent],
  styleUrls: ['./demo-editor.component.scss'],
  standalone: true,
  encapsulation: ViewEncapsulation.None

})
export class DemoEditorComponent {
  @ViewChild('suggestionItemTemplate', { read: TemplateRef, static: true })
  suggestionItemTemplate!: TemplateRef<any>;

  @ViewChild('suggestionSelectionTemplate', { read: TemplateRef, static: true })
  suggestionSelectionTemplate!: TemplateRef<any>;

  @ViewChild('hashtagItemTemplate', { read: TemplateRef, static: true })
  hashtagItemTemplate!: TemplateRef<any>;

  @ViewChild('hashtagSelectionTemplate', { read: TemplateRef, static: true })
  hashtagSelectionTemplate!: TemplateRef<any>;

  @ViewChild('editor', {read: CdkRichTextEditorComponent, static: true})
  editor! : CdkRichTextEditorComponent;

  onBtnClick = (action: CdkEditAction) => {

    this.editor.triggerToolbarAction({action: action});
  }

  handleContent = (content: string) => {
    console.log('content :>> ', content);
    this.embedContent = content;
  }

  preloadContent = () => {
    this.content = this.embedContent;
  }

  filter = (query: string, key: string) => {
    return key.toLowerCase().indexOf(query.toLowerCase()) != -1;
  }

  ngAfterContentChecked() {
    
    this.suggestions = [
      {
        trigger: "@",
        tag: '-@@-',
        itemTemplate: this.suggestionItemTemplate,
        selectionTemplate: this.suggestionSelectionTemplate,
        data: [{
          key: "Jane Eyre", value: "Jane Eyre"
        },
        {
          key: "William Shakespeare", value: "William Shakespeare"
        },
        {
          key: "John Smith", value: "John Smith"
        },],
        queryFilter: this.filter
      },
      {
        trigger: "#",
        tag: '-##-',
        itemTemplate: this.hashtagItemTemplate,
        selectionTemplate: this.hashtagSelectionTemplate,
        data: [{
          key: "Red", value: "Red"
        },
        {
          key: "Green", value: "Green"

        },
        {
          key: "Blue", value: "Blue"

        },],
        queryFilter: this.filter
      }
    ];
  }

  toolbarItems: CdkToolbarItemSetting[] = [
    {
      action: 'bold',
    },
    {
      action: 'italic',
    }
    ,
    {
      action: 'heading1',
    },
    {
      action: 'heading2',
    },
    {
      action: 'image',
    },
    {
      action: 'component',
      payload: UnusualInlineComponent,
    }
  ]

  suggestions: CdkSuggestionSetting[] = [

  ];

  suggestionEnabled = true;

  embedContent = "";

  content = '<div>I am -@@-"testing"-@@- loading hashtags. <span> This is  <span> span tag.</span>This element contains -##-"HASHTAG"-##- node.</span> -##-"HASHTAG"-##-I am gonna change this hashtag value to Component</div>';
}
