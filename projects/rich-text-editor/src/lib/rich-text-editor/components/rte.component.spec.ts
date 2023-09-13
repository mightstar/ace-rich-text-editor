import { TestBed } from '@angular/core/testing';
import { CdkRichTextEditorComponent } from './rte.component';

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [
        CdkRichTextEditorComponent
      ],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(CdkRichTextEditorComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it(`should have as title 'Angular_RichText_Demo'`, () => {
    const fixture = TestBed.createComponent(CdkRichTextEditorComponent);
    const app = fixture.componentInstance;
    expect(app.title).toEqual('Angular_RichText_Demo');
  });

  it('should render title', () => {
    const fixture = TestBed.createComponent(CdkRichTextEditorComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.content span')?.textContent).toContain('Angular_RichText_Demo app is running!');
  });
});
