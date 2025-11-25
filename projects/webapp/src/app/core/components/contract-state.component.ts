import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { NgClass } from '@angular/common';
import {
  ContractNegotiation,
  EnrichedNegotiation
} from '../../features/contract-management/models/contract-negotiation.model';
import { extractErrorReason } from '../utils/object.util';
import { NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { ContractStateEnum } from '../enums/contract-state.enum';

@Component({
  selector: 'app-contract-state',
  imports: [NgbTooltip, NgClass],
  standalone: true,
  template: `
    <span
      class="badge"
      [ngClass]="{
        'bg-success': isFinalized(),
        'bg-warning text-dark': isFinalizedButNoAgree(),
        'bg-danger': isTerminatedState() && hasDetails(),
        'bg-secondary': isTerminatedState() && !hasDetails(),
        'bg-info-subtle text-dark': !isFinalized() && !isTerminatedState()
      }"
      [ngbTooltip]="
        isFinalized()
          ? 'Finalized contract'
          : hasDetails() && isTerminatedState()
            ? 'Contract terminated: ' + extractErrorReason(contract()?.negotiation)
            : null
      "
    >
      <span class="me-1">{{ contract()?.negotiation?.state }}</span>
      <i
        class="bi"
        [ngClass]="{
          'bi-exclamation-circle': hasDetails() && isTerminatedState()
        }"
      ></i>
    </span>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ContractStateComponent {
  public contract = input<EnrichedNegotiation>();

  public hasDetails = computed((): boolean => {
    return !!this.contract()?.negotiation?.errorDetail;
  });

  public isFinalized = computed((): boolean => {
    return (
      this.contract()?.negotiation?.state === ContractStateEnum.FINALIZED &&
      !!this.contract()?.agreement?.contractSigningDate
    );
  });

  public isFinalizedButNoAgree = computed((): boolean => {
    return (
      this.contract()?.negotiation?.state === ContractStateEnum.FINALIZED &&
      !this.contract()?.agreement?.contractSigningDate
    );
  });

  public isTerminatedState = computed((): boolean => {
    return this.contract()?.negotiation?.state === ContractStateEnum.TERMINATED;
  });

  protected extractErrorReason = extractErrorReason<ContractNegotiation>;
}
