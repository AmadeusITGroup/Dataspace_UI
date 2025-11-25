import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  Injector,
  Signal,
  signal
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { FilterOption } from '../../../../core/components/filters/filter-option.model';
import { FiltersComponent } from '../../../../core/components/filters/filters.component';
import { ListSummaryComponent } from '../../../../core/components/list-summary/list-summary.component';
import { I18N } from '../../../../core/i18n/translation.en';
import { ToastService } from '../../../../core/toasts/toast-service';
import { extractShortParticipantId } from '../../../../core/utils/participant.util';
import { EmptyPageMessageComponent } from '../../../../shared/components/empty-page-message/empty-page-message.component';
import { SpinnerComponent } from '../../../../shared/components/spinner/spinner.component';
import { TableComponent } from '../../../../shared/components/table/table.component';
import { ColumnDefinition } from '../../../../shared/components/table/table.model';
import { CatalogService } from '../../../federated-catalog/services/catalog.service';
import { TransferOrStatusComponent } from '../../components/transfer-or-status/transfer-or-status.component';
import { EnrichedNegotiation } from '../../models/contract-negotiation.model';
import { ContractNegotiationService } from '../../services/contract-negotiation.service';
import { TransferService } from '../../services/contract-transfer.service';
import {
  buildFilterControls,
  buildFilterOptions,
  enrichNegotiations,
  filterNegotiations,
  getAvailableCounterParties
} from '../../utils/contract-negotiation.util';
import { ContractNegotiationStateCellComponent } from './contract-negociation-table/contract-negotiation-state-cell.component';
import { ContractNegotiationDetailsModalComponent } from './contract-negotiation-modal/contract-negotiation-details-modal.component';
import { ContractStateComponent } from '../../../../core/components/contract-state.component';
import { ContractNegotiationTransferCellComponent } from './contract-negociation-table/contract-negotiation-transfer-cell.component';
import { extractErrorReason } from '../../../../core/utils/object.util';
import { UIAction } from '../../../../core/models/ui-action';
import { UtcSecondsToDatePipe } from '../../../../core/pipes/utc-seconds-to-date.pipe';

