import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  model,
  signal,
  WritableSignal
} from '@angular/core';
import { NgbAccordionModule, NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Buffer } from 'buffer';
import { NgxJsonViewerModule } from 'ngx-json-viewer';
import { RouterLink } from '@angular/router';
import { PolicyViewerComponent } from '../../../../../core/components/policy-viewver/policy-viewer.component';
import { ContractNegotiationService } from '../../../../contract-management/services/contract-negotiation.service';
import { DatasetEnriched, Offer } from '../../../models/catalog.model';
import { extractShortParticipantId } from '../../../../../core/utils/participant.util';

@Component({
  imports: [DatePipe, NgbAccordionModule, NgxJsonViewerModule, PolicyViewerComponent, RouterLink],
  providers: [ContractNegotiationService],
  templateUrl: 'dataset-details-modal.component.html',
  styleUrl: 'dataset-details-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DatasetDetailsModalComponent {
  // inputs
  public dataset = model.required<DatasetEnriched>();
  // services
  readonly activeModal = inject(NgbActiveModal);
  readonly contractNegotiationService = inject(ContractNegotiationService);
  // others
  private temporarilyDisabled = new Set<number>();
  public nonPersistentNegotiationId: WritableSignal<string | undefined> = signal(undefined);
  protected readonly extractShortParticipantId = extractShortParticipantId;

  isOfferTemporarilyDisabled(index: number): boolean {
    return this.temporarilyDisabled.has(index);
  }

  async negotiate(policy: Offer, dataset: DatasetEnriched, index: number) {
    this.temporarilyDisabled.add(index);
    try {
      await this.contractNegotiationService.negotiate.mutateAsync(
        { dataset, policy },
        {
          onSuccess: (negotiationId) => {
            this.nonPersistentNegotiationId.set(negotiationId);
          }
        }
      );
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      this.temporarilyDisabled.delete(index); // Re-enable on error
    }
  }

  /*
   * @param encodedText of string has this format [definition-id]:[asset-id]:[UUID]
   */
  extractDefinitionId(encodedText: string): string {
    try {
      const sections = encodedText.split(':');
      return Buffer.from(sections[0], 'base64').toString('utf-8');
    } catch (error) {
      console.error('Failed to decode Base64 text:', error);
      return '';
    }
  }
}
