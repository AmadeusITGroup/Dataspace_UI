import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ListSummaryComponent } from './list-summary.component';
import { By } from '@angular/platform-browser';
import { NgbTooltip } from '@ng-bootstrap/ng-bootstrap';

describe('ListSummaryComponent', () => {
  let component: ListSummaryComponent;
  let fixture: ComponentFixture<ListSummaryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListSummaryComponent, NgbTooltip]
    }).compileComponents();

    fixture = TestBed.createComponent(ListSummaryComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.componentRef.setInput('shown', 10);
    fixture.componentRef.setInput('total', 20);
    fixture.componentRef.setInput('isTableLayout', true);
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should display filtered message when shown differs from total', () => {
    fixture.componentRef.setInput('shown', 10);
    fixture.componentRef.setInput('total', 20);
    fixture.componentRef.setInput('isTableLayout', true);
    fixture.detectChanges();

    const textContent = fixture.nativeElement.textContent;
    expect(textContent).toContain('Filtered 10 of 20 results');
  });

  it('should display showing message when shown equals total', () => {
    fixture.componentRef.setInput('shown', 15);
    fixture.componentRef.setInput('total', 15);
    fixture.componentRef.setInput('isTableLayout', true);
    fixture.detectChanges();

    const textContent = fixture.nativeElement.textContent;
    expect(textContent).toContain('Showing 15 results');
  });

  it('should display toggle button when toggable is true', () => {
    fixture.componentRef.setInput('shown', 10);
    fixture.componentRef.setInput('total', 20);
    fixture.componentRef.setInput('isTableLayout', true);
    fixture.componentRef.setInput('toggable', true);
    fixture.detectChanges();

    const button = fixture.debugElement.query(By.css('button'));
    expect(button).toBeTruthy();
  });

  it('should not display toggle button when toggable is false', () => {
    fixture.componentRef.setInput('shown', 10);
    fixture.componentRef.setInput('total', 20);
    fixture.componentRef.setInput('isTableLayout', true);
    fixture.componentRef.setInput('toggable', false);
    fixture.detectChanges();

    const button = fixture.debugElement.query(By.css('button'));
    expect(button).toBeFalsy();
  });

  it('should have toggable enabled by default', () => {
    fixture.componentRef.setInput('shown', 10);
    fixture.componentRef.setInput('total', 20);
    fixture.componentRef.setInput('isTableLayout', true);
    fixture.detectChanges();

    expect(component.toggable()).toBe(true);
  });

  it('should display grid icon when isTableLayout is true', () => {
    fixture.componentRef.setInput('shown', 10);
    fixture.componentRef.setInput('total', 20);
    fixture.componentRef.setInput('isTableLayout', true);
    fixture.detectChanges();

    const icon = fixture.debugElement.query(By.css('.bi-grid-fill'));
    expect(icon).toBeTruthy();
  });

  it('should display list icon when isTableLayout is false', () => {
    fixture.componentRef.setInput('shown', 10);
    fixture.componentRef.setInput('total', 20);
    fixture.componentRef.setInput('isTableLayout', false);
    fixture.detectChanges();

    const icon = fixture.debugElement.query(By.css('.bi-list-task'));
    expect(icon).toBeTruthy();
  });

  it('should have correct tooltip for switching to cards mode', () => {
    fixture.componentRef.setInput('shown', 10);
    fixture.componentRef.setInput('total', 20);
    fixture.componentRef.setInput('isTableLayout', true);
    fixture.detectChanges();

    const button = fixture.debugElement.query(By.css('button'));
    const tooltipDirective = button.injector.get(NgbTooltip);
    expect(tooltipDirective.ngbTooltip).toBe('Switch to cards mode');
  });

  it('should have correct tooltip for switching to table mode', () => {
    fixture.componentRef.setInput('shown', 10);
    fixture.componentRef.setInput('total', 20);
    fixture.componentRef.setInput('isTableLayout', false);
    fixture.detectChanges();

    const button = fixture.debugElement.query(By.css('button'));
    const tooltipDirective = button.injector.get(NgbTooltip);
    expect(tooltipDirective.ngbTooltip).toBe('Switch to table mode');
  });

  it('should emit toggleLayout event when button is clicked', () => {
    fixture.componentRef.setInput('shown', 10);
    fixture.componentRef.setInput('total', 20);
    fixture.componentRef.setInput('isTableLayout', true);
    fixture.detectChanges();

    let emitted = false;
    component.toggleLayout.subscribe(() => {
      emitted = true;
    });

    const button = fixture.debugElement.query(By.css('button'));
    button.nativeElement.click();

    expect(emitted).toBe(true);
  });

  it('should emit toggleLayout event when onToggleLayout is called', () => {
    fixture.componentRef.setInput('shown', 10);
    fixture.componentRef.setInput('total', 20);
    fixture.componentRef.setInput('isTableLayout', true);
    fixture.detectChanges();

    let emitted = false;
    component.toggleLayout.subscribe(() => {
      emitted = true;
    });

    component.onToggleLayout();
    expect(emitted).toBe(true);
  });

  it('should accept and display shown input value', () => {
    fixture.componentRef.setInput('shown', 42);
    fixture.componentRef.setInput('total', 100);
    fixture.componentRef.setInput('isTableLayout', true);
    fixture.detectChanges();

    expect(component.shown()).toBe(42);
    const textContent = fixture.nativeElement.textContent;
    expect(textContent).toContain('42');
  });

  it('should accept and display total input value', () => {
    fixture.componentRef.setInput('shown', 10);
    fixture.componentRef.setInput('total', 75);
    fixture.componentRef.setInput('isTableLayout', true);
    fixture.detectChanges();

    expect(component.total()).toBe(75);
    const textContent = fixture.nativeElement.textContent;
    expect(textContent).toContain('75');
  });

  it('should update displayed message when inputs change', () => {
    fixture.componentRef.setInput('shown', 10);
    fixture.componentRef.setInput('total', 20);
    fixture.componentRef.setInput('isTableLayout', true);
    fixture.detectChanges();

    let textContent = fixture.nativeElement.textContent;
    expect(textContent).toContain('Filtered 10 of 20 results');

    fixture.componentRef.setInput('shown', 20);
    fixture.detectChanges();

    textContent = fixture.nativeElement.textContent;
    expect(textContent).toContain('Showing 20 results');
  });

  it('should update icon when isTableLayout changes', () => {
    fixture.componentRef.setInput('shown', 10);
    fixture.componentRef.setInput('total', 20);
    fixture.componentRef.setInput('isTableLayout', true);
    fixture.detectChanges();

    let gridIcon = fixture.debugElement.query(By.css('.bi-grid-fill'));
    expect(gridIcon).toBeTruthy();

    fixture.componentRef.setInput('isTableLayout', false);
    fixture.detectChanges();

    const listIcon = fixture.debugElement.query(By.css('.bi-list-task'));
    expect(listIcon).toBeTruthy();

    gridIcon = fixture.debugElement.query(By.css('.bi-grid-fill'));
    expect(gridIcon).toBeFalsy();
  });

  it('should handle zero values correctly', () => {
    fixture.componentRef.setInput('shown', 0);
    fixture.componentRef.setInput('total', 0);
    fixture.componentRef.setInput('isTableLayout', true);
    fixture.detectChanges();

    const textContent = fixture.nativeElement.textContent;
    expect(textContent).toContain('Showing 0 results');
  });

  it('should handle large numbers correctly', () => {
    fixture.componentRef.setInput('shown', 999);
    fixture.componentRef.setInput('total', 9999);
    fixture.componentRef.setInput('isTableLayout', true);
    fixture.detectChanges();

    const textContent = fixture.nativeElement.textContent;
    expect(textContent).toContain('Filtered 999 of 9999 results');
  });
});
