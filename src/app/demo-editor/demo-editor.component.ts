import { Component, ViewChild, TemplateRef, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import {
  FormBuilder,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { HttpClientModule } from "@angular/common/http";

import { uploadFile } from "@uploadcare/upload-client";

import { HashtagComponent } from "./hashtag/hashtag.component";
import { CdkRichTextEditorComponent } from "projects/rich-text-editor/src/lib/rich-text-editor/components/rte.component";
import {
  CdkEditAction,
  CdkSuggestionItem,
  CdkSuggestionSetting,
  CdkToolbarItemSetting,
  IUploadReq,
  IIMageRes,
} from "projects/rich-text-editor/src/lib/rich-text-editor/interfaces";

export enum MarkTypes {
  bold = "bold",
  italic = "italic",
  underline = "underline",
  strike = "strikeThrough",
  code = "code-line",
}

const LIST_TYPES = ["numbered-list", "bulleted-list"];

// A work-in-progress to allow any custom inline-element into the RTE
// we've been calling them Unusual-Inline-Components
@Component({
  selector: "app-dynamic-component",
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
  `,
})
export class UnusualInlineComponent {}

@Component({
  selector: "app-demo-editor",
  templateUrl: "./demo-editor.component.html",
  styleUrls: ["./demo-editor.component.scss"],
  imports: [
    ReactiveFormsModule,
    CdkRichTextEditorComponent,
    HttpClientModule,
    HashtagComponent,
    FormsModule,
    CommonModule,
  ],
  standalone: true,
})
export class DemoEditorComponent implements OnInit {
  @ViewChild("suggestionItemTemplate", { read: TemplateRef, static: true })
  suggestionItemTemplate!: TemplateRef<any>;
  @ViewChild("suggestionSelectionTemplate", { read: TemplateRef, static: true })
  suggestionSelectionTemplate!: TemplateRef<any>;
  @ViewChild("hashtagItemTemplate", { read: TemplateRef, static: true })
  hashtagItemTemplate!: TemplateRef<any>;
  @ViewChild("hashtagSelectionTemplate", { read: TemplateRef, static: true })
  hashtagSelectionTemplate!: TemplateRef<any>;
  @ViewChild("editor", { read: CdkRichTextEditorComponent, static: true })
  editor!: CdkRichTextEditorComponent;
  // hashtag search results
  hashtagResults: CdkSuggestionItem[] = [];
  // media uploaded and returned
  uploadImageResult: IIMageRes = { url: "", elem: { src: "" } };
  // the RTE formControl
  content = this.formBuilder.control(
    { value: "This is a test", disabled: false },
    [Validators.required]
  );
  // suggestion dropdown (hashtags / usernames)
  suggestions: CdkSuggestionSetting[] = [];
  suggestionEnabled = true;
  //
  toolbarItems: CdkToolbarItemSetting[] = [
    {
      action: "bold",
    },
    {
      action: "italic",
    },
    {
      action: "heading1",
    },
    {
      action: "heading2",
    },
    {
      action: "image",
    },
    {
      action: "component",
      // payload: UnusualInlineComponent,
    },
  ];
  embedContent = "";

  constructor(private formBuilder: FormBuilder) {}

  ngOnInit(): void {}

  ngAfterContentChecked() {
    // IMPORTANT! See readme. Hashtags are formatted to be saved in a database
    this.suggestions = [
      {
        trigger: "@",
        tag: "-@@-",
        itemTemplate: this.suggestionItemTemplate,
        selectionTemplate: this.suggestionSelectionTemplate,
        data: [
          {
            key: "Jane Eyre",
            value: "Jane Eyre",
          },
          {
            key: "William Shakespeare",
            value: "William Shakespeare",
          },
          {
            key: "John Smith",
            value: "John Smith",
          },
        ],
      },
      {
        trigger: "#",
        tag: "-##-",
        itemTemplate: this.hashtagItemTemplate,
        selectionTemplate: this.hashtagSelectionTemplate,
        data: [
          {
            key: "Red",
            value: "Red",
          },
          {
            key: "Green",
            value: "Green",
          },
          {
            key: "Blue",
            value: "Blue",
          },
        ],
      },
    ];
  }

  // mock upload request - you will use your app's CDN
  uploadImageRequest($uploadReq: IUploadReq): void {
    uploadFile($uploadReq.file, {
      publicKey: "54008102efbf320823b0",
      store: "auto",
    })
      .then((result: any) => {
        if (result?.cdnUrl && result?.name) {
          $uploadReq.elem.src = result.cdnUrl + result.name;
          // your image CDN response may be different but ultimately needs to be an IIMageRes
          this.uploadImageResult = {
            url: result.cdnUrl,
            elem: { src: result.cdnUrl + result.name },
          };
        }
      })
      .catch((error: any) => console.log(error));
  }

  // mock hashtag search request - you will use your app's hashtag API
  hashtagSearch(term: string): void {
    this.hashtagResults = [
      {
        key: "Red",
        value: "Red",
      },
      {
        key: "Green",
        value: "Green",
      },
      {
        key: "Blue",
        value: "Blue",
      },
    ];
  }

  // the quick toolbar need improvement
  onBtnClick = (action: CdkEditAction) => {
    this.editor.triggerToolbarAction({ action: action });
  };

  toggleDisabled(): void {
    if (this.content.enabled) {
      this.content.disable();
    } else {
      this.content.enable();
    }
  }

  handleContent = (content: string) => {
    console.log("content :>> ", content);
    // this.embedContent = content;
  };

  // not sure what this was meant to be
  preloadContent = () => {};

  filter = (query: string, key: string) => {
    return key.toLowerCase().indexOf(query.toLowerCase()) != -1;
  };

  useLinks = (links: any): void => {
    console.log(links);
  };

  getCount = (count: number): void => {
    console.log("count: ", count);
  };
}
