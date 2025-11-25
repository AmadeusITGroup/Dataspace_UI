import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { RowData } from '../../../../../shared/components/table/table.model';
import { TransferProcess } from '../../../models/transfer-process.model';
import { NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { extractErrorReason } from '../../../../../core/utils/object.util';
import { TransferStateEnum } from '../../../constants/transfer-state.enum';
import { TransferService } from '../../../services/contract-transfer.service';
import { NgClass } from '@angular/common';
import { injectQuery } from '@tanstack/angular-query-experimental';

@Component({
  selector: 'app-transfer-state-cell',
  imports: [NgbTooltip, NgClass],
  standalone: true,
  template: ` <span
    class="badge"
    [ngClass]="{
      'bg-success': isStartedState(),
      'bg-warning text-dark': isSuspendedState(),
      'bg-danger': isTerminatedState() && hasDetails(),
      'bg-secondary': isTerminatedState() && !hasDetails(),
      'bg-info-subtle text-dark': !isStartedState() && !isSuspendedState() && !isTerminatedState()
    }"
    [ngbTooltip]="
      isStartedState()
        ? 'Communication channel open'
        : hasDetails() && (isTerminatedState() || isSuspendedState())
          ? extractErrorReason(row()?.data)
          : null
    "
  >
    <span class="me-1">{{ rowState() }}</span>
    <i
      class="bi"
      [ngClass]="{
        'bi-exclamation-circle': hasDetails() && (isTerminatedState() || isSuspendedState())
      }"
    ></i>
  </span>`,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TransferStateCellComponent {
  readonly transferService = inject(TransferService);
  readonly transferByIdQuery = injectQuery(() =>
    this.transferService.getTransferByIdQuery(this.transferId() || undefined)
  );

  readonly transferId = computed(() => {
    return this.row()?.data?.id;
  });
  public value = input<string>();
  public row = input<RowData<TransferProcess>>();

  public rowState = computed(() => {
    const transfer = this.transfer();
    return this.enabledRefresh() ? transfer?.state : this.row()?.data?.state;
  });

  public hasDetails = computed((): boolean => {
    return !!(this.transfer()?.errorDetail || this.row()?.data?.errorDetail);
  });

  public isTerminatedState = computed((): boolean => {
    return (
      this.rowState() === TransferStateEnum.TERMINATED ||
      this.rowState() === TransferStateEnum.TERMINATING
    );
  });
  public isSuspendedState = computed(
    (): boolean =>
      this.rowState() === TransferStateEnum.SUSPENDED ||
      this.rowState() === TransferStateEnum.SUSPENDING
  );

  public isStartedState = computed((): boolean => {
    return this.rowState() === TransferStateEnum.STARTED;
  });

  public enabledRefresh = computed((): boolean => {
    return this.transferService.getRefreshSignal(this.transferId())();
  });

  readonly transfer = computed(() => this.transferByIdQuery.data());

  protected readonly extractErrorReason = extractErrorReason;
}
