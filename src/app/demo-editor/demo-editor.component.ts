import { Component, ViewChild, ViewEncapsulation, TemplateRef, OnInit, ElementRef, HostListener, ViewContainerRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkRichTextEditorComponent, CdkSuggestionSetting, CdkToolbarItemSetting } from 'projects/rich-text-editor/src/lib/rich-text-editor/components/rte.component';
import { CdkSuggestionItem } from 'projects/rich-text-editor/src/lib/rich-text-editor/components/suggestion.component';
import { HashtagComponent } from './hashtag/hashtag.component';
import { FormsModule } from '@angular/forms';
import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

import { HttpClientModule } from '@angular/common/http';
import { CustomEmbedComponent } from './custom-embed.component';
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
  imports: [SafeUrlPipe, CdkRichTextEditorComponent, HttpClientModule, HashtagComponent, UnusualInlineComponent, FormsModule, CommonModule, CustomEmbedComponent],
  styleUrls: ['./demo-editor.component.scss'],
  standalone: true,
  encapsulation: ViewEncapsulation.None

})
export class DemoEditorComponent {
  // @ViewChild('quick_toolbar', { read: TemplateRef, static: true })
  // quick_toolbar!: TemplateRef<any>;

  @ViewChild('suggestionItemTemplate', { read: TemplateRef, static: true })
  suggestionItemTemplate!: TemplateRef<any>;

  @ViewChild('suggestionInputTemplate', { read: TemplateRef, static: true })
  suggestionInputTemplate!: TemplateRef<any>;

  @ViewChild('hashtagItemTemplate', { read: TemplateRef, static: true })
  hashtagItemTemplate!: TemplateRef<any>;

  @ViewChild('hashtagInputTemplate', { read: TemplateRef, static: true })
  hashtagInputTemplate!: TemplateRef<any>;




  handleContent = (content: string) => {

    this.embedContent = content;
  }


  filter = (query: string, key: string) => {
    return key.toLowerCase().indexOf(query.toLowerCase()) != -1;
  }

  ngAfterContentChecked() {
    this.suggestions = [
      {
        trigger: "@",
        itemTemplate: this.suggestionItemTemplate,
        inputTemplate: this.suggestionInputTemplate,
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
        itemTemplate: this.hashtagItemTemplate,
        inputTemplate: this.hashtagInputTemplate,
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
}
