import { TemplateRef } from "@angular/core";

export type CdkEditAction = "heading1" | "heading2" | "heading3" | "heading4" | "heading5" | "quote" | "component" | "image" | "bold" | "italic" | "underline" | "code" | "ordered-list" | "numbered-list";

export interface CdkToolbarItemSetting {
  action: CdkEditAction;
  payload?: any;
}

export interface CdkSuggestionSetting {
  trigger: string;
  tag: string;
  itemTemplate: TemplateRef<any>;
  selectionTemplate: TemplateRef<any>;
  queryFilter?: (query: string, item: CdkSuggestionItem) => boolean,
  data: CdkSuggestionItem[];
}

export interface CdkSuggestionItem {
  key: string,
  value: any,
  search?: string
}

export interface CdkSuggestionSelect {
  event: Event,
  item: CdkSuggestionItem,
  triggerIndex: number
}