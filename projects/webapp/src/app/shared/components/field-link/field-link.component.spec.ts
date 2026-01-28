import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FieldLinkComponent } from './field-link.component';
import { By } from '@angular/platform-browser';

describe('FieldLinkComponent', () => {
  let component: FieldLinkComponent;
  let fixture: ComponentFixture<FieldLinkComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FieldLinkComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(FieldLinkComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display link for valid URL', () => {
    fixture.componentRef.setInput('url', 'https://example.com');
    fixture.detectChanges();

    const link = fixture.debugElement.query(By.css('a'));
    expect(link).toBeTruthy();
    expect(link.nativeElement.getAttribute('href')).toBe('https://example.com');
  });

  it('should not display link for invalid URL', () => {
    fixture.componentRef.setInput('url', 'invalid-url');
    fixture.detectChanges();

    const link = fixture.debugElement.query(By.css('a'));
    expect(link).toBeFalsy();
  });

  it('should not display link when url is empty', () => {
    fixture.componentRef.setInput('url', '');
    fixture.detectChanges();

    const link = fixture.debugElement.query(By.css('a'));
    expect(link).toBeFalsy();
  });

  it('should use default title', () => {
    fixture.componentRef.setInput('url', 'https://example.com');
    fixture.detectChanges();

    const link = fixture.debugElement.query(By.css('a'));
    expect(link.nativeElement.getAttribute('title')).toBe('Validate link');
  });

  it('should use custom title when provided', () => {
    fixture.componentRef.setInput('url', 'https://example.com');
    fixture.componentRef.setInput('title', 'Custom Title');
    fixture.detectChanges();

    const link = fixture.debugElement.query(By.css('a'));
    expect(link.nativeElement.getAttribute('title')).toBe('Custom Title');
  });

  it('should open link in new tab', () => {
    fixture.componentRef.setInput('url', 'https://example.com');
    fixture.detectChanges();

    const link = fixture.debugElement.query(By.css('a'));
    expect(link.nativeElement.getAttribute('target')).toBe('_blank');
    expect(link.nativeElement.getAttribute('rel')).toBe('noopener noreferrer');
  });

  it('should validate http URLs', () => {
    fixture.componentRef.setInput('url', 'http://example.com');
    fixture.detectChanges();

    const link = fixture.debugElement.query(By.css('a'));
    expect(link).toBeTruthy();
  });
});
