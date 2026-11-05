import { NgClass, NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { ContractStateEnum } from '../../../../core/enums/contract-state.enum';
import { getEventHubUrl } from '../../config/event-hub.config';
import { TransferStateEnum } from '../../constants/transfer-state.enum';
import { EnrichedNegotiation } from '../../models/contract-negotiation.model';
import { TransferProcess } from '../../models/transfer-process.model';
import { TransferService } from '../../services/contract-transfer.service';
import {
  AzureBlobDestination,
  TransferDestinationModalComponent
} from '../transfer-destination-modal/transfer-destination-modal.component';

@Component({
  selector: 'app-transfer-or-status',
  templateUrl: './transfer-or-status.component.html',
  standalone: true,
  imports: [NgTemplateOutlet, RouterModule, NgClass, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TransferOrStatusComponent {
  readonly transferService = inject(TransferService);
  readonly #modalService = inject(NgbModal);

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

  readonly transferConfigOpen = signal(false);
  readonly destinationTypeOptions = ['REST-API Endpoint', 'Kafka Topic'] as const;
  destinationType: 'REST-API Endpoint' | 'Kafka Topic' = 'REST-API Endpoint';
  readonly dataAddressPull = signal(false);
  readonly methodOptions = ['POST', 'GET'] as const;
  pushMethod = 'POST';
  pushBaseUrl = getEventHubUrl();
  pushPath = '';
  pushQueryParams = '';
  pushAuthentication = 'Bearer';
  pushHeaders = '';
  pushAuthKey = 'Authorization';
  pushAuthCode = '';

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

  readonly isFileTransfer = computed(() => {
    const dataset = this.enrichedNegotiation()?.dataset;
    const transferKind = (dataset?.deliveryMethod || dataset?.type || '').toLowerCase();
    return transferKind === 'file';
  });

  get transferMode(): 'HttpData-PULL' | 'HttpData-PUSH' {
    return this.dataAddressPull() ? 'HttpData-PULL' : 'HttpData-PUSH';
  }

  openTransferConfig(event: Event) {
    event.stopPropagation();

    if (this.isFileTransfer()) {
      this.onTransfer(event);
      return;
    }

    this.transferConfigOpen.set(true);
  }

  closeTransferConfig(event?: Event) {
    event?.stopPropagation();
    this.transferConfigOpen.set(false);
  }

  onTransfer(event: Event) {
    event.stopPropagation();
    const enrichedNegotiation = this.enrichedNegotiation();
    if (!enrichedNegotiation) {
      return;
    }

    if (this.isFileTransfer()) {
      this.openDestinationModal(enrichedNegotiation);
      return;
    }

    if (this.transferMode === 'HttpData-PULL') {
      this.transferService.transfer.mutate(
        { enrichedNegotiation },
        {
          onSuccess: (transferId) => {
            this.enrichedNegotiation()?.negotiation.createdTransferId.set(transferId!);
            this.closeTransferConfig();
          }
        }
      );
      return;
    }

    this.transferService.pushTransfer.mutate(
      {
        enrichedNegotiation,
        options: {
          baseUrl: this.pushBaseUrl,
          authKey: this.pushAuthKey,
          authCode: this.pushAuthCode
        }
      },
      {
        onSuccess: (transferId) => {
          this.enrichedNegotiation()?.negotiation.createdTransferId.set(transferId!);
          this.closeTransferConfig();
        }
      }
    );
  }

  isPushMode() {
    return this.transferMode === 'HttpData-PUSH';
  }

  private openDestinationModal(enrichedNegotiation: EnrichedNegotiation): void {
    const modalRef = this.#modalService.open(TransferDestinationModalComponent, { size: 'lg' });
    modalRef.result.then(
      (destination: AzureBlobDestination) => {
        this.transferService.transfer.mutate(
          { enrichedNegotiation, dataDestination: destination },
          {
            onSuccess: (transferId) => {
              this.enrichedNegotiation()?.negotiation.createdTransferId.set(transferId!);
              this.closeTransferConfig();
            }
          }
        );
      },
      () => undefined
    );
  }

  async refreshTransferStateCheck(event: Event) {
    event.stopPropagation();
    await this.transferStateQuery.refetch();
  }

  transferPending() {
    if (this.transferMode === 'HttpData-PUSH') {
      return this.transferService.pushTransfer.status() === 'pending';
    }
    return this.transferService.transfer.status() === 'pending';
  }

  isPushConfigInvalid() {
    if (this.transferMode !== 'HttpData-PUSH') {
      return false;
    }
    return !this.pushBaseUrl.trim() || !this.pushAuthKey.trim();
  }

  TransferStateEnum = TransferStateEnum;
}
