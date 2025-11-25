import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ContractStateComponent } from '../../../../../core/components/contract-state.component';
import { RowData } from '../../../../../shared/components/table/table.model';
import { EnrichedNegotiation } from '../../../models/contract-negotiation.model';

@Component({
  selector: 'app-contract-negotiation-state-cell',
  standalone: true,
  imports: [ContractStateComponent],
  template: ` <app-contract-state [contract]="row()?.data"></app-contract-state>`,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ContractNegotiationStateCellComponent {
  public value = input<string>();
  public row = input<RowData<EnrichedNegotiation>>();
}
