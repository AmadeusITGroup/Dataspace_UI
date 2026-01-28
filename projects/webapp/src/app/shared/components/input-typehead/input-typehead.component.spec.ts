import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InputTypeheadComponent } from './input-typehead.component';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { NgbTypeahead } from '@ng-bootstrap/ng-bootstrap';

describe('InputTypeheadComponent', () => {
  let component: InputTypeheadComponent;
  let fixture: ComponentFixture<InputTypeheadComponent>;
  let formControl: FormControl;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InputTypeheadComponent, ReactiveFormsModule, NgbTypeahead]
    }).compileComponents();

    fixture = TestBed.createComponent(InputTypeheadComponent);
    component = fixture.componentInstance;
    formControl = new FormControl('');
    fixture.componentRef.setInput('fc', formControl);
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should use default id', () => {
    fixture.detectChanges();
    expect(component.id()).toBe('typeahead-focus');
  });

  it('should use custom id when provided', () => {
    fixture.componentRef.setInput('id', 'custom-id');
    fixture.detectChanges();
    expect(component.id()).toBe('custom-id');
  });

  it('should display label when provided', () => {
    fixture.componentRef.setInput('label', 'Test Label');
    fixture.detectChanges();
    expect(component.label()).toBe('Test Label');
  });

  it('should use custom placeholder', () => {
    fixture.componentRef.setInput('placeholder', 'Enter text...');
    fixture.detectChanges();
    expect(component.placeholder()).toBe('Enter text...');
  });

  it('should accept list of options', () => {
    const options = ['Option 1', 'Option 2', 'Option 3'];
    fixture.componentRef.setInput('list', options);
    fixture.detectChanges();
    expect(component.list()).toEqual(options);
  });

  it('should have editable disabled by default', () => {
    fixture.detectChanges();
    expect(component.editable()).toBe(false);
  });

  it('should set editable when provided', () => {
    fixture.componentRef.setInput('editable', true);
    fixture.detectChanges();
    expect(component.editable()).toBe(true);
  });

  it('should apply custom classes', () => {
    fixture.componentRef.setInput('classes', 'custom-class');
    fixture.detectChanges();
    expect(component.classes()).toBe('custom-class');
  });

  it('should show invalid state when all displayInvalidOn conditions are met', () => {
    formControl.markAsTouched();
    formControl.markAsDirty();
    fixture.componentRef.setInput('displayInvalidOn', ['touched', 'dirty']);
    fixture.detectChanges();

    expect(component.isInvalid()).toBe(true);
  });

  it('should not show invalid state when displayInvalidOn is empty', () => {
    formControl.markAsTouched();
    fixture.detectChanges();

    expect(component.isInvalid()).toBeFalsy();
  });
});
