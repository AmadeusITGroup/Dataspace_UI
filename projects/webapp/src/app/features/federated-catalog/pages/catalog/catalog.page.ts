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
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { RouterLink } from '@angular/router';
import { DatasetDetailsModalComponent } from './dataset-modal/dataset-details-modal.component';
import { CatalogService } from '../../services/catalog.service';
import { ContractNegotiationService } from '../../../contract-management/services/contract-negotiation.service';
import { SpinnerComponent } from '../../../../shared/components/spinner/spinner.component';
import { EmptyPageMessageComponent } from '../../../../shared/components/empty-page-message/empty-page-message.component';
import { FiltersComponent } from '../../../../core/components/filters/filters.component';
import { TableComponent } from '../../../../shared/components/table/table.component';
import { ListSummaryComponent } from '../../../../core/components/list-summary/list-summary.component';
import { LoginService } from '../../../../core/services/login.service';
import { ToastService } from '../../../../core/toasts/toast-service';
import { Dataset, DatasetEnriched } from '../../models/catalog.model';
import {
  buildFilterOptions,
  enrichCatalogItems,
  filterCatalogItems,
  getAvailableParticipants
} from '../../utils/catalog.util';
import { FilterOption } from '../../../../core/components/filters/filter-option.model';
import { ColumnDefinition } from '../../../../shared/components/table/table.model';
import { ContractsLinkCellComponent } from './catalog-table/contracts-link-cell.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [CatalogService, ContractNegotiationService, DatePipe],
  imports: [
    DatePipe,
    ReactiveFormsModule,
    SpinnerComponent,
    EmptyPageMessageComponent,
    FiltersComponent,
    RouterLink,
    TableComponent,
    ListSummaryComponent
  ],
  templateUrl: 'catalog.page.html'
})
export default class CatalogPageComponent {
  // services
  readonly modalService = inject(NgbModal);
  readonly datePipe = inject(DatePipe);
  readonly contractNegotiationService = inject(ContractNegotiationService);
  readonly loginService = inject(LoginService);
  readonly toastService = inject(ToastService);

  // queries
  readonly catalogQuery = inject(CatalogService).catalogQuery;

  // data
  readonly userParticipant = computed(() => this.loginService.shortParticipantId());
  readonly enrichDatasets: Signal<DatasetEnriched[]> = computed(() => {
    const data = this.catalogQuery.data();
    // TODO: once https://github.com/eclipse-edc/Connector/pull/4948 is available,
    // use negotiations instead of agreements to know whether we should have a negotiate button
    // cf also https://github.com/eclipse-edc/Connector/discussions/4931
    const agreementsByDatasetId = this.contractNegotiationService.agreementsByDatasetId();
    const userParticipant = this.userParticipant();
    return enrichCatalogItems(data, agreementsByDatasetId, userParticipant);
  });
  readonly availableParticipants = computed(() => {
    const data = this.catalogQuery.data();
    return getAvailableParticipants(data);
  });

  // filters
  readonly filterControls = {
    participant: new FormControl(''),
    status: new FormControl(''),
    search: new FormControl('')
  };
  readonly filters: Signal<FilterOption[]> = computed(() => {
    const availableParticipants = this.availableParticipants();
    return buildFilterOptions(this.filterControls, availableParticipants);
  });
  filterValues = signal<Record<string, string>>({});
  readonly filteredCatalog: Signal<DatasetEnriched[]> = computed(() => {
    const data = this.enrichDatasets();
    const filterValues = this.filterValues();
    return filterCatalogItems(data, filterValues);
  });

  // others
  public errorMessage = '';

  // Table
  public isTableLayout = false;
  public columns: ColumnDefinition<DatasetEnriched>[] = [
    {
      id: 'name',
      field: 'name',
      labelKey: 'Name'
    },
    {
      id: 'participantId',
      field: 'participantId',
      labelKey: 'Participant',
      getter: (row: DatasetEnriched) => {
        return row.shortParticipantId.toUpperCase();
      },
      contentHasTooltip: true,
      cellStyle: { 'max-width': '200px' },
      contentStyle:
        'display: block; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;'
    },
    {
      id: 'contenttype',
      field: 'contenttype',
      getter: (row: DatasetEnriched) => {
        return row.contenttype;
      },
      labelKey: 'Content type'
    },
    {
      id: 'created-at',
      field: 'createdAt',
      getter: (row: DatasetEnriched) => {
        return this.datePipe.transform(row.createdAt);
      },
      labelKey: 'Created At'
    },
    {
      id: 'last-updated-at',
      field: 'updatedAt',
      getter: (row: DatasetEnriched) => {
        return this.datePipe.transform(row.updatedAt);
      },
      labelKey: 'Last Updated'
    },
    {
      id: 'negotiated',
      field: 'negotiated',
      labelKey: 'Links',
      component: ContractsLinkCellComponent
    }
  ];

  constructor() {
    effect(() => {
      if (this.catalogQuery.isError()) {
        const error = this.catalogQuery.error() as HttpErrorResponse;
        this.toastService.showError(error?.message);
        this.errorMessage = `${error?.status} ${error?.statusText}`;
      }
    });
  }

  onFiltersChanged = (values: Record<string, string>) => {
    this.filterValues.set(values);
  };

  viewDataset(dataset: Dataset) {
    const modalRef = this.modalService.open(DatasetDetailsModalComponent, { size: 'lg' });
    modalRef.componentInstance.dataset.set(dataset);
  }
}
