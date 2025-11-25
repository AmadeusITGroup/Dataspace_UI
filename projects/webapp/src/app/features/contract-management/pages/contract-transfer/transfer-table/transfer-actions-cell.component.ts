import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { RowData } from '../../../../../shared/components/table/table.model';
import { TransferProcess } from '../../../models/transfer-process.model';
import { NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { TransferStateEnum } from '../../../constants/transfer-state.enum';
import { NgClass } from '@angular/common';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { TransferActionsService } from '../../../services/transfer-actions.service';

@Component({
  selector: 'app-transfer-actions-cell',
  imports: [NgbTooltip, NgClass],
  standalone: true,
  template: `
    @if (isActionable()) {
      <div class="d-flex flex-wrap gap-2" style="min-width: 155px; min-height: 40px;">
        @for (action of availableActions(); track action.action) {
          <button
            type="button"
            class="btn"
            [ngClass]="action.style"
            [title]="action.label"
            [ngbTooltip]="action.tooltipMessage || action.label"
            (click)="action.handler()"
          >
            <i class="bi me-1" [ngClass]="action.class"></i>
          </button>
        }
      </div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TransferActionsCellComponent {
  public actionsService = inject(TransferActionsService);

  public value = input<string>();
  public row = input<RowData<TransferProcess>>();

  readonly transferByIdQuery = injectQuery(() =>
    this.actionsService['transferService'].getTransferByIdQuery(this.transferId() || undefined)
  );
  readonly transfer = computed(() => this.transferByIdQuery.data());

  public enabledRefresh = computed((): boolean => {
    return this.actionsService['transferService'].getRefreshSignal(this.transferId())();
  });

  public rowState = computed(() => {
    const row = this.row();
    const transfer = this.transfer();
    return this.enabledRefresh() ? transfer?.state : row?.data?.state || TransferStateEnum.INITIAL;
  });

  public rowRole = computed(() => this.row()?.data?.type || '');
  public transferId = computed(() => this.row()?.data?.id);

  public isActionable = computed((): boolean => {
    return this.rowState() !== TransferStateEnum.TERMINATED;
  });

  public availableActions = computed(() => {
    const state = this.rowState();
    const role = this.rowRole();
    const id = this.transferId();

    if (!id || !state || !role) {
      return [];
    }
    return this.actionsService.getAvailableActions(id, state, role);
  });
}
