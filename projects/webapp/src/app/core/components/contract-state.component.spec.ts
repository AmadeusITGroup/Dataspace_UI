import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ContractStateComponent } from './contract-state.component';
import { ContractStateEnum } from '../enums/contract-state.enum';
import { EnrichedNegotiation } from '../../features/contract-management/models/contract-negotiation.model';

describe('ContractStateComponent', () => {
  let component: ContractStateComponent;
  let fixture: ComponentFixture<ContractStateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContractStateComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(ContractStateComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should detect finalized state correctly', () => {
    const mockContract: EnrichedNegotiation = {
      negotiation: {
        state: ContractStateEnum.FINALIZED
      },
      agreement: {
        contractSigningDate: '2024-01-01'
      }
    } as EnrichedNegotiation;

    fixture.componentRef.setInput('contract', mockContract);
    fixture.detectChanges();

    expect(component.isFinalized()).toBe(true);
  });

  it('should detect finalized but no agreement state', () => {
    const mockContract: EnrichedNegotiation = {
      negotiation: {
        state: ContractStateEnum.FINALIZED
      },
      agreement: {
        contractSigningDate: undefined
      }
    } as EnrichedNegotiation;

    fixture.componentRef.setInput('contract', mockContract);
    fixture.detectChanges();

    expect(component.isFinalizedButNoAgree()).toBe(true);
  });

  it('should detect terminated state correctly', () => {
    const mockContract: EnrichedNegotiation = {
      negotiation: {
        state: ContractStateEnum.TERMINATED
      }
    } as EnrichedNegotiation;

    fixture.componentRef.setInput('contract', mockContract);
    fixture.detectChanges();

    expect(component.isTerminatedState()).toBe(true);
  });

  it('should detect error details presence', () => {
    const mockContract: EnrichedNegotiation = {
      negotiation: {
        state: ContractStateEnum.TERMINATED,
        errorDetail: 'Some error occurred'
      }
    } as EnrichedNegotiation;

    fixture.componentRef.setInput('contract', mockContract);
    fixture.detectChanges();

    expect(component.hasDetails()).toBe(true);
  });

  it('should not have details when errorDetail is missing', () => {
    const mockContract: EnrichedNegotiation = {
      negotiation: {
        state: ContractStateEnum.TERMINATED
      }
    } as EnrichedNegotiation;

    fixture.componentRef.setInput('contract', mockContract);
    fixture.detectChanges();

    expect(component.hasDetails()).toBe(false);
  });
});
