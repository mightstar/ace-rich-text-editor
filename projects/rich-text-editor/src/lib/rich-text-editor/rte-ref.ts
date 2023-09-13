
import {
    EmbeddedViewRef,
    ElementRef,
    NgZone,
    ViewContainerRef,
    TemplateRef,
} from '@angular/core';
import { Subscription, Subject, Observable } from 'rxjs';
export class CdkRichTextEditorRef<T = any> {
    /**
     * content of CDKRichTextEditor
     */
    content: string;

    data: T  ;

    hoverMenuElement: HTMLElement = document.createElement('div');

    /** Emits when the user has moved the item into a new container. */
    readonly selected = new Subject<{

    }>();

    constructor(
        element: ElementRef<HTMLElement> | HTMLElement,
        private _document: Document,
        private _ngZone: NgZone,
        component: T
    ) {
        this.content = "";
        this.data = component;
        // TODO initializing reference component
    }


    getHoverMenuElement(): HTMLElement {
        return this.hoverMenuElement;
    }

    /** Removes the dragging functionality from the DOM element. */
    dispose() {
        this.selected.complete();
    }
}   