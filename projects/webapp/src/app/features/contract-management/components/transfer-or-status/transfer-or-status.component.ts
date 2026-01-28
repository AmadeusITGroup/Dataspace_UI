import { NgClass, NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { ContractStateEnum } from '../../../../core/enums/contract-state.enum';
import { TransferStateEnum } from '../../constants/transfer-state.enum';
import { EnrichedNegotiation } from '../../models/contract-negotiation.model';
import { TransferProcess } from '../../models/transfer-process.model';
import { TransferService } from '../../services/contract-transfer.service';

@Component({
  selector: 'app-transfer-or-status',
  templateUrl: './transfer-or-status.component.html',
  standalone: true,
  imports: [NgTemplateOutlet, RouterModule, NgClass],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TransferOrStatusComponent {
  readonly transferService = inject(TransferService);

  public enrichedNegotiation = input<EnrichedNegotiation>();
  public transfersInProgress = input<TransferProcess[]>();

  readonly transferStateQuery = injectQuery(() =>
    this.transferService.getTransferStateQuery(this.transferId() || undefined)
  );
  readonly transferState = computed(() => this.transferStateQuery.data());

  readonly transferId = computed(() => {
    return this.enrichedNegotiation()?.negotiation.createdTransferId();
  });

  readonly showRefresh = computed(() => {
    return !!this.transferId() && this.transferState() !== TransferStateEnum.STARTED;
  });

  readonly isTransferInProgress = computed(() => {
    const contractId = this.enrichedNegotiation()?.negotiation?.contractAgreementId;
    const transferProcess = (this.transfersInProgress() || []).find(
      (transfer) => transfer.contractId === contractId
    );
    return !!(contractId && transferProcess);
  });

  readonly isTransferAllowed = computed(() => {
    return (
      this.enrichedNegotiation()?.negotiation.state === ContractStateEnum.FINALIZED &&
      this.enrichedNegotiation()?.negotiation.type === 'CONSUMER' &&
      !!this.enrichedNegotiation()?.negotiation.contractAgreementId
    );
  });

  onTransfer(event: Event) {
    event.stopPropagation();
    const enrichedNegotiation = this.enrichedNegotiation();
    if (enrichedNegotiation) {
      this.transferService.transfer.mutate(enrichedNegotiation, {
        onSuccess: (transferId) => {
          this.enrichedNegotiation()?.negotiation.createdTransferId.set(transferId!);
        }
      });
    }
  }

  async refreshTransferStateCheck(event: Event) {
    event.stopPropagation();
    await this.transferStateQuery.refetch();
  }

  transferPending = computed(() => {
    return this.transferService.transfer.status() === 'pending';
  });

  TransferStateEnum = TransferStateEnum;
}
