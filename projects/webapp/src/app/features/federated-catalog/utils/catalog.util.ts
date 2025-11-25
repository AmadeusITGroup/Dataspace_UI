import { ContractAgreement } from 'management-sdk';
import { CatalogItem, DatasetEnriched } from '../models/catalog.model';
import { genericFilter } from '../../../core/utils/search.util';
import { FilterOption } from '../../../core/components/filters/filter-option.model';
import { FormControl } from '@angular/forms';

export function enrichCatalogItems(
  items: CatalogItem[] | undefined,
  agreementsByDatasetId: Record<string, ContractAgreement[]> | null,
  currentUserShortParticipantId: string | null
): DatasetEnriched[] {
  if (!items) {
    return [];
  }
  return items.flatMap((catalogItem) => {
    const owned = catalogItem.participantId.endsWith(currentUserShortParticipantId || '');
    const shortParticipantId =
      catalogItem.participantId.split(':').pop() || catalogItem.participantId;

    return catalogItem.dataset.map((dataset) => {
      const key = `${catalogItem.participantId}/${dataset.id}`;
      const negotiations = agreementsByDatasetId?.[key] || [];
      const negotiated = negotiations.length > 0 && !owned;

      return {
        trackId: `${catalogItem.participantId}/${dataset.id}`,
        ...dataset,
        negotiations,
        negotiated,
        owned,
        participantId: catalogItem.participantId,
        shortParticipantId,
        originator: catalogItem.originator
      } as DatasetEnriched;
    });
  });
}

export function filterCatalogItems(
  items: DatasetEnriched[],
  filterValues: Record<string, string>
): DatasetEnriched[] {
  if (!items) return [];
  const { search = '', status = '', participant = '' } = filterValues;

  const SEARCH_VALUE_KEYS = ['description', 'name', 'id', 'contenttype', 'provider'];
  let filtered = items;

  // Filter by participant
  if (participant) {
    filtered = filtered.filter((d) => d.shortParticipantId === participant);
  }
  // Filter by status
  switch (status) {
    case 'owned':
      filtered = filtered.filter((d) => d.owned);
      break;
    case 'negotiated':
      filtered = filtered.filter((d) => d.negotiated);
      break;
    case 'available':
      filtered = filtered.filter((d) => !d.negotiated && !d.owned);
      break;
  }
  // Search
  return genericFilter(filtered, search, SEARCH_VALUE_KEYS);
}

export function buildFilterOptions(
  controls: { participant: FormControl; status: FormControl; search: FormControl },
  availableParticipants: { value: string; label: string }[]
): FilterOption[] {
  return [
    {
      label: 'Participant',
      control: controls.participant,
      options: availableParticipants,
      placeholder: 'All',
      id: 'participant',
      type: 'select'
    },
    {
      label: 'Status',
      control: controls.status,
      options: [
        { value: '', label: 'All' },
        { value: 'negotiated', label: 'With contract' },
        { value: 'available', label: 'Available for contract' }
      ],
      id: 'status',
      type: 'select'
    },
    {
      label: 'Search by',
      control: controls.search,
      id: 'search',
      type: 'search',
      placeholder: 'Dataset Name, ID, Description, Content Type'
    }
  ];
}

export function getAvailableParticipants(
  items: CatalogItem[] | undefined
): { value: string; label: string }[] {
  if (!items || items.length === 0) return [];
  const ids = Array.from(
    new Set(items.map((item) => item.participantId.split(':').pop() || item.participantId))
  ).sort();
  return [{ value: '', label: 'All' }, ...ids.map((id) => ({ value: id, label: id }))];
}
