import { computed, inject, Injectable, signal } from '@angular/core';
import { injectMutation, injectQuery, QueryClient } from '@tanstack/angular-query-experimental';
import { compact } from 'jsonld/lib/jsonld';
import {
  ContractAgreementV3Service,
  ContractNegotiationV3Service,
  TerminateNegotiation
} from 'management-sdk';
import { fromEvent, lastValueFrom, takeUntil, timeout, TimeoutError } from 'rxjs';
import { ToastService } from '../../../core/toasts/toast-service';
import { extractErrorReason } from '../../../core/utils/object.util';
import { jsonLDContext, noPaginationQuerySpec, normalizeJsonLD } from '../../../jsonld';
import { DatasetEnriched, Offer } from '../../federated-catalog/models/catalog.model';
import { ContractAgreementDetail } from '../models/contract-agreement.model';
import {
  ContractNegotiation,
  ContractNegotiationErrorDetail
} from '../models/contract-negotiation.model';
import { followNegotiation, NegotiationOutcome } from '../utils/negotiation-outcome.util';

export const TERMINATION_DETAIL_TIMEOUT_MS = 5_000;

const normalizeContractNegotiation = async (input: object): Promise<ContractNegotiation> => {
  const output = await normalizeJsonLD<ContractNegotiation>(input);
  const errorDetail = output.errorDetail;
  if (errorDetail && errorDetail.startsWith('{')) {
    try {
      output.errorDetailObject = await normalizeJsonLD<ContractNegotiationErrorDetail>(
        JSON.parse(errorDetail)
      );
    } catch {
      // ignore error
    }
  }
  output.createdTransferId = signal(null);
  return output;
};

@Injectable()
export class ContractNegotiationService {
  readonly #toastService = inject(ToastService);
  readonly #queryClient = inject(QueryClient);
  readonly #contractNegotiationV3Service = inject(ContractNegotiationV3Service);
  readonly #contractAgreementV3Service = inject(ContractAgreementV3Service);

