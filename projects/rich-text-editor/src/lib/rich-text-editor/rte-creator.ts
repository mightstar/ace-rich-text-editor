/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import { Injectable, Inject, NgZone, ElementRef } from '@angular/core';
import { DOCUMENT } from '@angular/common';

import { CdkRichTextEditorRef } from './rte-ref';


/**
 * Service that allows for drag-and-drop functionality to be attached to DOM elements.
 */
@Injectable({ providedIn: 'root' })
export class RTECreator {
  constructor(
    @Inject(DOCUMENT) private _document: any,
    private _ngZone: NgZone,
  ) {}

  /**
   * Turns an element into a draggable item.
   * @param element Element to which to attach the dragging functionality.
   * @param config Object used to configure the dragging behavior.
   */
  createRTE<T = any>(
    element: ElementRef<HTMLElement> | HTMLElement,
    component: T
  ): CdkRichTextEditorRef<T> {
    return new CdkRichTextEditorRef<T>(
      element,
      this._document,
      this._ngZone,
      component
    );
  }

  
}
