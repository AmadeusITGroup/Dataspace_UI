import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EmptyPageMessageComponent } from './empty-page-message.component';
import { By } from '@angular/platform-browser';

describe('EmptyPageMessageComponent', () => {
  let component: EmptyPageMessageComponent;
  let fixture: ComponentFixture<EmptyPageMessageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmptyPageMessageComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(EmptyPageMessageComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.componentRef.setInput('icon', 'bi-inbox');
    fixture.componentRef.setInput('message', 'No items found');
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should display icon and message', () => {
    fixture.componentRef.setInput('icon', 'bi-inbox');
    fixture.componentRef.setInput('message', 'No items found');
    fixture.detectChanges();

    const iconElement = fixture.debugElement.query(By.css('i'));
    const messageElements = fixture.debugElement.queryAll(By.css('span'));
    const messageElement = messageElements.find(
      (el) => el.nativeElement.textContent.trim() === 'No items found'
    );

    expect(iconElement.nativeElement.classList.contains('bi-inbox')).toBe(true);
    expect(messageElement).toBeTruthy();
  });

  it('should display error message when provided', () => {
    fixture.componentRef.setInput('icon', 'bi-inbox');
    fixture.componentRef.setInput('message', 'No items found');
    fixture.componentRef.setInput('errorMessage', 'An error occurred');
    fixture.detectChanges();

    const errorElement = fixture.debugElement.query(By.css('.fs-6'));
    expect(errorElement).toBeTruthy();
    expect(errorElement.nativeElement.textContent.trim()).toBe('An error occurred');
  });

  it('should not display error message when not provided', () => {
    fixture.componentRef.setInput('icon', 'bi-inbox');
    fixture.componentRef.setInput('message', 'No items found');
    fixture.detectChanges();

    const errorElement = fixture.debugElement.query(By.css('.fs-6'));
    expect(errorElement).toBeFalsy();
  });
});
