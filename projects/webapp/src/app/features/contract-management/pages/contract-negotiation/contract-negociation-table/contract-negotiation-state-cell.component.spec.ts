import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ContractNegotiationStateCellComponent } from './contract-negotiation-state-cell.component';

describe('ContractNegotiationStateCellComponent', () => {
  let component: ContractNegotiationStateCellComponent;
  let fixture: ComponentFixture<ContractNegotiationStateCellComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContractNegotiationStateCellComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(ContractNegotiationStateCellComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should accept value input', () => {
    fixture.componentRef.setInput('value', 'test-value');
    expect(component.value()).toBe('test-value');
  });

  it('should accept row input', () => {
    const mockRow = { data: { id: '1' }, index: 0, expanded: false, cells: [] };
    fixture.componentRef.setInput('row', mockRow);
    expect(component.row()).toEqual(mockRow);
  });
});
