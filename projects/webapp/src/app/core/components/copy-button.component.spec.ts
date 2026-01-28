import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CopyButtonComponent } from './copy-button.component';
import { NgbPopover } from '@ng-bootstrap/ng-bootstrap';
import { By } from '@angular/platform-browser';

describe('CopyButtonComponent', () => {
  let component: CopyButtonComponent;
  let fixture: ComponentFixture<CopyButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CopyButtonComponent, NgbPopover]
    }).compileComponents();

    fixture = TestBed.createComponent(CopyButtonComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('text', 'Test text to copy');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display copy icon by default', () => {
    const icon = fixture.debugElement.query(By.css('.bi-copy'));
    expect(icon).toBeTruthy();
  });

  it('should have default label', () => {
    const button = fixture.debugElement.query(By.css('button'));
    expect(button.nativeElement.getAttribute('title')).toBe('Copy to clipboard');
  });

  it('should use custom label when provided', () => {
    fixture.componentRef.setInput('label', 'Custom label');
    fixture.detectChanges();

    const button = fixture.debugElement.query(By.css('button'));
    expect(button.nativeElement.getAttribute('title')).toBe('Custom label');
  });

  it('should apply custom button class when provided', () => {
    fixture.componentRef.setInput('btnClass', 'custom-class');
    fixture.detectChanges();

    const button = fixture.debugElement.query(By.css('button'));
    expect(button.nativeElement.classList.contains('custom-class')).toBe(true);
  });

  it('should show check icon when copy is done', async () => {
    // Mock clipboard API
    Object.assign(navigator, {
      clipboard: {
        writeText: jest.fn().mockResolvedValue(undefined)
      }
    });

    await component.copy(new MouseEvent('click'));
    fixture.detectChanges();

    const checkIcon = fixture.debugElement.query(By.css('.bi-check'));
    expect(checkIcon).toBeTruthy();
    expect(component.showCopyDone()).toBe(true);
  });
});
