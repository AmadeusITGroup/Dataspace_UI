import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import {
  StorageAccount,
  STORAGE_ACCOUNTS_REGISTRY_KEY,
  toSecretId
} from '../../../settings/model/storage-account.model';
import {
  AzureStorageBrowserService,
  AzureContainer,
  AzureBlob
} from '../../../settings/services/azure-storage-browser.service';
import { StorageAccountService } from '../../../settings/services/storage-account.service';

export interface AzureBlobDestination {
  account: string;
  container: string;
  blobName?: string;
  keyName: string;
}

@Component({
  selector: 'app-transfer-destination-modal',
  templateUrl: './transfer-destination-modal.component.html',
  standalone: true,
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [AzureStorageBrowserService, StorageAccountService]
})
export class TransferDestinationModalComponent {
  readonly activeModal = inject(NgbActiveModal);
  private readonly fb = inject(FormBuilder);
  readonly #azureBrowserService = inject(AzureStorageBrowserService);
  readonly #storageAccountService = inject(StorageAccountService);

  destinationForm: FormGroup = this.fb.group({
    account: ['', [Validators.required]],
    container: ['', [Validators.required]],
    blobName: [''],
    keyName: ['', [Validators.required]]
  });

  // ── Browse mode ──────────────────────────────────────────────────────
  readonly registeredAccounts = signal<StorageAccount[]>(this.#loadRegisteredAccounts());
  readonly hasBrowseMode = signal(this.#loadRegisteredAccounts().length > 0);
  readonly browseMode = signal(false);
  readonly containers = signal<AzureContainer[]>([]);
  readonly blobs = signal<AzureBlob[]>([]);
  readonly loadingContainers = signal(false);
  readonly loadingBlobs = signal(false);
  readonly browseError = signal<string | null>(null);

  submit(): void {
    this.destinationForm.markAllAsTouched();
    if (this.destinationForm.valid) {
      const values = this.destinationForm.getRawValue();
      const destination: AzureBlobDestination = {
        account: values.account,
        container: values.container,
        blobName: values.blobName || undefined,
        keyName: values.keyName
      };
      this.activeModal.close(destination);
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
    this.destinationForm.patchValue({ account: accountName, keyName: secretId });
    this.destinationForm.get('keyName')?.disable();

    // Clear container/blob selections
    this.destinationForm.patchValue({ container: '', blobName: '' });
    this.containers.set([]);
    this.blobs.set([]);
    this.browseError.set(null);

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

    this.destinationForm.patchValue({ container: containerName, blobName: '' });
    this.blobs.set([]);
    this.browseError.set(null);

    const accountName = this.destinationForm.getRawValue().account;
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
    this.destinationForm.patchValue({ blobName });
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
