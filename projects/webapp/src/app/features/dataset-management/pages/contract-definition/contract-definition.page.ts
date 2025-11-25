import { CommonModule } from '@angular/common';
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
import { NgbDropdownModule, NgbModal, NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { ListSummaryComponent } from '../../../../core/components/list-summary/list-summary.component';
import { HighlightDirective } from '../../../../core/directives/highlight.directive';
import { I18N } from '../../../../core/i18n/translation.en';
import { CRUD } from '../../../../core/models/crud';
import { PolicyResponse } from '../../../../core/models/policy';
import { ToastService } from '../../../../core/toasts/toast-service';
import { isResourceNotFound } from '../../../../core/utils/object.util';
import { ConfirmationModalService } from '../../../../shared/components/confirmation-modal/confirmation-modal.service';
import { EmptyPageMessageComponent } from '../../../../shared/components/empty-page-message/empty-page-message.component';
import { SpinnerComponent } from '../../../../shared/components/spinner/spinner.component';
import { TableComponent } from '../../../../shared/components/table/table.component';
import { ColumnDefinition } from '../../../../shared/components/table/table.model';
import { Asset } from '../../model/asset/asset';
import { ContractDefinition } from '../../model/contract/contract-definition.model';
import { AssetManagementService } from '../../services/asset-management.service';
import { ContractDefinitionManagementService } from '../../services/contract-definition-management.service';
import { PolicyManagementService } from '../../services/policy-management.service';
import { ContractFormModalComponent } from './contract-modal/contract-form-modal.component';
import { FilterOption } from '../../../../core/components/filters/filter-option.model';
import {
  buildFilterOptions,
  buildTypeheadList,
  filterContractDefinition
} from '../../utils/contract-definition.util';
import { FiltersComponent } from '../../../../core/components/filters/filters.component';

@Component({
  templateUrl: 'contract-definition.page.html',
  providers: [AssetManagementService, ContractDefinitionManagementService, PolicyManagementService],
  imports: [
    ReactiveFormsModule,
    CommonModule,
    HighlightDirective,
    SpinnerComponent,
    NgbDropdownModule,
    EmptyPageMessageComponent,
    NgbTooltip,
    TableComponent,
    ListSummaryComponent,
    FiltersComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export default class ContractDefinitionPageComponent {
  // services
  readonly #toastService = inject(ToastService);
  readonly #modalService = inject(NgbModal);
  readonly #confirmationModalService = inject(ConfirmationModalService);
  // queries
  readonly contractDefinitionQuery = inject(ContractDefinitionManagementService)
    .contractDefinitionQuery;
  readonly assetsQuery = inject(AssetManagementService).assetsQuery;
  readonly policiesQuery = inject(PolicyManagementService).policiesQuery;
  readonly deleteQuery = inject(ContractDefinitionManagementService).deleteContractDefinitionQuery;
  // filters + search
  filters: Signal<FilterOption[]> = computed(() => buildFilterOptions());
  filterValues = signal<Record<string, string>>({});
  // data
  readonly assetIds: Signal<string[]> = computed(() => {
    return buildTypeheadList(this.contractDefinitionQuery.data() || [], 'assetName');
  });
  readonly policyIds: Signal<string[]> = computed(() => {
    return buildTypeheadList(this.contractDefinitionQuery.data() || [], 'accessPolicyId');
  });
  readonly filteredContractDefinitions = computed((): ContractDefinition[] => {
    const data = this.contractDefinitionQuery.data();
    const filterValues = this.filterValues();
    if (!data) {
      return [];
    }
    return filterContractDefinition(data, filterValues);
  });
  // others
  public idToHighlight: string | null = null;
  public errorMessage = '';
  readonly CRUD = CRUD;
  readonly I18N = I18N;
  // table
  public isTableLayout = false;
  public columns: ColumnDefinition<ContractDefinition>[] = [
    {
      id: 'id',
      field: '@id',
      labelKey: 'Id',
      canBeCopied: true,
      contentStyle:
        'display: block; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;',
      cellStyle: { width: '365px' }
    },
    {
      id: 'name',
      field: 'assetName',
      labelKey: 'For dataset',
      canBeCopied: true,
      cellStyle: { 'max-width': '200px' }
    },
    {
      id: 'contractPolicyId',
      field: 'contractPolicyId',
      labelKey: 'Contract Policy Id',
      canBeCopied: true,
      contentStyle:
        'display: block; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;'
    },
    {
      id: 'accessPolicyId',
      field: 'accessPolicyId',
      labelKey: 'Access Policy Id',
      canBeCopied: true,
      contentStyle:
        'display: block; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;'
    },
    {
      id: 'actions',
      field: '',
      labelKey: '',
      actions: [
        {
          icon: 'bi-pencil',
          tooltip: 'Edit Offer',
          onClick: (row: ContractDefinition, event: Event) => {
            event.stopPropagation();
            this.createUpdateContractDefinition(row, CRUD.UPDATE);
          }
        },
        {
          icon: 'bi-trash',
          class: 'btn-outline-danger',
          tooltip: 'Delete Offer',
          onClick: (row: ContractDefinition, event: Event) => {
            event.stopPropagation();
            this.deleteContractDefinitionConfirmation(row);
          }
        }
      ]
    }
  ];

  constructor() {
    effect(() => {
      if (this.assetsQuery.isError()) {
        const error = this.assetsQuery.error() as HttpErrorResponse;
        this.#toastService.showError(error?.message);
        this.errorMessage = `${error?.status} ${error?.statusText}`;
      }
    });
  }

  createUpdateContractDefinition(contractDefinition: ContractDefinition | null, mode: CRUD) {
    const modalRef = this.#modalService.open(ContractFormModalComponent, { size: 'lg' });
    modalRef.componentInstance.contractDef.set(contractDefinition);
    modalRef.componentInstance.mode.set(mode);
    modalRef.componentInstance.assets.set(this.assetsQuery.data());
    modalRef.componentInstance.policies.set(this.policiesQuery.data());
    // Delete immediately without passing by confirmation
    modalRef.componentInstance.deleteContract.subscribe(this.deleteContractDefinition.bind(this));

    modalRef.result.then((result) => {
      if (result) {
        this.idToHighlight = (result as ContractDefinition)['@id'];
        this.contractDefinitionQuery.refetch();
      }
    });
  }

  private filterContractDefinitionBySearch(
    contractDefinitions: ContractDefinition[],
    value: string
  ): ContractDefinition[] {
    const researchedValue = value.toLowerCase();
    return contractDefinitions.filter((contractDefinition) => {
      return (
        contractDefinition['@id'].toLowerCase().includes(researchedValue) ||
        contractDefinition.contractPolicyId?.includes(researchedValue) ||
        contractDefinition.accessPolicyId?.includes(researchedValue) ||
        contractDefinition.assetName?.includes(researchedValue)
      );
    });
  }

  deleteContractDefinitionConfirmation(contractDefinition: ContractDefinition) {
    this.#confirmationModalService
      .showDeleteConfirmationModal(
        'Delete Offer',
        `Are you sure you want to delete Offer "${contractDefinition['@id']}"?`
      )
      .then((result) => {
        if (result) {
          this.deleteContractDefinition(contractDefinition);
        }
      });
  }

  deleteContractDefinition(contractDefinition: ContractDefinition) {
    this.deleteQuery.mutate(contractDefinition['@id'], {
      onSuccess: () => {
        this.#toastService.showSuccess(
          `The Offer ${contractDefinition['@id']} has been deleted successfully`
        );
        this.contractDefinitionQuery.refetch();
      },
      onError: (error: Error) => {
        const errorBE = error as HttpErrorResponse;
        console.error(error);
        this.#toastService.showError('Error deleting Offer: ' + errorBE.error[0].message);
      }
    });
  }

  isAssetNotFound(assetId: string | undefined, assets: Asset[] | undefined): boolean {
    return isResourceNotFound<Asset>(assetId, assets, '@id');
  }

  isPolicyNotFound(policyId: string | undefined, policies: PolicyResponse[] | undefined): boolean {
    return isResourceNotFound<PolicyResponse>(policyId, policies, '@id');
  }
}
