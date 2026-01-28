import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SearchInputComponent } from './search-input.component';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

describe('SearchInputComponent', () => {
  let component: SearchInputComponent;
  let fixture: ComponentFixture<SearchInputComponent>;
  let formControl: FormControl;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SearchInputComponent, ReactiveFormsModule]
    }).compileComponents();

    fixture = TestBed.createComponent(SearchInputComponent);
    component = fixture.componentInstance;
    formControl = new FormControl('');
    fixture.componentRef.setInput('control', formControl);
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should use default placeholder', () => {
    fixture.detectChanges();
    expect(component.placeholder()).toBe('Search...');
  });

  it('should use custom placeholder when provided', () => {
    fixture.componentRef.setInput('placeholder', 'Custom placeholder');
    fixture.detectChanges();
    expect(component.placeholder()).toBe('Custom placeholder');
  });

  it('should use default id', () => {
    fixture.detectChanges();
    expect(component.id()).toBe('search-input');
  });

  it('should use custom id when provided', () => {
    fixture.componentRef.setInput('id', 'custom-id');
    fixture.detectChanges();
    expect(component.id()).toBe('custom-id');
  });

  it('should clear the form control value', () => {
    formControl.setValue('test value');
    fixture.detectChanges();

    component.clear();
    expect(formControl.value).toBe('');
  });

  it('should emit cleared event when control value becomes empty', (done) => {
    fixture.detectChanges();

    component.cleared.subscribe(() => {
      expect(formControl.value).toBe('');
      done();
    });

    formControl.setValue('some text');
    formControl.setValue('');
  });

  it('should not emit cleared event when value changes to non-empty', () => {
    fixture.detectChanges();

    let emitCount = 0;
    component.cleared.subscribe(() => {
      emitCount++;
    });

    formControl.setValue('test');
    expect(emitCount).toBe(0);
  });
});
