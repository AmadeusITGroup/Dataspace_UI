import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PolicyViewerComponent } from './policy-viewer.component';
import { PolicyCondition } from '../../models/policy-condition';

describe('PolicyViewerComponent', () => {
  let component: PolicyViewerComponent;
  let fixture: ComponentFixture<PolicyViewerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PolicyViewerComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(PolicyViewerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should accept policy input', () => {
    const mockPolicy: PolicyCondition = {
      '@type': 'odrl:Constraint',
      'odrl:leftOperand': 'test',
      'odrl:operator': 'eq',
      'odrl:rightOperand': 'value'
    };
    fixture.componentRef.setInput('policy', mockPolicy);
    fixture.detectChanges();
    expect(component.policy()).toEqual(mockPolicy);
  });

  it('should accept showEmptyItems input', () => {
    fixture.componentRef.setInput('showEmptyItems', true);
    fixture.detectChanges();
    expect(component.showEmptyItems()).toBe(true);
  });

  it('should have default showEmptyItems as undefined', () => {
    expect(component.showEmptyItems()).toBeUndefined();
  });

  it('should expose Array helper', () => {
    expect(component['Array']).toBe(Array);
  });

  it('should expose transformInArray helper', () => {
    expect(typeof component['transformInArray']).toBe('function');
  });
});
