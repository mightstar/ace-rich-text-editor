import { DOCUMENT } from '@angular/common';
import {
  AfterViewInit,
  Directive,
  ElementRef,
  EventEmitter,
  Inject,
  Input,
  NgZone,
  OnDestroy,
  Output,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { Subject } from 'rxjs';
import { take, takeUntil } from 'rxjs/operators';

import { CDK_RTE_PARENT } from '../rte-parents';
import { CdkRichTextEditorRef } from '../rte-ref';
import { CdkEditorSelect } from '../rte-event';
import { RTECreator } from '../rte-creator';

const RTE_HOST_CLASS = 'cdk-text-editor';

/**
 * Injection token that can be used to reference instances of `CdkDropList`. It serves as
 * alternative token to the actual `CdkDropList` class which could cause unnecessary
 * retention of the class and its directive metadata.
 */
// export const CDK_RTE_LIST = new InjectionToken<CdkDropList>('CdkDropList');

/** Element that can be moved inside a CdkDropList container. */
@Directive({
  selector: '[cdkTextEditor]',
  exportAs: 'cdkTextEditor',
  standalone: true,
  host: {
    class: RTE_HOST_CLASS,
  },
  providers: [{ provide: CDK_RTE_PARENT, useExisting: CdkRichTextEditor }],
})
export class CdkRichTextEditor implements AfterViewInit, OnChanges, OnDestroy {
  private readonly _destroyed = new Subject<void>();

  /** Reference to the underlying drag instance. */
  _rteRef: CdkRichTextEditorRef<CdkRichTextEditor>;

  // /** Template for placeholder element rendered to show where a draggable would be dropped. */
  // @ContentChild(CDK_DRAG_PLACEHOLDER) _placeholderTemplate: CdkRichTextEditorPlaceholder;

  /** Arbitrary data to attach to this drag instance. */
  @Input('cdkRichTextEditorData') content: string = '';

  /**
   * Node or selector that will be used to determine the element to which the draggable's
   * position will be constrained. If a string is passed in, it'll be used as a selector that
   * will be matched starting from the element's parent and going up the DOM until a match
   * has been found.
   */
  @Input('cdkRichTextEditorHoverMenu') hoverMenuElement:
    | string
    | ElementRef<HTMLElement>
    | HTMLElement = document.createElement('div');

  /** Emits when the user drops the item inside a container. */
  @Output('cdkRichTextEditorSelected')
  readonly selected: EventEmitter<CdkEditorSelect<any>> = new EventEmitter<CdkEditorSelect<any>>();

  constructor(
    /** Element that the draggable is attached to. */
    element: ElementRef<HTMLElement>,

    /**
     * @deprecated `_document` parameter no longer being used and will be removed.
     * @breaking-change 12.0.0
     */
    @Inject(DOCUMENT) _document: any,
    private _ngZone: NgZone,
    rteCreator: RTECreator
  ) {
    this._rteRef = rteCreator.createRTE(element, this);

    // We have to keep track of the drag instances in order to be able to match an element to
    // a drag instance. We can't go through the global registry of `DragRef`, because the root
    // element could be different.

    this._syncInputs(this._rteRef);
    this._handleEvents(this._rteRef);
  }

  /** Returns the root draggable element. */
  getHoverMenuElement(): HTMLElement {
    return this._rteRef.getHoverMenuElement();
  }

  ngAfterViewInit() {
    // Normally this isn't in the zone, but it can cause major performance regressions for apps
    // using `zone-patch-rxjs` because it'll trigger a change detection when it unsubscribes.
    this._ngZone.runOutsideAngular(() => {
      // We need to wait for the zone to stabilize, in order for the reference
      // element to be in the proper place in the DOM. This is mostly relevant
      // for draggable elements inside portals since they get stamped out in
      // their original DOM position and then they get transferred to the portal.
      this._ngZone.onStable
        .pipe(take(1), takeUntil(this._destroyed))
        .subscribe(() => {
          this._updateHoverMenuElement();
        });
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    // const rootSelectorChange = changes['rootElementSelector'];
    // const positionChange = changes['freeDragPosition'];
    // // We don't have to react to the first change since it's being
    // // handled in `ngAfterViewInit` where it needs to be deferred.
    // if (rootSelectorChange && !rootSelectorChange.firstChange) {
    //   this._updateHoverMenuElement();
    // }
  }

  ngOnDestroy() {
    // Unnecessary in most cases, but used to avoid extra change detections with `zone-paths-rxjs`.
    this._ngZone.runOutsideAngular(() => {
      this._destroyed.next();
      this._destroyed.complete();
      this._rteRef.dispose();
    });
  }

  /** Syncs the root element with the `DragRef`. */
  private _updateHoverMenuElement() {}

  /** Syncs the inputs of the CdkRichTextEditor with the options of the underlying DragRef. */
  private _syncInputs(ref: CdkRichTextEditorRef<CdkRichTextEditor>) {}

  /** Handles the events from the underlying `DragRef`. */
  private _handleEvents(ref: CdkRichTextEditorRef<CdkRichTextEditor>) {
    ref.selected.subscribe((selectEvent) => {
      this.selected.emit({
        command: {
          format: 'heading-two',
        },
      });
    });
  }

  /** Assigns the default input values based on a provided config object. */
  private _assignDefaults(config: any) {}
}