  readonly negotiationsQuery = injectQuery(() => ({
    queryKey: ['contractNegotiations'],
    refetchOnWindowFocus: false,
    queryFn: () =>
      lastValueFrom(
        this.#contractNegotiationV3Service.queryNegotiationsV3({
          ...noPaginationQuerySpec,
          sortOrder: 'DESC',
          sortField: 'createdAt'
        })
      ).then((items) => Promise.all(items.map(normalizeContractNegotiation)))
  }));

  // TODO: Re-enable when management-be SDK is fixed
  // readonly negotiationsRetiredQuery = injectQuery(() => ({
  //   queryKey: ['contractNegotiationsRetired'],
  //   refetchOnWindowFocus: false,
  //   queryFn: () =>
  //     lastValueFrom(this.#managementApiService.getAllRetiredV3()).then((items) =>
  //       Promise.all(items.map(normalizeContractNegotiation))
  //     )
  // }));

  readonly agreementsQuery = injectQuery(() => ({
    queryKey: ['contractAgreements'],
    queryFn: async () =>
      lastValueFrom(this.#contractAgreementV3Service.queryAgreementsV3(noPaginationQuerySpec)).then(
        (items) => Promise.all(items.map(normalizeJsonLD<ContractAgreementDetail>))
      )
  }));

  readonly agreementsById = computed((): Record<string, ContractAgreementDetail> => {
    const agreements = this.agreementsQuery.data();
    if (!agreements) {
      return {};
    }
    return Object.fromEntries(agreements.map((agreement) => [agreement['@id'], agreement]));
  });

  readonly agreementsByDatasetId = computed(
    (): Record<string, ContractAgreementDetail[]> | null => {
      const agreements = this.agreementsQuery.data();
      if (!agreements) {
        return null;
      }
      const res: Record<string, ContractAgreementDetail[]> = {};
      for (const agreement of agreements) {
        const id = `${agreement.providerId}/${agreement.assetId}`;
        let array = res[id];
        if (!array) {
          array = [];
          res[id] = array;
        }
        array.push(agreement);
      }
      return res;
    }
  );

  readonly negotiate = injectMutation(() => ({
    mutationFn: async ({ dataset, policy }: { dataset: DatasetEnriched; policy: Offer }) => {
      // if the server was correctly accepting any valid JSON-LD object, we would not need to use compact here
      // but, it seems that, even though it does not always fail immediately, the server does not behave correctly
      // if the request is not compacted with the expected context
      const request = (await compact(
        {
          '@context': jsonLDContext,
          '@type': 'ContractRequestDto',
          counterPartyAddress: dataset.originator,
          protocol: 'dataspace-protocol-http',
          policy: {
            ...policy,
            target: dataset.id,
            assigner: dataset.participantId
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          } as any
        },
        { '@vocab': jsonLDContext['@vocab'] }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      )) as any;
      const response = await lastValueFrom(
        this.#contractNegotiationV3Service.initiateContractNegotiationV3(request)
      );
      const negotiationId = response['@id'] ?? '';
      if (!negotiationId) {
        return {
          negotiationId,
          outcome: { kind: 'in-progress', state: null } as NegotiationOutcome
        };
      }
      // the connector may still terminate an accepted negotiation: follow its state first
      const outcome = await followNegotiation(async (signal) => {
        const { state } = await lastValueFrom(
          this.#contractNegotiationV3Service
            .getNegotiationStateV3(negotiationId)
            // unsubscribing cancels the HTTP request once the follow-up budget is spent
            .pipe(takeUntil(fromEvent(signal, 'abort')))
        );
        return state;
      });
      if (outcome.kind === 'terminated') {
        throw new Error(await this.#terminationMessage(negotiationId));
      }
      return { negotiationId, outcome };
    },
    onSuccess: ({
      negotiationId,
      outcome
    }: {
      negotiationId: string;
      outcome: NegotiationOutcome;
    }) => {
      this.#toastService.showSuccess(
        outcome.kind === 'finalized'
          ? `Contract negotiation finalized (${negotiationId})`
          : `Contract negotiation initiated (${negotiationId}), state: ${outcome.state ?? 'unknown'}`
      );
    },
    onSettled: async () => {
      // also on error: a terminated negotiation still exists and must show in the list
      await Promise.all([
        this.#queryClient.invalidateQueries({ queryKey: ['contractNegotiations'] }),
        this.#queryClient.invalidateQueries({ queryKey: ['contractAgreements'] })
      ]);
    },
    onError: (error: unknown) => {
      this.#toastService.showError(
        `Contract negotiation failed: ${error && typeof error === 'object' && 'message' in error ? error.message : error}`
      );
    }
  }));

  async #terminationMessage(negotiationId: string): Promise<string> {
    try {
      const negotiation = await lastValueFrom(
        this.#contractNegotiationV3Service
          .getNegotiationV3(negotiationId)
          // a hanging read must not keep the mutation pending; timing out cancels the request
          .pipe(timeout(TERMINATION_DETAIL_TIMEOUT_MS))
      );
      // errorDetail can be a serialized DSP error object: show only its reason
      const reason = extractErrorReason(negotiation);
      if (reason) {
        return `terminated by the connector (${negotiationId}): ${reason}`;
      }
    } catch (error) {
      // the termination itself is known: a missing detail only drops the reason from the message
      if (error instanceof TimeoutError) {
        console.warn(
          `Reading the termination detail of ${negotiationId} timed out after ${TERMINATION_DETAIL_TIMEOUT_MS} ms`
        );
      } else {
        console.warn(`Could not read the termination detail of ${negotiationId}`, error);
      }
    }
    return `terminated by the connector (${negotiationId})`;
  }

  readonly terminate = injectMutation(() => ({
    mutationFn: async ({ contractId, reason }: { contractId: string; reason: string }) => {
      const payload: Omit<TerminateNegotiation, '@context'> & { '@context': { '@vocab': string } } =
        {
          '@context': { '@vocab': 'https://w3id.org/edc/v0.0.1/ns/' },
          '@type': 'https://w3id.org/edc/v0.0.1/ns/TerminateNegotiation',
          reason
        };
      await lastValueFrom(
        this.#contractNegotiationV3Service.terminateNegotiationV3(contractId, payload)
      );
      return contractId;
    },
    onSuccess: async (contractId) => {
      this.#toastService.showSuccess(
        `Contract negotiation successfully terminated (${contractId})`
      );
      await Promise.all([
        this.#queryClient.invalidateQueries({ queryKey: ['contractNegotiations'] })
      ]);
    },
    onError: (error: unknown) => {
      this.#toastService.showError(
        `Contract termination failed: ${error && typeof error === 'object' && 'message' in error ? error.message : error}`
      );
    }
  }));

  readonly delete = injectMutation(() => ({
    mutationFn: async ({ contractId }: { contractId: string }) => {
      await lastValueFrom(this.#contractNegotiationV3Service.deleteNegotiationV3(contractId));
      return contractId;
    },
    onSuccess: async (contractId) => {
      this.#toastService.showSuccess(`Contract negotiation successfully deleted (${contractId})`);
      await Promise.all([
        this.#queryClient.invalidateQueries({ queryKey: ['contractNegotiations'] })
      ]);
    },
    onError: (error: unknown) => {
      this.#toastService.showError(
        `Contract deletion failed: ${error && typeof error === 'object' && 'message' in error ? error.message : error}`
      );
    }
  }));
}
