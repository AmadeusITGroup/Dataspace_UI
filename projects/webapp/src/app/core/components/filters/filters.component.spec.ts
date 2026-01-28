import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FiltersComponent } from './filters.component';
import { FormControl } from '@angular/forms';
import { FilterOption } from './filter-option.model';

describe('FiltersComponent', () => {
  let component: FiltersComponent;
  let fixture: ComponentFixture<FiltersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FiltersComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(FiltersComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should accept title input', () => {
    fixture.componentRef.setInput('title', 'Filter Panel');
    fixture.detectChanges();
    expect(component.title()).toBe('Filter Panel');
  });

  it('should accept filters input', () => {
    const filters: FilterOption[] = [
      {
        id: 'filter1',
        label: 'Filter 1',
        type: 'text',
        control: new FormControl('')
      }
    ];
    fixture.componentRef.setInput('filters', filters);
    fixture.detectChanges();
    expect(component.filters().length).toBe(1);
  });

  it('should emit filter values on initialization', (done) => {
    const control = new FormControl('initial value');
    const filters: FilterOption[] = [
      {
        id: 'testFilter',
        label: 'Test Filter',
        type: 'text',
        control: control
      }
    ];

    let emitCount = 0;
    component.filtersChanged.subscribe((values) => {
      emitCount++;
      if (emitCount === 1) {
        // First emission happens on initialization
        expect(values['testFilter']).toBe('initial value');
        done();
      }
    });

    fixture.componentRef.setInput('filters', filters);
    fixture.detectChanges();
  });

  it('should emit filter values when filter changes', (done) => {
    const control = new FormControl('');
    const filters: FilterOption[] = [
      {
        id: 'testFilter',
        label: 'Test Filter',
        type: 'text',
        control: control
      }
    ];

    fixture.componentRef.setInput('filters', filters);
    fixture.detectChanges();

    // Skip the initial emission and only check the emission after value change
    setTimeout(() => {
      component.filtersChanged.subscribe((values) => {
        expect(values['testFilter']).toBe('new value');
        done();
      });

      control.setValue('new value');
    }, 50);
  });

  it('should not emit when typehead filter value is undefined', (done) => {
    const control = new FormControl('initial');
    const filters: FilterOption[] = [
      {
        id: 'typeheadFilter',
        label: 'Typehead Filter',
        type: 'typehead',
        control: control
      }
    ];

    fixture.componentRef.setInput('filters', filters);
    fixture.detectChanges();

    let emitCount = 0;
    component.filtersChanged.subscribe(() => {
      emitCount++;
    });

    const initialCount = emitCount;
    control.setValue(undefined);

    setTimeout(() => {
      expect(emitCount).toBe(initialCount);
      done();
    }, 100);
  });

  it('should clear all filters', () => {
    const control1 = new FormControl('value1');
    const control2 = new FormControl('value2');
    const filters: FilterOption[] = [
      {
        id: 'filter1',
        label: 'Filter 1',
        type: 'text',
        control: control1
      },
      {
        id: 'filter2',
        label: 'Filter 2',
        type: 'text',
        control: control2
      }
    ];

    fixture.componentRef.setInput('filters', filters);
    fixture.detectChanges();

    component.clearAll();

    expect(control1.value).toBe('');
    expect(control2.value).toBe('');
  });

  it('should reset filters to default values when clearing', () => {
    const control = new FormControl('current');
    const filters: FilterOption[] = [
      {
        id: 'filter1',
        label: 'Filter 1',
        type: 'text',
        control: control,
        defaultValue: 'default'
      }
    ];

    fixture.componentRef.setInput('filters', filters);
    fixture.detectChanges();

    component.clearAll();
    expect(control.value).toBe('default');
  });

  it('should call extraCallbackForReset when clearing', () => {
    const control = new FormControl('value');
    const mockCallback = jest.fn();
    const filters: FilterOption[] = [
      {
        id: 'filter1',
        label: 'Filter 1',
        type: 'text',
        control: control,
        extraCallbackForReset: mockCallback
      }
    ];

    fixture.componentRef.setInput('filters', filters);
    fixture.detectChanges();

    component.clearAll();
    expect(mockCallback).toHaveBeenCalled();
  });

  it('should detect when any filter is set', () => {
    const control = new FormControl('value');
    const filters: FilterOption[] = [
      {
        id: 'filter1',
        label: 'Filter 1',
        type: 'text',
        control: control
      }
    ];

    fixture.componentRef.setInput('filters', filters);
    fixture.detectChanges();

    expect(component.anyFilterSet).toBe(true);
  });

  it('should detect when no filter is set', () => {
    const control = new FormControl('');
    const filters: FilterOption[] = [
      {
        id: 'filter1',
        label: 'Filter 1',
        type: 'text',
        control: control
      }
    ];

    fixture.componentRef.setInput('filters', filters);
    fixture.detectChanges();

    expect(component.anyFilterSet).toBe(false);
  });

  it('should consider default values when checking anyFilterSet', () => {
    const control = new FormControl('default');
    const filters: FilterOption[] = [
      {
        id: 'filter1',
        label: 'Filter 1',
        type: 'text',
        control: control,
        defaultValue: 'default'
      }
    ];

    fixture.componentRef.setInput('filters', filters);
    fixture.detectChanges();

    expect(component.anyFilterSet).toBe(false);
  });

  it('should emit filter values from multiple filters', (done) => {
    const control1 = new FormControl('value1');
    const control2 = new FormControl('value2');
    const filters: FilterOption[] = [
      {
        id: 'filter1',
        label: 'Filter 1',
        type: 'text',
        control: control1
      },
      {
        id: 'filter2',
        label: 'Filter 2',
        type: 'text',
        control: control2
      }
    ];

    let emitCount = 0;
    component.filtersChanged.subscribe((values) => {
      emitCount++;
      if (emitCount === 1) {
        expect(values['filter1']).toBe('value1');
        expect(values['filter2']).toBe('value2');
        done();
      }
    });

    fixture.componentRef.setInput('filters', filters);
    fixture.detectChanges();
  });

  it('should unsubscribe from all subscriptions on destroy', () => {
    const control = new FormControl('');
    const filters: FilterOption[] = [
      {
        id: 'filter1',
        label: 'Filter 1',
        type: 'text',
        control: control
      }
    ];

    fixture.componentRef.setInput('filters', filters);
    fixture.detectChanges();

    expect(component['subscriptions'].length).toBeGreaterThan(0);

    component.ngOnDestroy();

    expect(component['subscriptions'].length).toBe(0);
  });

  it('should handle filter changes after filters input changes', (done) => {
    const control1 = new FormControl('');
    const filters1: FilterOption[] = [
      {
        id: 'filter1',
        label: 'Filter 1',
        type: 'text',
        control: control1
      }
    ];

    fixture.componentRef.setInput('filters', filters1);
    fixture.detectChanges();

    const control2 = new FormControl('');
    const filters2: FilterOption[] = [
      {
        id: 'filter2',
        label: 'Filter 2',
        type: 'text',
        control: control2
      }
    ];

    fixture.componentRef.setInput('filters', filters2);
    fixture.detectChanges();

    let emitCount = 0;
    component.filtersChanged.subscribe((values) => {
      emitCount++;
      if (emitCount === 1) {
        expect(values['filter2']).toBe('new value');
        done();
      }
    });

    control2.setValue('new value');
  });

  it('should emit correctly after clearAll is called', (done) => {
    const control = new FormControl('initial');
    const filters: FilterOption[] = [
      {
        id: 'filter1',
        label: 'Filter 1',
        type: 'text',
        control: control,
        defaultValue: 'default'
      }
    ];

    fixture.componentRef.setInput('filters', filters);
    fixture.detectChanges();

    let emitCount = 0;
    component.filtersChanged.subscribe((values) => {
      emitCount++;
      if (emitCount === 2) {
        // Second emission after clearAll
        expect(values['filter1']).toBe('default');
        done();
      }
    });

    component.clearAll();
  });
});
