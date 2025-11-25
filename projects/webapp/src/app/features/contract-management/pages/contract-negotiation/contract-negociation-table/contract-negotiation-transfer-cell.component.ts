import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RowData } from '../../../../../shared/components/table/table.model';
import { EnrichedNegotiation } from '../../../models/contract-negotiation.model';
import { TransferOrStatusComponent } from '../../../components/transfer-or-status/transfer-or-status.component';
import { TransferProcess } from '../../../models/transfer-process.model';

@Component({
  selector: 'app-contract-negotiation-state-cell',
  standalone: true,
  imports: [TransferOrStatusComponent],
  template: ` <app-transfer-or-status
    [enrichedNegotiation]="row()?.data || undefined"
    [transfersInProgress]="value() || []"
  >
  </app-transfer-or-status>`,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ContractNegotiationTransferCellComponent {
  public value = input<TransferProcess[]>();
  public row = input<RowData<EnrichedNegotiation>>();
}
