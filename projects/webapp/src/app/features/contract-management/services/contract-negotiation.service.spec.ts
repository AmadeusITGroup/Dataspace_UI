import { TestBed } from '@angular/core/testing';
import { provideTanStackQuery, QueryClient } from '@tanstack/angular-query-experimental';
import { ContractAgreementV3Service, ContractNegotiationV3Service } from 'management-sdk';
import { Observable, of, throwError } from 'rxjs';
import { ToastService } from '../../../core/toasts/toast-service';
import { DatasetEnriched, Offer } from '../../federated-catalog/models/catalog.model';
import { followNegotiation, NegotiationOutcome } from '../utils/negotiation-outcome.util';
import {
  ContractNegotiationService,
  TERMINATION_DETAIL_TIMEOUT_MS
} from './contract-negotiation.service';

jest.mock('jsonld/lib/jsonld', () => ({
  ...jest.requireActual('jsonld/lib/jsonld'),
  compact: jest.fn(async (doc: unknown) => doc)
}));

jest.mock('../utils/negotiation-outcome.util', () => ({
  followNegotiation: jest.fn()
}));

const followNegotiationMock = followNegotiation as jest.MockedFunction<typeof followNegotiation>;

describe('ContractNegotiationService', () => {
  const dataset = {
    id: 'dataset-1',
    participantId: 'did:web:provider-identityhub%3A8383:api:did',
    originator: 'http://provider-controlplane:8282/api/dsp'
  } as unknown as DatasetEnriched;
  const policy = { '@id': 'offer-1' } as unknown as Offer;

  let negotiationApi: {
    initiateContractNegotiationV3: jest.Mock;
    getNegotiationStateV3: jest.Mock;
    getNegotiationV3: jest.Mock;
    queryNegotiationsV3: jest.Mock;
  };
  let toast: { showSuccess: jest.Mock; showError: jest.Mock };
  let queryClient: QueryClient;
  let service: ContractNegotiationService;
  let warn: jest.SpyInstance;

  beforeEach(() => {
    followNegotiationMock.mockReset();
    warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    negotiationApi = {
      initiateContractNegotiationV3: jest.fn(() => of({ '@id': 'neg-1' })),
      getNegotiationStateV3: jest.fn(() => of({ state: 'REQUESTED' })),
      getNegotiationV3: jest.fn(() => of({})),
      queryNegotiationsV3: jest.fn(() => of([]))
    };
    toast = { showSuccess: jest.fn(), showError: jest.fn() };
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    jest.spyOn(queryClient, 'invalidateQueries');
    TestBed.configureTestingModule({
      providers: [
        provideTanStackQuery(queryClient),
        { provide: ContractNegotiationV3Service, useValue: negotiationApi },
        { provide: ContractAgreementV3Service, useValue: { queryAgreementsV3: () => of([]) } },
        { provide: ToastService, useValue: toast },
        ContractNegotiationService
      ]
    });
    service = TestBed.inject(ContractNegotiationService);
  });

  afterEach(() => warn.mockRestore());

  const outcome = (value: NegotiationOutcome) => followNegotiationMock.mockResolvedValue(value);

  it('should report a finalized negotiation', async () => {
    outcome({ kind: 'finalized', state: 'FINALIZED' });
    const result = await service.negotiate.mutateAsync({ dataset, policy });
    expect(result.negotiationId).toBe('neg-1');
    expect(toast.showSuccess).toHaveBeenCalledWith('Contract negotiation finalized (neg-1)');
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['contractNegotiations']
    });
  });

  it('should report a negotiation still running with its state', async () => {
    outcome({ kind: 'in-progress', state: 'REQUESTED' });
    await service.negotiate.mutateAsync({ dataset, policy });
    expect(toast.showSuccess).toHaveBeenCalledWith(
      'Contract negotiation initiated (neg-1), state: REQUESTED'
    );
  });

  it('should read the state through the negotiation state endpoint', async () => {
    followNegotiationMock.mockImplementation(async (getState) => ({
      kind: 'in-progress',
      state: (await getState(new AbortController().signal)) ?? null
    }));
    await service.negotiate.mutateAsync({ dataset, policy });
    expect(negotiationApi.getNegotiationStateV3).toHaveBeenCalledWith('neg-1');
    expect(toast.showSuccess).toHaveBeenCalledWith(
      'Contract negotiation initiated (neg-1), state: REQUESTED'
    );
  });

  it('should cancel a hanging state read when the follow-up is aborted', async () => {
    let unsubscribed = false;
    negotiationApi.getNegotiationStateV3.mockReturnValue(
      new Observable(() => () => {
        unsubscribed = true;
      })
    );
    followNegotiationMock.mockImplementation(async (getState) => {
      const controller = new AbortController();
      const read = getState(controller.signal);
      controller.abort();
      await expect(read).rejects.toThrow();
      return { kind: 'in-progress', state: null };
    });
    await service.negotiate.mutateAsync({ dataset, policy });
    expect(unsubscribed).toBe(true);
    expect(toast.showSuccess).toHaveBeenCalledWith(
      'Contract negotiation initiated (neg-1), state: unknown'
    );
  });

  it('should show only the reason of a serialized DSP error detail', async () => {
    outcome({ kind: 'terminated', state: 'TERMINATED' });
    negotiationApi.getNegotiationV3.mockReturnValue(
      of({
        errorDetail: JSON.stringify({
          '@type': 'dspace:ContractNegotiationError',
          'dspace:code': '400',
          'dspace:reason': 'Policy in the contract agreement is not equal to the one in the offer',
          '@context': { dspace: 'https://w3id.org/dspace/v0.8/' }
        })
      })
    );
    await expect(service.negotiate.mutateAsync({ dataset, policy })).rejects.toThrow(
      'terminated by the connector (neg-1): Policy in the contract agreement is not equal to the one in the offer'
    );
    expect(toast.showError).toHaveBeenCalledWith(
      'Contract negotiation failed: terminated by the connector (neg-1): Policy in the contract agreement is not equal to the one in the offer'
    );
  });

  it('should fall back to the generic message when the detail read hangs', async () => {
    jest.useFakeTimers();
    try {
      outcome({ kind: 'terminated', state: 'TERMINATED' });
      let unsubscribed = false;
      negotiationApi.getNegotiationV3.mockReturnValue(
        new Observable(() => () => {
          unsubscribed = true;
        })
      );
      const result = service.negotiate.mutateAsync({ dataset, policy });
      const settled = expect(result).rejects.toThrow(/^terminated by the connector \(neg-1\)$/);
      await jest.advanceTimersByTimeAsync(TERMINATION_DETAIL_TIMEOUT_MS);
      await settled;
      expect(unsubscribed).toBe(true);
      expect(warn).toHaveBeenCalledWith(
        `Reading the termination detail of neg-1 timed out after ${TERMINATION_DETAIL_TIMEOUT_MS} ms`
      );
    } finally {
      jest.useRealTimers();
    }
  });

  it('should report a terminated negotiation as an error with the connector detail', async () => {
    outcome({ kind: 'terminated', state: 'TERMINATED' });
    negotiationApi.getNegotiationV3.mockReturnValue(of({ errorDetail: 'No callback address' }));
    await expect(service.negotiate.mutateAsync({ dataset, policy })).rejects.toThrow(
      'terminated by the connector (neg-1): No callback address'
    );
    expect(toast.showSuccess).not.toHaveBeenCalled();
    expect(toast.showError).toHaveBeenCalledWith(
      'Contract negotiation failed: terminated by the connector (neg-1): No callback address'
    );
    // the terminated negotiation still exists: lists are refreshed on error too
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['contractNegotiations']
    });
  });

  it('should report a terminated negotiation when its detail cannot be read', async () => {
    outcome({ kind: 'terminated', state: 'TERMINATED' });
    const error = new Error('network');
    negotiationApi.getNegotiationV3.mockReturnValue(throwError(() => error));
    await expect(service.negotiate.mutateAsync({ dataset, policy })).rejects.toThrow(
      /^terminated by the connector \(neg-1\)$/
    );
    expect(warn).toHaveBeenCalledWith('Could not read the termination detail of neg-1', error);
  });

  it('should report an unknown state when the connector returns no id', async () => {
    negotiationApi.initiateContractNegotiationV3.mockReturnValue(of({}));
    await service.negotiate.mutateAsync({ dataset, policy });
    expect(followNegotiationMock).not.toHaveBeenCalled();
    expect(toast.showSuccess).toHaveBeenCalledWith(
      'Contract negotiation initiated (), state: unknown'
    );
  });
});
