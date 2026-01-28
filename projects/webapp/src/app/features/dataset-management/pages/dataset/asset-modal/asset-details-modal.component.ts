import { DatePipe, NgClass } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  output,
  Signal,
  signal,
  ViewChild
} from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { SecretInputV3 } from 'management-sdk';
import { CRUD } from '../../../../../core/models/crud';
import { FooterAction } from '../../../../../core/models/ui-action';
import { ToastService } from '../../../../../core/toasts/toast-service';
import { FooterActionModalComponent } from '../../../../../shared/components/delete-footer-modal/footer-action-modal.component';
import { Asset } from '../../../model/asset/asset';
import {
  DataAddress,
  HttpDataAddress,
  KafkaCompleteDataAddress
} from '../../../model/asset/dataAddress';
import { AssetManagementService } from '../../../services/asset-management.service';
import { SecretManagementService } from '../../../services/secret-management.service';
import { AssetDataAddressKafkaComponent } from './asset-forms/asset-data-address-kafka/asset-data-address-kafka.component';
import { AssetDataAddressRestComponent } from './asset-forms/asset-data-address-rest/asset-data-address-rest.component';
import { AssetPropertiesFormComponent } from './asset-forms/asset-properties/asset-properties-form.component';
import { AssetViewComponent } from './asset-view/asset-view.component';

