import { CommonModule, DatePipe } from '@angular/common';
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
import { PermissionService } from '../../../../core/services/permission.service';
import { ToastService } from '../../../../core/toasts/toast-service';
import { retrieveErrorMessage } from '../../../../core/utils/object.util';
import { ConfirmationModalService } from '../../../../shared/components/confirmation-modal/confirmation-modal.service';
import { EmptyPageMessageComponent } from '../../../../shared/components/empty-page-message/empty-page-message.component';
import { SpinnerComponent } from '../../../../shared/components/spinner/spinner.component';
import { TableComponent } from '../../../../shared/components/table/table.component';
import { ColumnDefinition } from '../../../../shared/components/table/table.model';
import { Asset } from '../../model/asset/asset';
import { HttpDataAddress } from '../../model/asset/dataAddress';
import { AssetManagementService } from '../../services/asset-management.service';
import { SecretManagementService } from '../../services/secret-management.service';
import * as datasetUtils from '../../utils/dataset.util';
import { AssetDetailsModalComponent } from './asset-modal/asset-details-modal.component';

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
  templateUrl: 'dataset.page.html',
  styleUrl: 'dataset.page.scss',
  providers: [AssetManagementService, DatePipe, SecretManagementService]
})
export default class DatasetPageComponent {
  // Services
  readonly #toastService = inject(ToastService);
  readonly #confirmationModalService = inject(ConfirmationModalService);
  readonly #datePipe = inject(DatePipe);
  readonly #modalService = inject(NgbModal);
  readonly permissionService = inject(PermissionService);
  // Queries
  readonly assetQuery = inject(AssetManagementService).assetsQuery;
  readonly deleteAssetQuery = inject(AssetManagementService).deleteAssetQuery;
  readonly deleteSecretQuery = inject(SecretManagementService).deleteSecretQuery;
  // Filters
  filterControls = {
    search: new FormControl(''),
    accessType: new FormControl(''),
    deliveryMethod: new FormControl(''),
    domainCategories: new FormControl(''),
    containsPII: new FormControl(''),
    containsPaymentInfo: new FormControl(''),
    accessLevel: new FormControl(''),
    licenses: new FormControl('')
  };
  filterValues = signal<Record<string, string>>({});

  filters: Signal<FilterOption[]> = computed(() => {
    return datasetUtils.buildFilterOptions(this.filterControls);
  });

  // data
  readonly filteredAssets = computed(() => {
    const data = this.assetQuery.data();
    if (!data) {
      return [];
    }
    const searchValues = this.filterValues();
    if (!searchValues) {
      return data;
    }
    return datasetUtils.filterAssetBySearch(data, this.filterValues());
  });

  // Others
  public idToHighlight: string | null = null;
  public errorMessage = '';
  protected readonly CRUD = CRUD;
  // Table
  public isTableLayout = false;
  public columns: ColumnDefinition<Asset>[] = [
    {
      id: 'id',
      field: '@id',
      getter: (row: Asset) => {
        return row?.properties?.name || row['@id'];
      },
      labelKey: 'Id',
      canBeCopied: true
    },
    {
      id: 'description',
      field: 'properties.description',
      labelKey: 'Description'
    },
    {
      id: 'version',
      field: 'properties.version',
      labelKey: 'Version'
    },
    {
      id: 'created-at',
      field: 'properties.createdAt',
      getter: (row: Asset) => {
        return this.#datePipe.transform(row?.properties?.createdAt);
      },
      labelKey: 'Created At'
    },
    {
      id: 'last-update-at',
      field: 'properties.createdAt',
      getter: (row: Asset) => {
        return this.#datePipe.transform(row?.properties?.updatedAt);
      },
      labelKey: 'Last Updated'
    },
    {
      id: 'actions',
      field: '',
      labelKey: '',
      actions: [
        {
          icon: 'bi-pencil',
          tooltip: 'Edit Asset',
          onClick: (row: Asset, event: Event) => {
            event.stopPropagation();
            this.viewCreateUpdateAsset(row, CRUD.UPDATE);
          }
        },
        {
          icon: 'bi-trash',
          class: 'btn-outline-danger',
          tooltip: 'Delete Asset',
          onClick: (row: Asset, event: Event) => {
            event.stopPropagation();
            this.deleteAssetConfirmation(row);
          }
        }
      ]
    }
  ];

  constructor() {
    effect(() => {
      if (this.assetQuery.isError()) {
        const error = this.assetQuery.error() as HttpErrorResponse;
        this.#toastService.showError(error?.message);
        this.errorMessage = `${error?.status} ${error?.statusText}`;
      }
    });
  }

  viewCreateUpdateAsset(asset: Asset | null, mode: CRUD) {
    const modalRef = this.#modalService.open(AssetDetailsModalComponent, { size: 'xl' });
    modalRef.componentInstance.asset.set(asset);
    modalRef.componentInstance.mode.set(mode);
    modalRef.componentInstance.deleteAsset.subscribe(async (asset: Asset) => {
      await this.performDelete(asset);
    });
    modalRef.result.then((result) => this.processAssetChanges(result));
  }

  async deleteAssetConfirmation(asset: Asset): Promise<void> {
    this.#confirmationModalService
      .showDeleteConfirmationModal(
        'Delete Asset',
        `Are you sure you want to delete the asset "${asset.properties?.name || asset['@id']}"? \n  Data corruption may occur!`
      )
      .then(async (result) => {
        if (result) {
          // Proceed with delete logic
          await this.performDelete(asset);
        }
      });
  }

  private async performDelete(asset: Asset): Promise<void> {
    try {
      await this.deleteSecret(asset);
      this.deleteAssetQuery.mutate(asset['@id']);
    } catch (error) {
      const errorMessage = retrieveErrorMessage(error);
      this.#toastService.showError(`Dataset not deleted due to secret error: ${errorMessage}`);
      return;
    }
  }

  deleteSecret(asset: Asset): Promise<void> {
    return new Promise((resolve) => {
      const dataAddress = asset.dataAddress;
      let secretId: string | undefined;

      if (dataAddress) {
        if (dataAddress.type === 'Kafka') {
          secretId = dataAddress.secretName;
        } else {
          const httpDataAddress = dataAddress as HttpDataAddress;
          secretId =
            httpDataAddress.secretName ||
            httpDataAddress['oauth2:privateKeyName'] ||
            httpDataAddress['oauth2:clientSecretKey'];
        }
      }

      if (!secretId) {
        resolve(); // No secret ID, no action needed
        return;
      }

      this.deleteSecretQuery.mutate(secretId, {
        onSuccess: () => resolve(),
        onError: () => resolve()
      });
    });
  }

  private processAssetChanges(result: Asset | string) {
    if (!result) {
      return;
    }
    this.idToHighlight = (result as Asset)['@id'];
  }
}
