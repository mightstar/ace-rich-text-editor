# RichTextEditor

Here's how we're using the editor for Recruitler.com's social media posting system

```
<!-- hashtag search dropdown -->
<ng-template #hashtagItemTemplate let-value let-active="active">
  <div class="suggestion-item" [class.selected]="active">
    <p>{{ value.name }}</p>
  </div>
</ng-template>

<!-- inline hashtags component -->
<ng-template #hashtagTemplate let-value="value">
  <lib-hashtag
    [hashtag]="value"
    contenteditable="false" />
</ng-template>

<div class="compose__editable">
  <recruitler-rte #editor
    [formControl]="content"
    [hashtagItemTemplate]="hashtagItemTemplate"
    [hashtagTemplate]="hashtagTemplate"
    [hashtagResults]="hashtagResults"
    [uploadImageResult]="uploadImageResult"
    (hashtagRequest)="hashtagSearch($event)"
    (uploadImageRequest)="onUpload($event)"
    placeholder="What's your experience?"
    (focus)="onFocus()"
    (blur)="onBlur()" />
    <p class="count" [ngClass]="{ 'warning': count < 10,  'error': count < 0 }">{{ count }}</p>
</div>
```

## Hashtag format
Our hashtag string format:
```
-##-{"id":"xxxx", "content":"existing"}-##-
```

A hashtag that does not reflect a database counterpart.
```
#nonexisting
```

### Parsing
When creating or editing existing RTE content during (POST or PATCH) your backend parser should:
 - ignore hashtags already saved in the RTE hashtag-format `-##-{...}-##-`
 - identify unidentified hashtags like `#something` these should be formatted like above
 - check your hashtag data storage for this hashtag and create a new hashtag from `#something`
 - replace `#something` in the content with the new formatted hashtag in the hashtag data format


# We need help! 
If you're using this Rich Text Editor package you likely need a code syntax highlighter.
We're working to bring Ace into the RTE package and could use some expertise!

[https://github.com/Recruitler/Rich-Text-Editor/issues/1](github.com/Recruitler/Rich-Text-Editor/issues/1)


## Code scaffolding

Run `ng generate component component-name --project rich-text-editor` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module --project rich-text-editor`.
> Note: Don't forget to add `--project rich-text-editor` or else it will be added to the default project in your `angular.json` file. 

## Build

Run `ng build rich-text-editor` to build the project. The build artifacts will be stored in the `dist/` directory.

## Publishing

After building your library with `ng build rich-text-editor`, go to the dist folder `cd dist/rich-text-editor` and run `npm publish`.

## Running unit tests

Run `ng test rich-text-editor` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI Overview and Command Reference](https://angular.io/cli) page.