@Component({
  selector: 'app-asset-details-modal',
  imports: [
    ReactiveFormsModule,
    AssetViewComponent,
    AssetPropertiesFormComponent,
    DatePipe,
    FooterActionModalComponent,
    NgClass,
    AssetDataAddressRestComponent,
    AssetDataAddressKafkaComponent
  ],
  providers: [SecretManagementService, AssetManagementService],
  templateUrl: './asset-details-modal.component.html',
  styleUrl: './asset-details-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AssetDetailsModalComponent implements OnInit {
  // Services
  readonly activeModal = inject(NgbActiveModal);
  readonly assetManagementService = inject(AssetManagementService);
  readonly secretManagementService = inject(SecretManagementService);
  readonly toastService = inject(ToastService);

  // Signals and state
  public asset = signal<Asset | null>(null);
  public mode = signal<CRUD>(CRUD.CREATE);
  public deleteAsset = output<Asset>();
  public footerAction = signal<FooterAction | null>(null);

  // Form outputs
  assetFormToSave = signal<Asset | undefined>(undefined);
  dataAddressFormToSave = signal<DataAddress | undefined>(undefined);
  secretFormToSave = signal<SecretInputV3 | undefined>(undefined);
  secretActionToSave = signal<CRUD | null>(null);

  // Secret signals
  secret: Signal<SecretInputV3 | null | undefined> = computed(() => this.secretByIdQuery.data());
  readonly secretByIdQuery = injectQuery(() =>
    this.secretManagementService.getSecretByIdQuery(this.secretId())
  );
  secretId = computed(() => {
    const asset = this.asset();
    return (
      asset?.dataAddress.secretName ||
      (asset?.dataAddress as HttpDataAddress)?.['oauth2:clientSecretKey'] ||
      (asset?.dataAddress as HttpDataAddress)?.['oauth2:privateKeyName'] ||
      (asset?.dataAddress as KafkaCompleteDataAddress)?.['kafka:sasl:username']
    );
  });

  // Current delivery method signal (tracks form changes)
  currentDeliveryMethod = signal<string>('Api');

  // Computed delivery method
  deliveryMethod = computed(
    () => this.currentDeliveryMethod() || this.asset()?.properties?.deliveryMethod || 'Api'
  );

  // ViewChild references
  @ViewChild(AssetPropertiesFormComponent) formProperties: AssetPropertiesFormComponent =
    new AssetPropertiesFormComponent();
  @ViewChild(AssetDataAddressRestComponent) formDataAddress = new AssetDataAddressRestComponent();
  @ViewChild(AssetDataAddressKafkaComponent) formDataAddressKafka =
    new AssetDataAddressKafkaComponent();

  // Constants
  public readonly CRUD = CRUD;
  public readonly FooterAction = FooterAction;

  async ngOnInit(): Promise<void> {
    if (this.mode() !== CRUD.CREATE && !this.asset()) {
      this.toastService.showError('Asset not found for update.');
      this.activeModal.close();
    }

    // Initialize currentDeliveryMethod with the asset's delivery method
    const initialDeliveryMethod = this.asset()?.properties?.deliveryMethod || '';
    this.currentDeliveryMethod.set(initialDeliveryMethod);
  }

  toggleEdit(): void {
    if (this.mode() === CRUD.READ) {
      this.mode.set(CRUD.UPDATE);
    } else if (this.mode() === CRUD.UPDATE) {
      this.mode.set(CRUD.READ);
    } else {
      this.activeModal.close();
    }
  }

  public onActionClicked(event: { action: FooterAction; reason: string }): void {
    if (event.action === FooterAction.DELETE) {
      this.deleteCurrentAsset();
    }
  }

  private deleteCurrentAsset(): void {
    const asset = this.asset();
    if (!asset) {
      this.toastService.showError('No asset to delete.');
      return;
    }
    this.deleteAsset.emit(asset);
    this.activeModal.close();
  }

  public submitPending = computed(
    () =>
      this.assetManagementService.createAssetQuery.status() === 'pending' ||
      this.assetManagementService.updateAssetQuery.status() === 'pending'
  );

  submitAllForms(): void {
    const deliveryMethod = this.deliveryMethod();
    const isKafka = deliveryMethod === 'Kafka';

    // Select the appropriate data address form based on delivery method
    const dataAddressForm = isKafka ? this.formDataAddressKafka : this.formDataAddress;

    const anyFormInvalid = !this.formProperties.isFormValid() || !dataAddressForm.isFormValid();
    const areFormsNotTouched =
      !this.formProperties.assetForm.dirty && !dataAddressForm.dataAddressForm.dirty;

    if (anyFormInvalid) {
      this.formProperties.assetForm.markAllAsTouched();
      dataAddressForm.dataAddressForm.markAllAsTouched();
      return;
    }
    if (areFormsNotTouched) {
      this.activeModal.close();
      return;
    }

    this.formProperties.emitFormSubmit();
    dataAddressForm.emitFormSubmit();

    const assetToSave = this.assetFormToSave() || this.asset();
    const dataAddressToSave = this.dataAddressFormToSave() || this.asset()?.dataAddress;

    if (!assetToSave || !dataAddressToSave) {
      console.warn('Missing asset or data address output, cannot proceed.');
      return;
    }

    const updatedAsset: Asset = {
      ...assetToSave,
      dataAddress: dataAddressToSave
    };

    this.handleAssetSave(updatedAsset, this.secretFormToSave(), this.secretActionToSave());
  }

  onAssetFormSubmit(event: { form: FormGroup; assetInput: Asset | undefined }): void {
    this.assetFormToSave.set(event.assetInput);
  }

  onDeliveryMethodChange(deliveryMethod: string): void {
    this.currentDeliveryMethod.set(deliveryMethod);
  }

  onConnectorFormSubmit(event: {
    form: FormGroup;
    secretInput: SecretInputV3 | undefined;
    dataAddress: DataAddress;
    secretAction: CRUD | null;
  }): void {
    this.dataAddressFormToSave.set(event.dataAddress);
    this.secretFormToSave.set(event.secretInput);
    this.secretActionToSave.set(event.secretAction);
  }

  onSecretActionEmit(event: {
    secret: SecretInputV3 | undefined;
    dataAddress: DataAddress;
    action: CRUD | null;
  }): void {
    this.dataAddressFormToSave.set(event.dataAddress);
    this.secretFormToSave.set(event.action === CRUD.DELETE ? undefined : event.secret);
    this.secretActionToSave.set(event.action);
  }

  async handleAssetSave(
    updatedAsset: Asset | undefined,
    secret: SecretInputV3 | undefined,
    secretAction: CRUD | null
  ): Promise<void> {
    try {
      await this.processSecretAction(secretAction, secret);
      if (updatedAsset) {
        this.performAssetOperation(updatedAsset);
      }
    } catch (error) {
      console.warn('Problem with secret operation so dataset Secret Name is removed', error);
      if (updatedAsset) {
        this.clearSecretData(updatedAsset);
        this.performAssetOperation(updatedAsset);
      } else {
        this.enableForms();
      }
    }
  }

  private clearSecretData(asset: Asset): void {
    const dataAddr = asset.dataAddress as HttpDataAddress & KafkaCompleteDataAddress;
    dataAddr.secretName = '';
    dataAddr['oauth2:clientSecretKey'] = '';
    dataAddr['oauth2:privateKeyName'] = '';
    dataAddr['kafka:sasl:password'] = '';
  }

  private performAssetOperation(updatedAsset: Asset): void {
    const assetOperationQuery =
      this.mode() === CRUD.UPDATE
        ? this.assetManagementService.updateAssetQuery
        : this.assetManagementService.createAssetQuery;

    assetOperationQuery.mutate(updatedAsset, {
      onSuccess: () => {
        this.mode.set(CRUD.READ);
        this.asset.set(updatedAsset);
      },
      onError: () => this.enableForms()
    });
  }

  private enableForms(): void {
    const deliveryMethod = this.deliveryMethod();
    const isKafka = deliveryMethod === 'Kafka';

    this.formProperties.enableForm();
    if (isKafka) {
      this.formDataAddressKafka.enableForm();
    } else {
      this.formDataAddress.enableForm();
    }
  }

  async processSecretAction(
    action: CRUD | null,
    payload?: SecretInputV3 | undefined
  ): Promise<void> {
    switch (action) {
      case CRUD.CREATE:
      case CRUD.UPDATE:
        await this.createOrUpdateSecret(action, payload);
        break;
      case CRUD.DELETE:
        await this.removeSecret();
        break;
      case null:
      default:
        return;
    }
  }

  private async createOrUpdateSecret(action: CRUD, payload?: SecretInputV3): Promise<void> {
    if (!payload) return;
    const serviceQuery =
      action === CRUD.CREATE
        ? this.secretManagementService.createSecretQuery
        : this.secretManagementService.updateSecretQuery;

    await new Promise<void>((resolve, reject) => {
      serviceQuery.mutate(payload, {
        onSuccess: () => resolve(),
        onError: () => reject()
      });
    });
  }

  private async removeSecret(): Promise<void> {
    const secretId = this.secret()?.['@id'];
    if (!secretId) return;
    await new Promise<void>((resolve, reject) => {
      this.secretManagementService.deleteSecretQuery.mutate(secretId, {
        onSuccess: () => {
          this.enableAuthGroups();
          resolve();
        },
        onError: () => reject()
      });
    });
  }

  private enableAuthGroups(): void {
    const dataAddress = this.formDataAddress.dataAddressForm;
    if (dataAddress) {
      const authGroup = dataAddress.get('baseAuth') || dataAddress.get('oAuth2');
      authGroup?.enable();
    }
  }
}
