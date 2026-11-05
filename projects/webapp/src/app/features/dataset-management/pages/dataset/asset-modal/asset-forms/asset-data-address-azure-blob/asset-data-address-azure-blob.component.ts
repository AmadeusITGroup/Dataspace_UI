import { NgClass, NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  output,
  signal
} from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { SecretInput } from 'management-sdk';
import { I18N } from '../../../../../../../core/i18n/translation.en';
import { CRUD } from '../../../../../../../core/models/crud';
import { AzureBlobDataAddress, DataAddress } from '../../../../../model/asset/dataAddress';
import {
  transformInDataAddressAzureBlob,
  transformInSecretAzureBlob
} from '../../../../../utils/dataset.util';
import {
  StorageAccount,
  STORAGE_ACCOUNTS_REGISTRY_KEY,
  toSecretId
} from '../../../../../../settings/model/storage-account.model';
import {
  AzureStorageBrowserService,
  AzureContainer,
  AzureBlob
} from '../../../../../../settings/services/azure-storage-browser.service';
import { StorageAccountService } from '../../../../../../settings/services/storage-account.service';

@Component({
  selector: 'app-asset-data-address-azure-blob-component',
  templateUrl: './asset-data-address-azure-blob.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [ReactiveFormsModule, NgbTooltip, NgTemplateOutlet, NgClass],
  providers: [AzureStorageBrowserService, StorageAccountService]
})
export class AssetDataAddressAzureBlobComponent {
  protected readonly I18N = I18N;
  protected readonly CRUD = CRUD;

  readonly fb = inject(FormBuilder);
  readonly #azureBrowserService = inject(AzureStorageBrowserService);
  readonly #storageAccountService = inject(StorageAccountService);

  public dataAddress = input<DataAddress | null>();
  public secret = input<SecretInput | null>();
  public mode = input<CRUD>(CRUD.CREATE);

  public secretAction = output<{
    secret: SecretInput | undefined;
    dataAddress: DataAddress;
    action: CRUD | null;
  }>();

  public formSubmit = output<{
    form: FormGroup;
    dataAddress: DataAddress;
    secretInput: SecretInput | undefined;
    secretAction: CRUD | null;
  }>();

  dataAddressForm: FormGroup = this.fb.group({
    account: [{ value: '', disabled: false }, [Validators.required]],
    container: [{ value: '', disabled: false }, [Validators.required]],
    blobName: [{ value: '', disabled: false }],
    keyName: [{ value: '', disabled: false }, [Validators.required]],
    storageKey: [{ value: '', disabled: false }, [Validators.required]]
  });

  showSecret = false;

