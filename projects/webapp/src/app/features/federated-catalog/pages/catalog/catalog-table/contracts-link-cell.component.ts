import { DatasetEnriched } from '../../../models/catalog.model';
import { RowData } from '../../../../../shared/components/table/table.model';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-transfer-state-cell',
  standalone: true,
  imports: [RouterLink],
  template: `@if (row()?.data?.negotiated) {
    <a
      class="text-success text-decoration-none text-nowrap"
      [routerLink]="['/contract-management/contract-negotiation']"
      [queryParams]="{
        searchBy: 'counterPartyId=' + row()?.data?.shortParticipantId + ',id=' + row()?.data?.id
      }"
    >
      <i class="bi bi-briefcase-fill text-success me-2"></i> Contracts
      <i class="bi bi-arrow-right ms-1" aria-hidden="true"></i>
    </a>
  } `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ContractsLinkCellComponent {
  public value = input<string>();
  public row = input<RowData<DatasetEnriched>>();
}
