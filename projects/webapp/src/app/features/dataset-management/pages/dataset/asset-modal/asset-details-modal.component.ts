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
import { SecretInput } from 'management-sdk';
import { CRUD } from '../../../../../core/models/crud';
import { FooterAction } from '../../../../../core/models/ui-action';
import { ToastService } from '../../../../../core/toasts/toast-service';
import { FooterActionModalComponent } from '../../../../../shared/components/delete-footer-modal/footer-action-modal.component';
import { Asset } from '../../../model/asset/asset';
import {
  AzureBlobDataAddress,
  DataAddress,
  HttpDataAddress,
  KafkaCompleteDataAddress,
  S3DataAddress
} from '../../../model/asset/dataAddress';
import { AssetManagementService } from '../../../services/asset-management.service';
import { SecretManagementService } from '../../../services/secret-management.service';
import { AssetDataAddressAzureBlobComponent } from './asset-forms/asset-data-address-azure-blob/asset-data-address-azure-blob.component';
import { AssetDataAddressKafkaComponent } from './asset-forms/asset-data-address-kafka/asset-data-address-kafka.component';
import { AssetDataAddressRestComponent } from './asset-forms/asset-data-address-rest/asset-data-address-rest.component';
import { AssetDataAddressS3Component } from './asset-forms/asset-data-address-s3/asset-data-address-s3.component';
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
    AssetDataAddressKafkaComponent,
    AssetDataAddressAzureBlobComponent,
    AssetDataAddressS3Component
  ],
  providers: [SecretManagementService, AssetManagementService],
  templateUrl: './asset-details-modal.component.html',
  styleUrl: './asset-details-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AssetDetailsModalComponent implements OnInit {
  readonly activeModal = inject(NgbActiveModal);
  readonly assetManagementService = inject(AssetManagementService);
  readonly secretManagementService = inject(SecretManagementService);
  readonly toastService = inject(ToastService);

  public asset = signal<Asset | null>(null);
  public mode = signal<CRUD>(CRUD.CREATE);
  public deleteAsset = output<Asset>();
  public footerAction = signal<FooterAction | null>(null);

  assetFormToSave = signal<Asset | undefined>(undefined);
  dataAddressFormToSave = signal<DataAddress | undefined>(undefined);
  secretFormToSave = signal<SecretInput | undefined>(undefined);
  secretActionToSave = signal<CRUD | null>(null);

  secret: Signal<SecretInput | null | undefined> = computed(() => this.secretByIdQuery.data());
  readonly secretByIdQuery = injectQuery(() =>
    this.secretManagementService.getSecretByIdQuery(this.secretId())
  );
  secretId = computed(() => {
    const dataAddress = this.asset()?.dataAddress;
    if (!dataAddress || dataAddress.type === 'S3Bucket') {
      return undefined;
    }

    if (dataAddress.type === 'AzureStorage') {
      return (dataAddress as AzureBlobDataAddress).keyName;
    }

    return (
      (dataAddress as HttpDataAddress)?.secretName ||
      (dataAddress as HttpDataAddress)?.['oauth2:clientSecretKey'] ||
      (dataAddress as HttpDataAddress)?.['oauth2:privateKeyName'] ||
      (dataAddress as KafkaCompleteDataAddress)?.secretName
    );
  });

  currentDeliveryMethod = signal<string>('Api');

  deliveryMethod = computed(
    () => this.currentDeliveryMethod() || this.asset()?.properties?.deliveryMethod || 'Api'
  );

  @ViewChild(AssetPropertiesFormComponent) formProperties!: AssetPropertiesFormComponent;
  @ViewChild(AssetDataAddressRestComponent) formDataAddress!: AssetDataAddressRestComponent;
  @ViewChild(AssetDataAddressKafkaComponent) formDataAddressKafka!: AssetDataAddressKafkaComponent;
  @ViewChild(AssetDataAddressAzureBlobComponent)
  formDataAddressAzureBlob!: AssetDataAddressAzureBlobComponent;
  @ViewChild(AssetDataAddressS3Component) formDataAddressS3!: AssetDataAddressS3Component;

  public readonly CRUD = CRUD;
  public readonly FooterAction = FooterAction;

  async ngOnInit(): Promise<void> {
    if (this.mode() !== CRUD.CREATE && !this.asset()) {
      this.toastService.showError('Asset not found for update.');
      this.activeModal.close();
    }

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

    const dataAddressForm =
      deliveryMethod === 'Kafka'
        ? this.formDataAddressKafka
        : deliveryMethod === 'AnalyticsDataset'
          ? this.formDataAddressS3
          : deliveryMethod === 'File'
            ? this.formDataAddressAzureBlob
            : this.formDataAddress;

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
    secretInput: SecretInput | undefined;
    dataAddress: DataAddress;
    secretAction: CRUD | null;
  }): void {
    this.dataAddressFormToSave.set(event.dataAddress);
    this.secretFormToSave.set(event.secretInput);
    this.secretActionToSave.set(event.secretAction);
  }

  onSecretActionEmit(event: {
    secret: SecretInput | undefined;
    dataAddress: DataAddress;
    action: CRUD | null;
  }): void {
    this.dataAddressFormToSave.set(event.dataAddress);
    this.secretFormToSave.set(event.action === CRUD.DELETE ? undefined : event.secret);
    this.secretActionToSave.set(event.action);
  }

  async handleAssetSave(
    updatedAsset: Asset | undefined,
    secret: SecretInput | undefined,
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
    const dataAddr = asset.dataAddress;
    if ((dataAddr as AzureBlobDataAddress).type === 'AzureStorage') {
      (dataAddr as AzureBlobDataAddress).keyName = '';
    } else if ((dataAddr as S3DataAddress).type === 'S3Bucket') {
      return;
    } else {
      const httpKafkaAddr = dataAddr as HttpDataAddress & KafkaCompleteDataAddress;
      httpKafkaAddr.secretName = '';
      httpKafkaAddr['oauth2:clientSecretKey'] = '';
      httpKafkaAddr['oauth2:privateKeyName'] = '';
      httpKafkaAddr['kafka:sasl:password'] = '';
    }
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

    this.formProperties.enableForm();
    if (deliveryMethod === 'Kafka') {
      this.formDataAddressKafka.enableForm();
    } else if (deliveryMethod === 'AnalyticsDataset') {
      this.formDataAddressS3.enableForm();
    } else if (deliveryMethod === 'File') {
      this.formDataAddressAzureBlob.enableForm();
    } else {
      this.formDataAddress.enableForm();
    }
  }

  async processSecretAction(action: CRUD | null, payload?: SecretInput | undefined): Promise<void> {
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

  private async createOrUpdateSecret(action: CRUD, payload?: SecretInput): Promise<void> {
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
