import { FormControl } from '@angular/forms';
import { FilterOption } from '../../../core/components/filters/filter-option.model';

export function buildFilterOptions(controls: { policySearch: FormControl }): FilterOption[] {
  return [
    {
      label: 'Search by',
      control: controls['policySearch'],
      id: 'policySearch',
      placeholder: 'ID',
      type: 'search',
      defaultValue: ''
    }
  ];
}
