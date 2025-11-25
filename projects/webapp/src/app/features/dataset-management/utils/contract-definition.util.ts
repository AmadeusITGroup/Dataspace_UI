import { FormControl } from '@angular/forms';
import { FilterOption } from '../../../core/components/filters/filter-option.model';
import { ContractDefinition } from '../model/contract/contract-definition.model';
import { default as _uniq } from 'lodash.uniq';
import { genericFilter } from '../../../core/utils/search.util';

function buildFilterControls(): {
  search: FormControl;
  asset: FormControl;
  accessPolicy: FormControl;
  contractPolicy: FormControl;
} {
  return {
    search: new FormControl(''),
    asset: new FormControl(''),
    accessPolicy: new FormControl(''),
    contractPolicy: new FormControl('')
  };
}

export function buildFilterOptions(): FilterOption[] {
  const controls = buildFilterControls();
  return [
    {
      label: 'Search by',
      control: controls.search,
      id: 'search',
      type: 'search',
      placeholder: 'ID, Dataset ID, Policy ID'
    }
  ];
}

export function buildTypeheadList(
  data: ContractDefinition[],
  attr: keyof ContractDefinition
): string[] {
  return _uniq(
    (data || [])
      .map((contractDefinition) => contractDefinition[attr] || '')
      .filter(Boolean) as string[]
  );
}

export function filterContractDefinition(
  items: ContractDefinition[],
  filterValues: Record<string, string>
): ContractDefinition[] {
  let filtered = items;

  // Filter by participant
  if (filterValues['assetFilter']) {
    filtered = filtered.filter((d) => d.assetName === filterValues['assetFilter']);
  }
  if (filterValues['accessPolicyFilter']) {
    filtered = filtered.filter((d) => d.accessPolicyId === filterValues['accessPolicyFilter']);
  }
  if (filterValues['contractPolicyFilter']) {
    filtered = filtered.filter((d) => d.contractPolicyId === filterValues['contractPolicyFilter']);
  }
  // Search
  const SEARCH_VALUE_KEYS = ['@id', 'assetName', 'accessPolicyId', 'contractPolicyId'];
  return genericFilter(filtered, filterValues['search'], SEARCH_VALUE_KEYS);
}
