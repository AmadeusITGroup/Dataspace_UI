import { inject, Injectable, signal, WritableSignal } from '@angular/core';
import { FormControl } from '@angular/forms';
import {
  injectMutation,
  injectQuery,
  QueryClient,
  queryOptions
} from '@tanstack/angular-query-experimental';
import {
  QuerySpec,
  TerminateTransfer,
  TransferProcess as SdkTransferProcess,
  TransferProcessV3 as SdkTransferProcessV3,
  TransferProcessV3Service,
  TransferRequestV3
} from 'management-sdk';
import { lastValueFrom } from 'rxjs';
import { ToastService } from '../../../core/toasts/toast-service';
import { composedErrorMessage } from '../../../core/utils/object.util';
import { noPaginationQuerySpec, normalizeJsonLDID } from '../../../jsonld';
import { ContractRoleEnum } from '../constants/role.enum';
import { TransferStateEnum } from '../constants/transfer-state.enum';
import { ContractNegotiation } from '../models/contract-negotiation.model';
import { TransferProcess } from '../models/transfer-process.model';
import { buildTransferFilterOptions } from '../utils/contract-transfer.util';

export async function normalizedTransferProcess(
  item: SdkTransferProcess | SdkTransferProcessV3
): Promise<TransferProcess> {
  const normalized = await normalizeJsonLDID<TransferProcess>(item);
  return {
    ...normalized,
    state: TransferStateEnum[item.state as keyof typeof TransferStateEnum] || normalized.state,
    type: ContractRoleEnum[item.type as keyof typeof ContractRoleEnum] || item.type
  };
}

@Injectable()
export class TransferService {
  readonly #toastService = inject(ToastService);
  readonly #queryClient = inject(QueryClient);
  readonly #transferService = inject(TransferProcessV3Service);

  private refreshEnabledMap = new Map<string, WritableSignal<boolean>>();

  public getRefreshSignal(transferProcessId: string | undefined): WritableSignal<boolean> {
    if (!transferProcessId) return signal(false);
    if (!this.refreshEnabledMap.has(transferProcessId)) {
      this.refreshEnabledMap.set(transferProcessId, signal(false));
    }
    return this.refreshEnabledMap.get(transferProcessId)!;
  }

  readonly filterControls = {
    id: new FormControl(''),
    contractId: new FormControl(''),
    type: new FormControl(''),
    assetId: new FormControl(''),
    state: new FormControl('')
  };

  readonly transfer = injectMutation(() => ({
    mutationFn: async (contractNegotiation: ContractNegotiation) => {
      const payload = {
        '@context': {
          '@vocab': 'https://w3id.org/edc/v0.0.1/ns/'
        } as unknown,
        '@type': 'TransferRequest',
        counterPartyAddress: contractNegotiation.counterPartyAddress!,
        protocol: 'dataspace-protocol-http',
        contractId: contractNegotiation.contractAgreementId!,
        privateProperties: {},
        transferType: 'HttpData-PULL'
      } as TransferRequestV3;
      const response = await lastValueFrom(
        this.#transferService.initiateTransferProcessV3(payload)
      );
      return (response as { '@id': string })['@id'];
    },
    onSuccess: async (transferId) => {
      this.#toastService.showSuccess(`Transfer process successfully initiated (${transferId})`);
      await Promise.all([
        this.#queryClient.invalidateQueries({ queryKey: ['transfersInProgress'] }),
        this.#queryClient.invalidateQueries({ queryKey: ['getTransferState', transferId] })
      ]);
    },
    onError: (error: Error) => {
      const composedMessage = composedErrorMessage(error, 'initiate', 'transfer process');
      this.#toastService.showError(composedMessage);
    }
  }));

