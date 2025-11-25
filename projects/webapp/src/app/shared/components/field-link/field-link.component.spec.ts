// TypeScript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { FieldLinkComponent } from './field-link-component';

describe('FieldLinkComponent', () => {
  let component: FieldLinkComponent;
  let fixture: ComponentFixture<FieldLinkComponent>;
  let nativeEl: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FieldLinkComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(FieldLinkComponent);
    component = fixture.componentInstance;
    nativeEl = fixture.nativeElement;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should not render anchor when url is empty or null', () => {
    component.url = '';
    fixture.detectChanges();
    expect(nativeEl.querySelector('a')).toBeNull();

    component.url = null;
    fixture.detectChanges();
    expect(nativeEl.querySelector('a')).toBeNull();
  });

  it('should not render anchor for an invalid url', () => {
    component.url = 'not-a-valid-url';
    fixture.detectChanges();
    expect(nativeEl.querySelector('a')).toBeNull();
  });

  it('should render anchor when url is valid and set attributes', () => {
    const testUrl = 'https://example.com/path?query=1';
    component.url = testUrl;
    fixture.detectChanges();

    const anchor = nativeEl.querySelector('a') as HTMLAnchorElement | null;
    expect(anchor).not.toBeNull();
    expect(anchor!.getAttribute('href')).toBe(testUrl);
    expect(anchor!.getAttribute('target')).toBe('_blank');
    expect(anchor!.getAttribute('rel')).toContain('noopener');
    expect(anchor!.getAttribute('rel')).toContain('noreferrer');
  });

  it('should use default title when not provided', () => {
    component.url = 'https://example.com';
    component.title = undefined as unknown as string; // explicit undefined
    fixture.detectChanges();

    const anchor = nativeEl.querySelector('a') as HTMLAnchorElement | null;
    expect(anchor).not.toBeNull();
    expect(anchor!.getAttribute('title')).toBe('Validate link');
  });

  it('should use provided title input', () => {
    component.url = 'https://example.com';
    component.title = 'Open docs';
    fixture.detectChanges();

    const anchor = nativeEl.querySelector('a') as HTMLAnchorElement | null;
    expect(anchor).not.toBeNull();
    expect(anchor!.getAttribute('title')).toBe('Open docs');
  });

  it('should render the icon inside the anchor when url is valid', () => {
    component.url = 'https://example.com';
    fixture.detectChanges();

    const icon = fixture.debugElement.query(By.css('a i.bi-arrow-right'));
    expect(icon).not.toBeNull();
  });
});