@Component({
  templateUrl: 'contract-negotiation.page.html',
  providers: [CatalogService, ContractNegotiationService, TransferService, DatePipe],
  imports: [
    DatePipe,
    SpinnerComponent,
    ReactiveFormsModule,
    EmptyPageMessageComponent,
    TableComponent,
    FiltersComponent,
    ListSummaryComponent,
    TransferOrStatusComponent,
    ContractStateComponent,
    UtcSecondsToDatePipe
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export default class ContractNegotiationPageComponent {
  // services
  readonly modalService = inject(NgbModal);
  readonly datePipe: DatePipe = inject(DatePipe);
  readonly toastService = inject(ToastService);
  readonly catalogService = inject(CatalogService);
  readonly contractNegotiationService = inject(ContractNegotiationService);
  readonly route = inject(ActivatedRoute);
  readonly router = inject(Router);
  readonly injector = inject(Injector);
  // queries
  readonly transferProcessesStartedQuery = inject(TransferService).transferProcessesStartedQuery;
  readonly agreementsQuery = this.contractNegotiationService.agreementsQuery;
  readonly negotiationsQuery = this.contractNegotiationService.negotiationsQuery;
  readonly isPendingQueries = computed(
    () =>
      this.negotiationsQuery.isPending() ||
      this.negotiationsQuery.isPending() ||
      this.catalogService.catalogQuery.isPending()
  );
  readonly hasQueriesError = computed(
    () =>
      this.negotiationsQuery.isError() ||
      this.negotiationsQuery.isError() ||
      this.catalogService.catalogQuery.isError()
  );
  readonly errorQueries = computed(
    () =>
      this.negotiationsQuery.error() ??
      this.negotiationsQuery.error() ??
      this.catalogService.catalogQuery.error()
  );

  // Data
  enrichedNegotiations = computed(() => {
    const negotiations = this.negotiationsQuery.data();
    const agreements = this.contractNegotiationService.agreementsById();
    const datasets = this.catalogService.datasetsById();
    // Todo: to be enabled when contract ready
    //const negotiationsRetired = this.contractNegotiationService.negotiationsRetiredQuery.data();
    return enrichNegotiations(negotiations, agreements, datasets);
  });
  readonly availableCounterParties = computed(() => {
    const negotiations = this.negotiationsQuery.data();
    return getAvailableCounterParties(negotiations);
  });
  readonly transfersInProgress = computed(() => this.transferProcessesStartedQuery.data());

  // filters + search
  readonly searchKey = computed(() => this.queryParamMap()?.get('searchBy'));
  filterControls = buildFilterControls();
  filters: Signal<FilterOption[]> = computed(() =>
    buildFilterOptions(
      this.filterControls,
      this.availableCounterParties(),
      this.clearQueryParams.bind(this)
    )
  );
  filterValues = signal<Record<string, string>>({});
  filteredNegotiations = computed(() => {
    const data = this.enrichedNegotiations();
    const { search, roleFilter, counterPartyFilter, stateFilter } = this.filterValues();
    return filterNegotiations(data, search, roleFilter, counterPartyFilter, stateFilter);
  });

  // others
  public errorMessage = '';
  protected readonly I18N = I18N;
  readonly queryParamMap = toSignal(this.route.queryParamMap);
  readonly extractShortParticipant = extractShortParticipantId;
  // Table
  public isTableLayout = false;
  public columns: ColumnDefinition<EnrichedNegotiation>[] = [
    {
      id: 'name',
      field: '',
      getter: (row: EnrichedNegotiation) => {
        return row.dataset?.name ?? row.agreement?.assetId ?? row.negotiation['@id'];
      },
      labelKey: 'Name',
      contentHasTooltip: true,
      cellStyle: { 'max-width': '150px' },
      contentStyle:
        'display: block; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;',
      canBeCopied: true
    },
    {
      id: 'participantId',
      field: '',
      getter: (row: EnrichedNegotiation) => {
        return this.extractShortParticipant(row.negotiation.counterPartyId || '').toUpperCase();
      },
      labelKey: 'Participant'
    },
    {
      id: 'type',
      field: 'negotiation.type',
      labelKey: 'Your Role'
    },
    {
      id: 'created-at',
      field: 'createdAt',
      getter: (row: EnrichedNegotiation) => {
        const agreementDate = (row?.agreement?.contractSigningDate || 0) * 1000;
        const date = agreementDate || row.negotiation.createdAt;
        return this.datePipe.transform(date);
      },
      labelKey: 'Created / Signed'
    },
    {
      id: 'state',
      field: 'state',
      labelKey: 'State',
      component: ContractNegotiationStateCellComponent
    },
    {
      id: 'actions',
      field: '',
      labelKey: 'Actions',
      component: ContractNegotiationTransferCellComponent
    }
  ];

  constructor() {
    effect(() => {
      if (this.hasQueriesError()) {
        const error = this.errorQueries() as HttpErrorResponse;
        this.toastService.showError(error?.message);
        this.errorMessage = `${error?.status} ${error?.statusText}`;
      }
    });

    effect(() => {
      const searchKey = this.searchKey();
      if (searchKey) {
        const counterPartyIdMatch = searchKey.match(/counterPartyId=([^,]*)/);
        const idMatch = searchKey.match(/id=([^,]*)/);
        if (counterPartyIdMatch) {
          this.filterControls.counterParty.patchValue(counterPartyIdMatch[1]);
        }
        if (idMatch) {
          this.filterControls.search.patchValue(idMatch[1]);
        }
      }
    });
  }

  viewDetails({ negotiation, agreement, dataset }: EnrichedNegotiation) {
    const modalRef = this.modalService.open(ContractNegotiationDetailsModalComponent, {
      size: 'xl',
      injector: this.injector
    });

    const componentInstance: ContractNegotiationDetailsModalComponent = modalRef.componentInstance;
    componentInstance.negotiation.set(negotiation);
    componentInstance.agreement.set(agreement);
    componentInstance.dataset.set(dataset);
    componentInstance.error.set(extractErrorReason(negotiation));
    componentInstance.transferProcessesStarted.set(this.transfersInProgress());
    modalRef.closed.subscribe((action: UIAction) => {
      if (action === UIAction.REFRESH) {
        this.negotiationsQuery.refetch();
      }
    });
  }

  async clearQueryParams() {
    await this.router.navigate(['/contract-management/contract-negotiation'], {
      queryParams: {}
    });
  }
}
