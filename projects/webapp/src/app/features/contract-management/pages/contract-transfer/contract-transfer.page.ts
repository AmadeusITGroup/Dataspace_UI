import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
  Signal
} from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { FilterOption } from '../../../../core/components/filters/filter-option.model';
import { FiltersComponent } from '../../../../core/components/filters/filters.component';
import { ListSummaryComponent } from '../../../../core/components/list-summary/list-summary.component';
import { I18N } from '../../../../core/i18n/translation.en';
import { ToastService } from '../../../../core/toasts/toast-service';
import { EmptyPageMessageComponent } from '../../../../shared/components/empty-page-message/empty-page-message.component';
import { SpinnerComponent } from '../../../../shared/components/spinner/spinner.component';
import { TableComponent } from '../../../../shared/components/table/table.component';
import { ColumnDefinition } from '../../../../shared/components/table/table.model';
import { CatalogService } from '../../../federated-catalog/services/catalog.service';
import { TransferProcess } from '../../models/transfer-process.model';
import { ContractNegotiationService } from '../../services/contract-negotiation.service';
import { TransferService } from '../../services/contract-transfer.service';
import {
  buildFilterOptions,
  buildFiltersFromQueryParams,
  filterTransferProcessesBy
} from '../../utils/contract-transfer.util';
import { TransferStateCellComponent } from './transfer-table/transfer-state-cell.component';
import { TransferActionsCellComponent } from './transfer-table/transfer-actions-cell.component';
import { TransferActionsService } from '../../services/transfer-actions.service';

@Component({
  templateUrl: 'contract-transfer.page.html',
  providers: [
    CatalogService,
    ContractNegotiationService,
    TransferService,
    TransferActionsService,
    DatePipe
  ],
  imports: [
    SpinnerComponent,
    ReactiveFormsModule,
    EmptyPageMessageComponent,
    TableComponent,
    FiltersComponent,
    ListSummaryComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export default class ContractTransferPageComponent {
  readonly datePipe: DatePipe = inject(DatePipe);
  readonly toastService = inject(ToastService);
  readonly transferService = inject(TransferService);
  readonly transferProcessesQuery = inject(TransferService).transferProcesses;
  readonly route = inject(ActivatedRoute);
  readonly router = inject(Router);

  protected readonly I18N = I18N;

  transfers = computed(() => {
    return this.transferProcessesQuery.data();
  });

  filters: Signal<FilterOption[]> = computed(() => {
    return buildFilterOptions(this.transferService.filterControls);
  });
  // Temporary remove BE filtering to avoid too many requests
  // onFiltersChanged(updatedRecord: Record<string, string | number>) {
  //   // Add the updatedRecord as a queryParam if the value is not empty
  //   const nonEmptyParams = Object.fromEntries(
  //     Object.entries(updatedRecord).filter(([, value]) => value !== '')
  //   );
  //   this.router.navigate([], {
  //     relativeTo: this.route,
  //     queryParams: nonEmptyParams,
  //     queryParamsHandling: 'replace'
  //   });
  //   this.transferProcessesQuery.refetch();
  // }

  filterValues = signal<Record<string, string>>({});

  filteredTransfers = computed(() => {
    const updatedRecord = this.filterValues();

    // If filters are reset, remove queryParams and re-fetch all data
    if (Object.values(updatedRecord).every((value) => value === '') && this.anyQueryParam()) {
      // this.router.navigate([], {
      //   relativeTo: this.route,
      //   queryParams: {},
      //   queryParamsHandling: 'replace'
      // });
      this.transferProcessesQuery.refetch();
      return this.transfers() || [];
    }

    // Otherwise, do UI filtering
    return filterTransferProcessesBy(this.transfers(), updatedRecord);
  });

  readonly isFetching = computed(() => this.transferProcessesQuery.isFetching());
  readonly isError = computed(() => this.transferProcessesQuery.isError());
  readonly error = computed(() => this.transferProcessesQuery.error());

  public errorMessage = '';

  public columns: ColumnDefinition<TransferProcess>[] = [
    {
      id: 'id',
      field: 'id',
      labelKey: 'ID',
      contentHasTooltip: true,
      cellStyle: { 'max-width': '150px' },
      contentClass: 'text-truncate',
      canBeCopied: true
    },
    {
      id: 'contract-id',
      field: 'contractId',
      labelKey: 'Contract ID',
      contentHasTooltip: true,
      width: '150px',
      cellStyle: { 'max-width': '150px' },
      contentClass: 'text-truncate',
      canBeCopied: true
    },
    {
      id: 'type',
      field: 'type',
      labelKey: 'Your Role'
    },
    {
      id: 'asset-id',
      field: 'assetId',
      labelKey: 'Dataset ID',
      cellStyle: { 'max-width': '150px' },
      contentClass: 'text-truncate',
      canBeCopied: true
    },
    {
      id: 'statetimestamp',
      field: 'stateTimestamp',
      getter: (row: TransferProcess) => {
        return this.datePipe.transform(row.stateTimestamp);
      },
      labelKey: 'Requested on'
    },
    {
      id: 'transferType',
      field: 'transferType',
      labelKey: 'Type'
    },
    {
      id: 'state',
      field: 'state',
      labelKey: 'State',
      component: TransferStateCellComponent
    },
    {
      id: 'actions',
      field: '@id',
      labelKey: 'Actions',
      contentClass: 'w-100',
      component: TransferActionsCellComponent
    }
  ];

  readonly anyQueryParam = computed(() => {
    return Object.keys(this.route.snapshot.queryParams).length > 0;
  });

  constructor() {
    effect(() => {
      if (this.isError()) {
        const error = this.error() as HttpErrorResponse;
        this.toastService.showError(error?.message);
        this.errorMessage = `${error?.status} ${error?.statusText}`;
      }
    });
    if (this.anyQueryParam()) {
      buildFiltersFromQueryParams(
        this.route.snapshot.queryParams,
        this.transferService.filterControls
      );
    }
  }
}
