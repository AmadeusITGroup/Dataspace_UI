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
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { NgbDropdownModule, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { FilterOption } from '../../../../core/components/filters/filter-option.model';
import { FiltersComponent } from '../../../../core/components/filters/filters.component';
import { ListSummaryComponent } from '../../../../core/components/list-summary/list-summary.component';
import { HighlightDirective } from '../../../../core/directives/highlight.directive';
import { CRUD } from '../../../../core/models/crud';
import { PolicyResponse } from '../../../../core/models/policy';
import { ToastService } from '../../../../core/toasts/toast-service';
import { ConfirmationModalService } from '../../../../shared/components/confirmation-modal/confirmation-modal.service';
import { EmptyPageMessageComponent } from '../../../../shared/components/empty-page-message/empty-page-message.component';
import { SpinnerComponent } from '../../../../shared/components/spinner/spinner.component';
import { TableComponent } from '../../../../shared/components/table/table.component';
import { ColumnDefinition } from '../../../../shared/components/table/table.model';
import { PolicyManagementService } from '../../services/policy-management.service';
import * as policyUtils from '../../utils/policy.util';
import { PolicyDetailsModalComponent } from './policy-modal/policy-details-modal.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    CommonModule,
    SpinnerComponent,
    NgbDropdownModule,
    HighlightDirective,
    EmptyPageMessageComponent,
    TableComponent,
    ListSummaryComponent,
    FiltersComponent
  ],
  templateUrl: 'policy.page.html',
  providers: [PolicyManagementService]
})
export default class PolicyPageComponent {
  // services
  readonly #toastService = inject(ToastService);
  readonly #modalService = inject(NgbModal);
  readonly #confirmationModalService = inject(ConfirmationModalService);
  // queries
  readonly policyQuery = inject(PolicyManagementService).policiesQuery;
  readonly deleteQuery = inject(PolicyManagementService).deletePolicyQuery;
  // filters
  filterValues = signal<Record<string, string>>({});

  filterControls = {
    policySearch: new FormControl('')
  };
  filters: Signal<FilterOption[]> = computed(() => {
    return policyUtils.buildFilterOptions(this.filterControls);
  });
  // data
  readonly filteredPolicies = computed(() => {
    const data = this.policyQuery.data();
    if (!data) {
      return [];
    }
    const searchValue = this.filterValues();
    return searchValue ? this.filterPolicyResponseBySearch(data, searchValue) : data;
  });
  // others
  public idToHighlight: string | null = null;
  public errorMessage = '';
  public readonly CRUD = CRUD;
  // table
  public isTableLayout = false;
  public columns: ColumnDefinition<PolicyResponse>[] = [
    {
      id: 'id',
      field: '@id',
      labelKey: 'Id',
      canBeCopied: true
    },
    {
      id: 'permission',
      field: 'policy.odrl:permission',
      getter: (row: PolicyResponse) => {
        return row?.policy?.['odrl:permission'].length || 0;
      },
      labelKey: 'Nb. Permission'
    },
    {
      id: 'obligation',
      field: 'policy.odrl:obligation',
      getter: (row: PolicyResponse) => {
        return row?.policy?.['odrl:obligation'].length || 0;
      },
      labelKey: 'Nb. Obligation'
    },
    {
      id: 'prohibition',
      field: 'policy.odrl:prohibition',
      getter: (row: PolicyResponse) => {
        return row?.policy?.['odrl:prohibition'].length || 0;
      },
      labelKey: 'Nb. Prohibition'
    },
    {
      id: 'actions',
      field: '',
      labelKey: '',
      actions: [
        {
          icon: 'bi-pencil',
          tooltip: 'Edit Policy',
          onClick: (row: PolicyResponse, event: Event) => {
            event.stopPropagation();
            this.viewCreateUpdatePolicy(row, CRUD.UPDATE);
          }
        },
        {
          icon: 'bi-trash',
          class: 'btn-outline-danger',
          tooltip: 'Delete Policy',
          onClick: (row: PolicyResponse, event: Event) => {
            event.stopPropagation();
            this.deletePolicyConfirmation(row);
          }
        }
      ]
    }
  ];

  constructor() {
    effect(() => {
      if (this.policyQuery.isError()) {
        const error = this.policyQuery.error() as HttpErrorResponse;
        this.#toastService.showError(error?.message);
        this.errorMessage = `${error?.status} ${error?.statusText}`;
      }
    });
  }

  viewCreateUpdatePolicy(policyR: PolicyResponse | null, mode: CRUD) {
    const modalRef = this.#modalService.open(PolicyDetailsModalComponent, { size: 'lg' });
    modalRef.componentInstance.policyR.set(policyR);
    modalRef.componentInstance.mode.set(mode);
    // delete policy without having a confirmation
    modalRef.componentInstance.deletePolicy.subscribe(this.deletePolicy.bind(this));
    modalRef.result.then((result) => {
      if (result) {
        this.idToHighlight = result;
      }
    });
  }

  private filterPolicyResponseBySearch(
    policiesR: PolicyResponse[],
    value: Record<string, string>
  ): PolicyResponse[] {
    const researchedValue = value['policySearch']?.toLowerCase();
    return policiesR.filter((policyR) => {
      return policyR['@id'].toLowerCase().includes(researchedValue);
    });
  }

  deletePolicyConfirmation(policyR: PolicyResponse) {
    this.#confirmationModalService
      .showDeleteConfirmationModal(
        'Delete Policy',
        `Are you sure you want to delete policy "${policyR.policy.uid || policyR['@id']}"?`
      )
      .then((result) => {
        if (result) {
          // Proceed with delete logic
          this.deletePolicy(policyR);
        }
      });
  }

  private deletePolicy(policyR: PolicyResponse) {
    this.deleteQuery.mutate(policyR, {
      onSuccess: () => {
        this.#toastService.showSuccess('The policy has been deleted successfully');
        this.policyQuery.refetch();
      },
      onError: (error: Error) => {
        const errorBE = error as HttpErrorResponse;
        console.error(error);
        this.#toastService.showError('Error deleting policy: ' + errorBE.error[0].message);
      }
    });
  }
}