  readonly transferProcesses = injectQuery(() => ({
    queryKey: ['transfers'],
    queryFn: async () => {
      // BUILD Array<Criterion>
      const criteria = buildTransferFilterOptions(this.filterControls);
      const payload = {
        ...noPaginationQuerySpec,
        sortOrder: 'DESC',
        sortField: 'createdAt',
        filterExpression: criteria
      } as QuerySpec;
      const response = await lastValueFrom(this.#transferService.queryTransferProcessesV3(payload));
      // If response is an HttpResponse, get the body
      const items = Array.isArray(response) ? response : [response];
      return Promise.all(items.map(normalizedTransferProcess));
    },
    enabled: true
  }));

  readonly transferProcessesStartedQuery = injectQuery(() => ({
    queryKey: ['transfersInProgress'],
    queryFn: async () => {
      // ADD FILTERS FROM UI
      const response = await lastValueFrom(
        this.#transferService.queryTransferProcessesV3({
          ...noPaginationQuerySpec,
          sortOrder: 'DESC',
          sortField: 'createdAt',
          filterExpression: [
            {
              '@type': 'Criterion',
              operandLeft: 'state',
              operator: '=',
              operandRight: 600
            }
          ]
        })
      );
      // If response is an HttpResponse, get the body
      const items = Array.isArray(response) ? response : [response];
      return Promise.all(items.map(normalizedTransferProcess));
    }
  }));

  readonly transfersPerContractNegotiation = (contractNegotiationId: string | undefined) =>
    queryOptions({
      queryKey: ['transfersPerContractNegotiation', contractNegotiationId],
      queryFn: async () => {
        if (!contractNegotiationId) {
          return Promise.resolve([]);
        }
        const response = await lastValueFrom(
          this.#transferService.queryTransferProcessesV3({
            ...noPaginationQuerySpec,
            sortOrder: 'DESC',
            sortField: 'createdAt',
            filterExpression: [
              {
                '@type': 'Criterion',
                operandLeft: 'contractId',
                operator: '=',
                operandRight: contractNegotiationId
              }
            ]
          })
        );
        const items = Array.isArray(response) ? response : [response];
        return Promise.all(items.map(normalizedTransferProcess));
      },
      enabled: !!contractNegotiationId
    });

  readonly getTransferStateQuery = (transferProcessId: string | undefined) =>
    queryOptions({
      queryKey: ['getTransferState', transferProcessId],
      queryFn: async () => {
        if (!transferProcessId) {
          return Promise.resolve(null);
        }
        const response = await lastValueFrom(
          this.#transferService.getTransferProcessStateV3(transferProcessId)
        );
        return (
          TransferStateEnum[response.state as keyof typeof TransferStateEnum] || response.state
        );
      },
      enabled: !!transferProcessId && this.getRefreshSignal(transferProcessId)()
    });

  readonly getTransferByIdQuery = (transferProcessId: string | undefined) =>
    queryOptions({
      queryKey: ['getTransferState', transferProcessId],
      queryFn: async () => {
        if (!transferProcessId) {
          return Promise.resolve(null);
        }
        const response = await lastValueFrom(
          this.#transferService.getTransferProcessV3(transferProcessId)
        );
        return normalizedTransferProcess(response);
      },
      enabled: !!transferProcessId && this.getRefreshSignal(transferProcessId)()
    });

  readonly suspendTransfer = injectMutation(() => ({
    mutationKey: ['suspendTransfer'],
    mutationFn: async (transferData: { transferProcessId: string; reason: string }) => {
      const body = {
        '@context': {
          '@vocab': 'https://w3id.org/edc/v0.0.1/ns/'
        },
        '@type': 'https://w3id.org/edc/v0.0.1/ns/SuspendTransfer',
        reason: transferData.reason
      };
      return lastValueFrom(
        this.#transferService.suspendTransferProcessV3(transferData.transferProcessId, body)
      );
    },
    onSuccess: async () => {
      this.#toastService.showSuccess(
        `Transfer process suspension was requested. It will be suspended shortly.`
      );
    },
    onError: (error: Error) => {
      const composedMessage = composedErrorMessage(error, 'suspend', 'transfer process');
      this.#toastService.showError(composedMessage);
    }
  }));

  readonly resumeTransfer = injectMutation(() => ({
    mutationKey: ['resumeTransfer'],
    mutationFn: async (transferProcessId: string) => {
      return lastValueFrom(this.#transferService.resumeTransferProcessV3(transferProcessId));
    },
    onSuccess: async () => {
      this.#toastService.showSuccess(
        `Transfer process resuming was requested. It will be resumed shortly.`
      );
    },
    onError: (error: Error) => {
      const composedMessage = composedErrorMessage(error, 'resume', 'transfer process');
      this.#toastService.showError(composedMessage);
    }
  }));

  readonly terminateTransfer = injectMutation(() => ({
    mutationKey: ['terminateTransfer'],
    mutationFn: async (transferData: { transferProcessId: string; reason: string }) => {
      const payload = {
        '@context': {
          '@vocab': 'https://w3id.org/edc/v0.0.1/ns/'
        } as unknown,
        '@type': 'https://w3id.org/edc/v0.0.1/ns/TerminateTransfer',
        reason: transferData.reason
      } as TerminateTransfer;
      return lastValueFrom(
        this.#transferService.terminateTransferProcessV3(transferData.transferProcessId, payload)
      );
    },
    onSuccess: async () => {
      this.#toastService.showSuccess(
        `Transfer process termination was requested. It will be terminated shortly.`
      );
    },
    onError: (error: Error) => {
      const composedMessage = composedErrorMessage(error, 'terminate', 'transfer process');
      this.#toastService.showError(composedMessage);
    }
  }));

  readonly deprovisionTransfer = injectMutation(() => ({
    mutationKey: ['deprovisionTransfer'],
    mutationFn: async (transferProcessId: string) => {
      return lastValueFrom(this.#transferService.deprovisionTransferProcessV3(transferProcessId));
    },
    onSuccess: async () => {
      this.#toastService.showSuccess(
        `Transfer process deprovisioning was requested. It will be deprovisioned shortly.`
      );
    },
    onError: (error: Error) => {
      const composedMessage = composedErrorMessage(error, 'deprovision', 'transfer process');
      this.#toastService.showError(composedMessage);
    }
  }));

  public async enableRefresh(transferProcessId: string) {
    const refreshSignal = this.getRefreshSignal(transferProcessId);
    if (!refreshSignal()) refreshSignal.set(true);
    await Promise.all([
      this.#queryClient.invalidateQueries({ queryKey: ['getTransferState', transferProcessId] }),
      this.#queryClient.invalidateQueries({ queryKey: ['getTransferById', transferProcessId] })
    ]);
  }
}
