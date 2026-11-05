import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PolicyDetailsModalViewComponent } from './policy-details-modal-view.component';
import { PolicyResponse } from '../../../../../../core/models/policy';

describe('PolicyDetailsModalViewComponent', () => {
  let component: PolicyDetailsModalViewComponent;
  let fixture: ComponentFixture<PolicyDetailsModalViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PolicyDetailsModalViewComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(PolicyDetailsModalViewComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should accept policyR model input', () => {
    const mockPolicy: PolicyResponse = {
      '@id': 'policy-1',
      '@type': 'odrl:Set',
      'odrl:permission': [],
      createdAt: 1234567890
    };

    fixture.componentRef.setInput('policyR', mockPolicy);
    fixture.detectChanges();

    expect(component.policyR()).toEqual(mockPolicy);
  });

  it('should update policyR when set', () => {
    const mockPolicy1: PolicyResponse = {
      '@id': 'policy-1',
      '@type': 'odrl:Set',
      'odrl:permission': [],
      createdAt: 1234567890
    };

    // @ts-ignore
    const mockPolicy2: PolicyResponse = {
      '@id': 'policy-2',
      '@type': 'odrl:Set',
      'odrl:permission': [],
      createdAt: 1234567891
    };

    component.policyR.set(mockPolicy1);
    expect(component.policyR()).toEqual(mockPolicy1);

    component.policyR.set(mockPolicy2);
    expect(component.policyR()).toEqual(mockPolicy2);
  });
});
