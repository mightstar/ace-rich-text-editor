import type { CdkRichTextEditor } from './directives/rte';

export interface Command {
  format: string;
}

export interface CdkEditorSelect<T = any> {
  command: Command;
}
