import { FormControl } from '@angular/forms';
import { Params } from '@angular/router';
import { Criterion } from 'management-sdk';
import { FilterOption } from '../../../core/components/filters/filter-option.model';
import { TransferStateEnum } from '../constants/transfer-state.enum';
import { TransferProcess } from '../models/transfer-process.model';

export function buildFiltersFromQueryParams(
  queryParams: Params,
  filterControls: {
    id: FormControl;
    contractId: FormControl;
    type: FormControl;
    assetId: FormControl;
    state: FormControl;
  }
): void {
  // Set the value to filterControls
  filterControls.id.setValue(queryParams['id'] || '');
  filterControls.contractId.setValue(queryParams['contractId'] || '');
  filterControls.type.setValue(queryParams['type'] || '');
  filterControls.assetId.setValue(queryParams['assetId'] || '');
  filterControls.state.setValue(queryParams['state'] || '');
}

export function buildFilterOptions(controls: {
  id: FormControl;
  contractId: FormControl;
  type: FormControl;
  assetId: FormControl;
  state: FormControl;
}): FilterOption[] {
  return [
    {
      label: 'Your Role',
      control: controls.type,
      options: [
        { value: '', label: 'All' },
        { value: 'CONSUMER', label: 'Consumer' },
        { value: 'PROVIDER', label: 'Provider' }
      ],
      id: 'type',
      type: 'select',
      defaultValue: ''
    },
    {
      label: 'State',
      control: controls.state,
      options: [
        { value: '', label: 'All' },
        { value: TransferStateEnum.STARTED, label: 'Started' },
        { value: TransferStateEnum.SUSPENDED, label: 'Suspended' },
        { value: TransferStateEnum.COMPLETED, label: 'Completed' },
        { value: TransferStateEnum.TERMINATED, label: 'Terminated' },
        { value: 'Other', label: 'Other' }
        // { value: 800, label: 'Completed' },
      ],
      id: 'state',
      type: 'select',
      defaultValue: ''
    },
    {
      label: 'Transfer Id',
      control: controls['id'],
      id: 'id',
      type: 'search',
      defaultValue: ''
    },
    {
      label: 'Contract Id',
      control: controls.contractId,
      id: 'contractId',
      type: 'search',
      defaultValue: ''
    },
    {
      label: 'Dataset Id',
      control: controls.assetId,
      id: 'assetId',
      type: 'search',
      defaultValue: ''
    }
  ];
}

export function buildTransferFilterOptions(filterControls: {
  contractId: FormControl;
  type: FormControl;
  assetId: FormControl;
  state: FormControl;
}): Criterion[] {
  // Build filter criteria from form controls
  const criteria: Criterion[] = [];
  for (const [key, control] of Object.entries(filterControls)) {
    // ERROR Case
    if (key == 'state' && control.value == 'Error') {
      criteria.push({
        '@type': 'Criterion',
        operandLeft: Object('errorDetail'),
        operator: '!=',
        operandRight: Object('')
      });
    } else if (key == 'state' && control.value == 'Other') {
      criteria.push({
        '@type': 'Criterion',
        operandLeft: Object('state'),
        operator: '!=',
        operandRight: Object('TERMINATED')
      });
      criteria.push({
        '@type': 'Criterion',
        operandLeft: Object('state'),
        operator: '!=',
        operandRight: Object('STARTED')
      });
    }
    // Other cases
    else if (control.value) {
      criteria.push({
        '@type': 'Criterion',
        operandLeft: Object(key),
        operator: '=',
        operandRight: Object(control.value)
      });
    }
  }
  return criteria;
}

export function filterTransferProcessesBy(
  items: TransferProcess[] | undefined,
  updatedFilter: Record<string, string>
) {
  // Helper to get nested property value by path (e.g. "agreement.policy.@id")
  const getNestedValue = (obj: unknown, path: string): unknown =>
    path
      .split('.')
      .reduce(
        (acc, part) =>
          acc && typeof acc === 'object' && part in acc
            ? (acc as Record<string, unknown>)[part]
            : undefined,
        obj
      );

  let result = items || [];
  for (const [key, value] of Object.entries(updatedFilter)) {
    if (!value) continue;
    if (key === 'state') {
      if (value === 'Error') {
        result = result.filter(
          (item) =>
            item.errorDetail !== undefined &&
            (item.state === TransferStateEnum.TERMINATED ||
              item.state === TransferStateEnum.SUSPENDED)
        );
      } else if (value === 'Other') {
        result = result.filter(
          (item) =>
            item.state !== TransferStateEnum.TERMINATED &&
            item.state !== TransferStateEnum.STARTED &&
            item.state !== TransferStateEnum.SUSPENDED
        );
      } else {
        result = result.filter((item) => item.state && item.state === value);
      }
    } else {
      result = result.filter((item) => {
        const propValue = getNestedValue(item, key);
        return typeof propValue === 'string'
          ? propValue.includes(value)
          : propValue !== undefined && propValue !== null
            ? propValue.toString().toLowerCase().includes(value.toLowerCase())
            : false;
      });
    }
  }
  return result;
}

export interface TransferActionConfig {
  label: string;
  action: string;
  class: string;
  style: string;
  tooltipMessage?: string;
  isEnabled?: boolean;
  handler: (id: string, role: string) => void;
}

export const ACTIONS: Omit<TransferActionConfig, 'handler'>[] = [
  {
    label: 'Refresh',
    action: 'REFRESH_STATE',
    class: 'bi-arrow-clockwise',
    style: 'text-primary',
    tooltipMessage: "Refresh transfer's state"
  },
  {
    label: 'Suspend',
    action: 'SUSPEND',
    class: 'bi-pause-circle',
    style: 'text-warning',
    tooltipMessage:
      'Suspending the transfer process is a temporary action. It can be resumed later.'
  },
  {
    label: 'Resume',
    action: 'RESUME',
    class: 'bi-play-circle',
    style: 'text-success',
    tooltipMessage: 'Resuming the transfer process after being suspended.'
  },
  {
    label: 'Deprovision',
    action: 'DEPROVISION',
    class: 'bi-folder-x-circle',
    style: 'text-danger',
    tooltipMessage:
      'De-provisioning will clean up resources associated with this transfer. This action is irreversible.'
  },
  {
    label: 'Terminate',
    action: 'TERMINATE',
    class: 'bi-stop-circle',
    style: 'text-danger ms-auto',
    tooltipMessage: 'Terminate the transfer process. This action is irreversible.'
  }
];