  // ── Browse mode ──────────────────────────────────────────────────────
  readonly registeredAccounts = signal<StorageAccount[]>(this.#loadRegisteredAccounts());
  readonly hasBrowseMode = signal(this.#loadRegisteredAccounts().length > 0);
  readonly browseMode = signal(false);
  readonly containers = signal<AzureContainer[]>([]);
  readonly blobs = signal<AzureBlob[]>([]);
  readonly loadingContainers = signal(false);
  readonly loadingBlobs = signal(false);
  readonly browseError = signal<string | null>(null);

  private get azureBlobDataAddress(): AzureBlobDataAddress | null {
    const dataAddress = this.dataAddress();
    return dataAddress && (dataAddress as AzureBlobDataAddress).type === 'AzureStorage'
      ? (dataAddress as AzureBlobDataAddress)
      : null;
  }

  constructor() {
    effect(() => {
      if (this.dataAddress()) {
        this.initializeForm();
      }
    });
  }

  private initializeForm(): void {
    const data = this.azureBlobDataAddress;
    if (!data) {
      return;
    }

    this.dataAddressForm.patchValue({
      account: data.account || '',
      container: data.container || '',
      blobName: data.blobName || '',
      keyName: data.keyName || this.secret()?.['@id'] || '',
      storageKey: this.secret()?.value || ''
    });

    if (this.secret()) {
      this.dataAddressForm.get('keyName')?.disable();
    } else {
      this.dataAddressForm.get('keyName')?.enable();
    }
  }

  public isFormValid(): boolean {
    this.dataAddressForm.markAllAsTouched();
    this.dataAddressForm.updateValueAndValidity({ onlySelf: true, emitEvent: false });
    return this.dataAddressForm.valid;
  }

  public emitFormSubmit(): void {
    const { secretAction, secretInput } = this.getSecretActionAndInput();
    const dataAddress = transformInDataAddressAzureBlob(
      this.dataAddressForm.getRawValue(),
      secretAction === CRUD.DELETE
    );

    if (
      this.isFormValid() &&
      (this.dataAddressForm.dirty || (secretAction === CRUD.DELETE && this.dataAddressForm.valid))
    ) {
      if (secretAction) {
        this.secretAction.emit({
          secret: secretInput,
          dataAddress,
          action: secretAction
        });
      }
      this.formSubmit.emit({
        form: this.dataAddressForm,
        dataAddress,
        secretInput,
        secretAction
      });
    }
  }

  private getSecretActionAndInput(): {
    secretAction: CRUD | null;
    secretInput: SecretInput | undefined;
  } {
    // In browse mode the account key is already stored in the vault
    // (registered via Settings > Storage Accounts), so no secret
    // operation is needed when creating or updating the asset.
    if (this.browseMode()) {
      return { secretAction: null, secretInput: undefined };
    }

    const formValues = this.dataAddressForm.getRawValue();
    const secret = transformInSecretAzureBlob(formValues);
    const hadSecret = !!this.secret();
    const hasSecretNow = !!secret?.value || !!secret?.['@id'];

    let secretAction: CRUD | null = null;
    let secretInput: SecretInput | undefined = undefined;

    if (hadSecret && !hasSecretNow) {
      secretAction = CRUD.DELETE;
      secretInput = this.secret()!;
    } else if (!hadSecret && hasSecretNow) {
      secretAction = CRUD.CREATE;
      secretInput = secret;
    } else if (hadSecret && hasSecretNow) {
      const isSecretUnchanged =
        secret?.value === this.secret()?.value && secret?.['@id'] === this.secret()?.['@id'];
      secretAction = isSecretUnchanged ? null : CRUD.UPDATE;
      secretInput = isSecretUnchanged ? undefined : secret;
    }

    return { secretAction, secretInput };
  }

  enableForm(): void {
    this.dataAddressForm.enable();
  }

  toggleSecret(): void {
    this.showSecret = !this.showSecret;
  }

  deleteSecret(): void {
    this.dataAddressForm.get('keyName')?.patchValue('');
    this.dataAddressForm.get('keyName')?.enable();
    this.dataAddressForm.get('storageKey')?.patchValue('');

    const secret = this.secret();
    this.dataAddressForm.markAsDirty();
    const dataAddress = transformInDataAddressAzureBlob(this.dataAddressForm.getRawValue());

    if (secret) {
      this.secretAction.emit({ secret, dataAddress, action: CRUD.DELETE });
    }
  }

  // ── Browse mode methods ──────────────────────────────────────────────

  toggleBrowseMode(): void {
    this.browseMode.update((v) => !v);
    if (this.browseMode()) {
      this.containers.set([]);
      this.blobs.set([]);
      this.browseError.set(null);
    }
  }

  async selectRegisteredAccount(accountName: string): Promise<void> {
    if (!accountName) {
      return;
    }

    const secretId = toSecretId(accountName);
    this.dataAddressForm.patchValue({ account: accountName, keyName: secretId });
    this.dataAddressForm.get('keyName')?.disable();
    this.dataAddressForm.markAsDirty();

    // Clear container/blob selections
    this.dataAddressForm.patchValue({ container: '', blobName: '' });
    this.containers.set([]);
    this.blobs.set([]);
    this.browseError.set(null);

    // Load the key from vault and fetch containers
    await this.loadContainers(accountName);
  }

  async loadContainers(accountName: string): Promise<void> {
    this.loadingContainers.set(true);
    this.browseError.set(null);
    try {
      const key = await this.#storageAccountService.getAccountKey(accountName);
      if (!key) {
        this.browseError.set(
          'Could not retrieve storage account key from vault. The secret may have been deleted.'
        );
        return;
      }
      // Store key temporarily in form for secret handling
      this.dataAddressForm.patchValue({ storageKey: key });
      const containers = await this.#azureBrowserService.listContainers(accountName, key);
      this.containers.set(containers);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to list containers';
      this.browseError.set(message);
    } finally {
      this.loadingContainers.set(false);
    }
  }

  async selectContainer(containerName: string): Promise<void> {
    if (!containerName) {
      return;
    }

    this.dataAddressForm.patchValue({ container: containerName, blobName: '' });
    this.dataAddressForm.markAsDirty();
    this.blobs.set([]);
    this.browseError.set(null);

    // Load blobs
    const accountName = this.dataAddressForm.getRawValue().account;
    await this.loadBlobs(accountName, containerName);
  }

  async loadBlobs(accountName: string, containerName: string): Promise<void> {
    this.loadingBlobs.set(true);
    this.browseError.set(null);
    try {
      const key = await this.#storageAccountService.getAccountKey(accountName);
      if (!key) {
        this.browseError.set('Could not retrieve storage account key from vault.');
        return;
      }
      const blobs = await this.#azureBrowserService.listBlobs(accountName, key, containerName);
      this.blobs.set(blobs);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to list blobs';
      this.browseError.set(message);
    } finally {
      this.loadingBlobs.set(false);
    }
  }

  selectBlob(blobName: string): void {
    this.dataAddressForm.patchValue({ blobName });
    this.dataAddressForm.markAsDirty();
  }

  #loadRegisteredAccounts(): StorageAccount[] {
    try {
      const raw = localStorage.getItem(STORAGE_ACCOUNTS_REGISTRY_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }
}
