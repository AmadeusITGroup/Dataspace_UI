import { FormControl } from '@angular/forms';
import { FilterOption } from '../../../core/components/filters/filter-option.model';
import { extractShortParticipantId } from '../../../core/utils/participant.util';
import { genericFilter } from '../../../core/utils/search.util';
import { Dataset } from '../../federated-catalog/models/catalog.model';
import { ContractAgreementDetail } from '../models/contract-agreement.model';
import { ContractNegotiation, EnrichedNegotiation } from '../models/contract-negotiation.model';
import { ContractStateEnum } from '../../../core/enums/contract-state.enum';

export function filterNegotiations(
  data: EnrichedNegotiation[],
  search: string,
  roleFilter: string,
  counterPartyFilter: string,
  stateFilter: string
): EnrichedNegotiation[] {
  const SEARCH_VALUE_KEYS = [
    'negotiation.@id',
    'negotiation.contractAgreementId',
    'negotiation.state',
    'dataset.id',
    'dataset.description',
    'dataset.name',
    'dataset.contenttype',
    'aggreement.@id',
    'aggreement.policy.@id'
  ];
  let matcher: (item: EnrichedNegotiation, key: string, value: string) => boolean;

  if (search && search.includes('=')) {
    matcher = (item, key, value) => {
      const negotiationValue = item.negotiation?.[key as keyof ContractNegotiation];
      const datasetValue = item.dataset?.[key as keyof Dataset];
      const searchValue = value.toLowerCase();
      return (
        (typeof negotiationValue === 'string'
          ? negotiationValue.toLowerCase().includes(searchValue)
          : negotiationValue !== undefined && negotiationValue !== null
            ? negotiationValue.toString().toLowerCase().includes(searchValue)
            : false) ||
        (typeof datasetValue === 'string'
          ? datasetValue.toLowerCase().includes(searchValue)
          : datasetValue !== undefined && datasetValue !== null
            ? datasetValue.toString().toLowerCase().includes(searchValue)
            : false)
      );
    };
  } else {
    matcher = (item, key, value) => {
      const [obj, prop] = key.split('.') as [keyof EnrichedNegotiation, string];
      const parent = item[obj];
      const val =
        parent && typeof parent === 'object'
          ? (parent as unknown as Record<string, unknown>)[prop]
          : undefined;
      const searchValue = value.toLowerCase();
      if (searchValue === 'error') {
        return val === 'TERMINATED' && !!item.negotiation.errorDetail;
      }
      if (searchValue === 'signed') {
        return val === 'FINALIZED' && !!item.agreement;
      }
      if (
        key === 'aggreement.policy.@id' &&
        searchValue &&
        (item.agreement?.policy?.['@id'] || '').includes(searchValue)
      ) {
        return true;
      }
      return typeof val === 'string'
        ? val.toLowerCase().includes(searchValue)
        : val !== undefined && val !== null
          ? val.toString().toLowerCase().includes(searchValue)
          : false;
    };
  }

  let result = genericFilter(data, search, SEARCH_VALUE_KEYS, matcher);

  if (roleFilter) {
    result = result.filter((item) => item.negotiation.type === roleFilter);
  }

  if (counterPartyFilter) {
    result = result.filter((item) => item.negotiation.counterPartyId?.includes(counterPartyFilter));
  }

  if (stateFilter) {
    if (stateFilter === 'OTHER') {
      const excludedStates = [ContractStateEnum.FINALIZED, ContractStateEnum.TERMINATED];
      result = result.filter(
        (item) =>
          item.negotiation.state &&
          !excludedStates.includes(item.negotiation.state as ContractStateEnum)
      );
    }
    if (stateFilter !== 'ALL' && stateFilter !== 'OTHER') {
      result = result.filter((item) => item.negotiation.state === stateFilter);
    }
  }

  return result;
}

export function buildFilterControls(): {
  search: FormControl;
  role: FormControl;
  counterParty: FormControl;
  state: FormControl;
} {
  return {
    search: new FormControl(''),
    role: new FormControl(''),
    counterParty: new FormControl(''),
    state: new FormControl('')
  };
}

export function buildFilterOptions(
  controls: {
    search: FormControl;
    role: FormControl;
    counterParty: FormControl;
    state: FormControl;
  },
  availableCounterParties: { value: string; label: string }[],
  clearQueryParams: () => void
): FilterOption[] {
  return [
    {
      label: 'Participant',
      control: controls.counterParty,
      options: availableCounterParties,
      placeholder: 'All',
      id: 'counterPartyFilter',
      type: 'select',
      defaultValue: ''
    },
    {
      label: 'Your Role',
      control: controls.role,
      options: [
        { value: '', label: 'Both' },
        { value: 'CONSUMER', label: 'Consumer' },
        { value: 'PROVIDER', label: 'Provider' }
      ],
      id: 'roleFilter',
      type: 'select',
      defaultValue: ''
    },
    {
      label: 'State',
      control: controls.state,
      options: [
        ContractStateEnum.ALL,
        ...Object.values(ContractStateEnum).filter((s) => s !== ContractStateEnum.ALL)
      ].map((state) => ({
        value: state === ContractStateEnum.ALL ? '' : state,
        label: state.charAt(0).toUpperCase() + state.slice(1).toLowerCase()
      })),
      id: 'stateFilter',
      type: 'select',
      defaultValue: ''
    },
    {
      label: 'Search by',
      control: controls.search,
      id: 'search',
      type: 'search',
      placeholder: ' Contract State, any ID, Dataset Name',
      extraCallbackForReset: clearQueryParams
    }
  ];
}

export function enrichNegotiations(
  negotiations: ContractNegotiation[] | undefined,
  agreements: Record<string, ContractAgreementDetail> | undefined,
  datasets: Record<string, Dataset> | undefined
): EnrichedNegotiation[] {
  const res: EnrichedNegotiation[] = [];
  if (!datasets || !negotiations || !agreements) return res;
  for (const negotiation of negotiations) {
    const agreement = negotiation.contractAgreementId
      ? agreements[negotiation.contractAgreementId]
      : null;
    const dataset = agreement ? datasets[`${agreement.providerId}/${agreement.assetId}`] : null;
    res.push({ negotiation, agreement, dataset });
  }
  return res;
}

export function getAvailableCounterParties(
  negotiations: ContractNegotiation[] | undefined
): { value: string; label: string }[] {
  if (!negotiations) return [];
  // Extract and normalize all counterPartyIds
  const counterPartyIds = negotiations
    .map((n) => extractShortParticipantId(n.counterPartyId || ''))
    .filter(Boolean);

  const uniqueSortedIds = Array.from(new Set(counterPartyIds)).sort();

  // Map to option objects for the select input
  const options = uniqueSortedIds.map((id) => ({ value: id, label: id }));

  return [{ value: '', label: 'All' }, ...options];
}
