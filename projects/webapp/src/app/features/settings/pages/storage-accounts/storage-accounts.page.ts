import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { EmptyPageMessageComponent } from '../../../../shared/components/empty-page-message/empty-page-message.component';
import { ConfirmationModalService } from '../../../../shared/components/confirmation-modal/confirmation-modal.service';
import { StorageAccountService } from '../../services/storage-account.service';
import { StorageAccountModalComponent } from '../../components/storage-account-modal/storage-account-modal.component';
import {
  StorageAccount,
  StorageAccountFormData,
  toSecretId
} from '../../model/storage-account.model';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [EmptyPageMessageComponent],
  templateUrl: 'storage-accounts.page.html',
  providers: [StorageAccountService]
})
export default class StorageAccountsPageComponent implements OnInit {
  readonly #modalService = inject(NgbModal);
  readonly #confirmationModalService = inject(ConfirmationModalService);
  readonly storageAccountService = inject(StorageAccountService);
  readonly toSecretId = toSecretId;

  ngOnInit(): void {
    this.storageAccountService.reconcileWithVault();
  }

  openAddModal(): void {
    const modalRef = this.#modalService.open(StorageAccountModalComponent);
    const existingNames = this.storageAccountService.accounts().map((a) => a.accountName);
    modalRef.componentInstance.existingNames.set(existingNames);

    modalRef.result.then(
      (formData: StorageAccountFormData) => {
        this.storageAccountService.createAccountMutation.mutate(formData);
      },
      () => {
        /* dismissed */
      }
    );
  }

  openEditModal(account: StorageAccount): void {
    const modalRef = this.#modalService.open(StorageAccountModalComponent);
    modalRef.componentInstance.account.set(account);

    modalRef.result.then(
      (formData: StorageAccountFormData) => {
        if (formData.accountKey) {
          // Key was changed, update the vault secret
          this.storageAccountService.updateAccountMutation.mutate(formData);
        } else {
          // Only label changed, update local registry only
          this.storageAccountService.accounts.update((accounts) =>
            accounts.map((a) =>
              a.accountName === formData.accountName ? { ...a, label: formData.label } : a
            )
          );
        }
      },
      () => {
        /* dismissed */
      }
    );
  }

  async deleteAccount(account: StorageAccount): Promise<void> {
    const confirmed = await this.#confirmationModalService.showDeleteConfirmationModal(
      'Remove Storage Account',
      `Are you sure you want to remove the storage account "${account.label || account.accountName}"? The vault secret will be deleted.`
    );
    if (confirmed) {
      this.storageAccountService.deleteAccountMutation.mutate(account.accountName);
    }
  }
}
