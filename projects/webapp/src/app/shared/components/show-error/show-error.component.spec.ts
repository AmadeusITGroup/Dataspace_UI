import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, Validators } from '@angular/forms';
import { EmptyPageMessageComponent } from './show-error.component';
import { ATTR_FORM } from './show-error.model';

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
    expect(component).toBeTruthy();
  });

  it('should initialize with isError as false', () => {
    fixture.detectChanges();
    expect(component.isError()).toBe(false);
  });

  it('should detect error when form control is invalid and touched', () => {
    const control = new FormControl('', Validators.required);
    control.markAsTouched();

    fixture.componentRef.setInput('fc', control);
    fixture.componentRef.setInput('attributes', ['touched' as ATTR_FORM]);
    fixture.componentRef.setInput('errorKey', 'required');
    fixture.detectChanges();

    expect(component.isError()).toBe(true);
  });

  it('should not show error when form control is valid', () => {
    const control = new FormControl('value', Validators.required);
    control.markAsTouched();

    fixture.componentRef.setInput('fc', control);
    fixture.componentRef.setInput('attributes', ['touched' as ATTR_FORM]);
    fixture.componentRef.setInput('errorKey', 'required');
    fixture.detectChanges();

    expect(component.isError()).toBe(false);
  });

  it('should handle multiple attributes', () => {
    const control = new FormControl('', Validators.required);
    control.markAsTouched();
    control.markAsDirty();

    fixture.componentRef.setInput('fc', control);
    fixture.componentRef.setInput('attributes', ['touched', 'dirty'] as ATTR_FORM[]);
    fixture.componentRef.setInput('errorKey', 'required');
    fixture.detectChanges();

    expect(component.isError()).toBe(true);
  });

  it('should check specific error value when provided', () => {
    const control = new FormControl('', { validators: Validators.required });
    control.markAsTouched();

    fixture.componentRef.setInput('fc', control);
    fixture.componentRef.setInput('attributes', ['touched' as ATTR_FORM]);
    fixture.componentRef.setInput('errorKey', 'required');
    fixture.detectChanges();

    expect(component.isError()).toBe(true);
  });

  it('should accept type input', () => {
    fixture.componentRef.setInput('type', 'warning');
    fixture.detectChanges();
    expect(component.type()).toBe('warning');
  });

  it('should have default type as danger', () => {
    fixture.detectChanges();
    expect(component.type()).toBe('danger');
  });

  it('should unsubscribe on destroy', () => {
    const control = new FormControl('', Validators.required);
    fixture.componentRef.setInput('fc', control);
    fixture.componentRef.setInput('attributes', ['touched' as ATTR_FORM]);
    fixture.componentRef.setInput('errorKey', 'required');
    fixture.detectChanges();

    expect(component.subscriptions.length).toBeGreaterThan(0);

    component.ngOnDestroy();

    expect(component.subscriptions.length).toBe(0);
  });
});
