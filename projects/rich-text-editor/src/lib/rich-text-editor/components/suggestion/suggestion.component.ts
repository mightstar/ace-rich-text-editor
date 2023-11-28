
import { CommonModule } from '@angular/common';
import { Component, ElementRef, EventEmitter, Input, Output, TemplateRef, ViewChild } from '@angular/core';
import { isRectEmpty } from '../../utils/DOM';
import { CdkSuggestionSetting } from '../rte.component';


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

@Component({
    selector: 'rte-suggestion',
    templateUrl: './suggestion.component.html',
    styleUrls: ['./suggestion.component.scss'],
    imports: [CommonModule],
    standalone: true
})

export class CdkSuggestionComponent {

    @Input('getSuggestionList') getSuggestionList?: (tag: string) => Promise<CdkSuggestionSetting>;
    @Output('cdkSuggestionSelected') select = new EventEmitter<CdkSuggestionSelect>();

    @ViewChild('container') container!: ElementRef<HTMLElement>;

    itemTemplate!: TemplateRef<any>;

    suggestions: CdkSuggestionItem[] = [];

    filteredSuggestions: CdkSuggestionItem[] = [];

    triggerIndex: number = 0;

    selectedIndex: number = -1;

    isVisible: boolean = false;

    startedNode!: Node | undefined;

    startedOffset!: number;

    currentRange!: Range | undefined;

    query = "";

    filter! : (query: string, item:CdkSuggestionItem) => boolean;

    defaultFilter = (query: string, item:CdkSuggestionItem) => {
        const search = item.search || item.key
        return search.toLowerCase().indexOf(query.toLowerCase()) != -1;
    }



    private _moveSelected = (step: number): boolean => {

        let currentIndex = this.selectedIndex;

        let newIndex = currentIndex == -1 ? 0 : currentIndex + step;

        if (this.filteredSuggestions.length == 0) {

            this.selectedIndex = -1;

            return false;
        }
        newIndex = (newIndex + this.filteredSuggestions.length) % this.filteredSuggestions.length;

        this.selectedIndex = newIndex;

        const selectedChild = this.container.nativeElement.childNodes[newIndex];

        if (selectedChild && selectedChild instanceof HTMLElement) {
            let itemRect = selectedChild.getBoundingClientRect();
            let containerRect = this.container.nativeElement.getBoundingClientRect()

            if (itemRect.top < containerRect.top) {
                this.container.nativeElement.scrollBy(0, itemRect.top - containerRect.top);
            } else if (itemRect.bottom > containerRect.bottom) {
                this.container.nativeElement.scrollBy(0, itemRect.bottom - containerRect.bottom);

            }
            return true;

        } else {
            return false;
        }
    }

    private _enterSuggestion = (event: Event) => {
        if (this.selectedIndex >= 0 && this.selectedIndex < this.filteredSuggestions.length) {
            event.preventDefault();
            this.select.emit({
                event: event,
                item: this.filteredSuggestions[this.selectedIndex],
                triggerIndex: this.triggerIndex
            });
        }
    }

    private _updateQuery = () => {
        const selection = window.getSelection();
        if (selection && this.startedNode && selection.rangeCount > 0) {
            this.currentRange = selection.getRangeAt(0);

            if (selection.focusNode && this.startedNode && selection.focusNode == this.startedNode) {
                if (selection.focusOffset >= this.startedOffset) {
                    const text = (selection.focusNode as Text).textContent;
                    if (text) {

                        this.query = text.slice(this.startedOffset, selection.focusOffset);
                        this.filterItems(this.query);

                        (this.filteredSuggestions)
                        this.selectedIndex = 0;
                        return;
                    }
                }
            }
        }

        if (this.isVisible) {
            this.show(false);
        }
    }

    filterItems = (query: string) => {
        this.filteredSuggestions = this.suggestions.filter((item) => this.filter(query, item));
    }

    show = (visible: boolean) => {
        this.isVisible = visible;
        if (!visible) {
            this.container.nativeElement.classList.toggle('rte-show', false);
            this.query = "";
            this.startedNode = undefined;
            this.startedOffset = -1;
            this.currentRange = undefined;
            this.selectedIndex = -1;
            return;
        }

        const selection = window.getSelection();

        if (selection) {
            if (selection.isCollapsed && selection.rangeCount > 0) {
                if (this.startedNode == undefined) {
                    this.startedNode = selection.getRangeAt(0).endContainer;
                    this.startedOffset = selection.getRangeAt(0).endOffset;
                }

                this.currentRange = selection.getRangeAt(0);

                let rect = selection.getRangeAt(0).getBoundingClientRect();
                if (isRectEmpty(rect)) {
                    rect = (selection.getRangeAt(0).startContainer as Element).getBoundingClientRect();
                }

                const editorRect = this.container.nativeElement.parentElement?.getBoundingClientRect();
                if (editorRect) {
                    this.container.nativeElement.style.top = "" + (rect.bottom - editorRect.top) + "px";
                    this.container.nativeElement.style.left = "" + (rect.right - editorRect.x) + "px";
                    this.container.nativeElement.classList.toggle('rte-show', true);
                }
            }
        }
    }

    onKeyDown = (event: KeyboardEvent) => {

        if (event.key == 'Escape')
            return this.show(false);

        if (event.key == 'ArrowDown') {
            if (this.isVisible) {
                if (this._moveSelected(1))
                    event.preventDefault();
                return;
            }
        }

        if (event.key == 'ArrowUp') {
            if (this.isVisible) {
                if (this._moveSelected(-1))
                    event.preventDefault();
                return;
            }
        }

        if (event.key == 'Enter') {
            if (this.isVisible) {

                this._enterSuggestion(event);

                return;
            }
        }

        if (event.key == 'ArrowLeft' || event.key == 'ArrowRight') {
            if (this.isVisible)
                setTimeout(() => this._updateQuery(), 0);
        }

    }

    onClick(event: MouseEvent, clickedItem: CdkSuggestionItem) {
        if (!this.isVisible)
            return;

        this.selectedIndex = this.filteredSuggestions.findIndex((item) => item.key == clickedItem.key);

        this._enterSuggestion(event);
    }

    onMouseDown(event: MouseEvent) {
        if (!this.isVisible)
            return;
        const rect = this.container.nativeElement.getBoundingClientRect();

        if (!(event.x >= rect.left &&
            event.x <= rect.right &&
            event.y >= rect.top &&
            event.y <= rect.bottom))
            this.show(false);
    }


    setTrigger = (suggestion: CdkSuggestionSetting) => {
        this.itemTemplate = suggestion.itemTemplate;
        this.filter = suggestion.queryFilter ?? this.defaultFilter;

        console.log('this.filter :>> ', this.filter);
        this.suggestions = suggestion.data;
        this.filterItems("");
        this.selectedIndex = 0;
    }

    onValueChange = (event: Event) => {
        let ev = event as InputEvent;
        if (ev.data && (this.isVisible === false || this.isVisible && this.filteredSuggestions.length == 0)) {
            this.getSuggestionList && this.getSuggestionList(ev.data).then(suggestion => {
              this.show(false);
              this.setTrigger(suggestion);
              return this.show(true);
            }).catch(reason =>{
              console.log(reason);
            })
        }
        if (this.isVisible) {
            this._updateQuery();
        }
    }

}
