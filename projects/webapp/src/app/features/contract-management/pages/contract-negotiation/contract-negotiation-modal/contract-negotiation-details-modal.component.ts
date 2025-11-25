import { DatePipe, NgClass } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  model,
  signal,
  Signal
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { NgbActiveModal, NgbAlert } from '@ng-bootstrap/ng-bootstrap';
import { ContractStateComponent } from '../../../../../core/components/contract-state.component';
import { CopyButtonComponent } from '../../../../../core/components/copy-button.component';
import { PolicyViewerComponent } from '../../../../../core/components/policy-viewver/policy-viewer.component';
import { ContractStateEnum } from '../../../../../core/enums/contract-state.enum';
import { FooterAction, UIAction } from '../../../../../core/models/ui-action';
import { UtcSecondsToDatePipe } from '../../../../../core/pipes/utc-seconds-to-date.pipe';
import { extractShortParticipantId } from '../../../../../core/utils/participant.util';
import { FooterActionModalComponent } from '../../../../../shared/components/delete-footer-modal/footer-action-modal.component';
import { Dataset } from '../../../../federated-catalog/models/catalog.model';
import { TransferOrStatusComponent } from '../../../components/transfer-or-status/transfer-or-status.component';
import { ContractAgreementDetail } from '../../../models/contract-agreement.model';
import {
  ContractNegotiation,
  EnrichedNegotiation
} from '../../../models/contract-negotiation.model';
import { TransferProcess } from '../../../models/transfer-process.model';
import { ContractNegotiationService } from '../../../services/contract-negotiation.service';

@Component({
  imports: [
    DatePipe,
    NgbAlert,
    CopyButtonComponent,
    PolicyViewerComponent,
    TransferOrStatusComponent,
    RouterModule,
    ContractStateComponent,
    FormsModule,
    FooterActionModalComponent,
    NgClass,
    UtcSecondsToDatePipe
  ],
  providers: [],
  templateUrl: 'contract-negotiation-details-modal.component.html',
  styleUrl: 'contract-negotiation-details-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ContractNegotiationDetailsModalComponent {
  // services
  readonly activeModal = inject(NgbActiveModal);
  readonly contractNegotiationService = inject(ContractNegotiationService);
  // internal
  readonly extractParticipant = extractShortParticipantId;
  readonly ContractStateEnum = ContractStateEnum;
  readonly FooterAction = FooterAction;
  showFullDescription = false;
  footerAction = signal<FooterAction | null>(null);
  // inputs and outputs
  // For modals inputs we need model to have access to the set in componentInstance
  negotiation = model.required<ContractNegotiation>();
  agreement = model.required<ContractAgreementDetail | null>();
  dataset = model.required<Dataset | null>();
  error = model.required<string | undefined>();
  transferProcessesStarted = model<TransferProcess[]>();

  public enrichedNegotiation: Signal<EnrichedNegotiation> = computed(() => {
    return {
      negotiation: this.negotiation(),
      agreement: this.agreement(),
      dataset: this.dataset()
    } as EnrichedNegotiation;
  });

  public canTerminateContract: Signal<boolean> = computed(() => {
    return ![ContractStateEnum.TERMINATED, ContractStateEnum.FINALIZED].includes(
      this.enrichedNegotiation()?.negotiation?.state as ContractStateEnum
    );
  });

  public canDeleteContract: Signal<boolean> = computed(() => {
    return false;
    // To be enabled when backend ready with delete
    // (
    //   [ContractStateEnum.TERMINATED, ContractStateEnum.FINALIZED].includes(
    //     this.enrichedNegotiation()?.negotiation?.state as ContractStateEnum
    //   ) && !this.enrichedNegotiation().agreement
    // );
  });

  public terminateContract(reason: string) {
    this.contractNegotiationService.terminate.mutate(
      { contractId: this.negotiation()['@id'] as string, reason: reason },
      {
        onSuccess: () => {
          this.activeModal.close(UIAction.REFRESH);
        },
        onError: (error: unknown) => {
          console.log(error);
        }
      }
    );
  }

  public onActionClicked(result: { action: FooterAction; reason: string }) {
    switch (result.action) {
      case FooterAction.TERMINATE:
        this.terminateContract(result.reason);
        break;
      case FooterAction.DELETE:
        this.deleteContract();
        break;
      default:
        break;
    }
  }

  public deleteContract() {
    this.contractNegotiationService.delete.mutate(
      { contractId: this.negotiation()['@id'] as string },
      {
        onSuccess: () => {
          this.activeModal.close(UIAction.REFRESH);
        },
        onError: (error: unknown) => {
          console.log(error);
        }
      }
    );
  }
}
