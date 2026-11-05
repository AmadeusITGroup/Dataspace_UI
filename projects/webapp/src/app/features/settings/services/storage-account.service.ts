import { inject, Injectable, signal } from '@angular/core';
import { SecretInput, SecretV3Service } from 'management-sdk';
import { injectMutation } from '@tanstack/angular-query-experimental';
import { lastValueFrom } from 'rxjs';
import { addContext, normalizeJsonLD } from '../../../jsonld';
import { ToastService } from '../../../core/toasts/toast-service';
import { composedErrorMessage } from '../../../core/utils/object.util';
import {
  StorageAccount,
  StorageAccountFormData,
  STORAGE_ACCOUNTS_REGISTRY_KEY,
  toAccidentalSecretId,
  toLegacySecretId,
  toSecretId
} from '../model/storage-account.model';

const getKnownSecretIds = (accountName: string): string[] =>
  Array.from(
    new Set([
      toSecretId(accountName),
      toAccidentalSecretId(accountName),
      toLegacySecretId(accountName)
    ])
  );

/**
 * Service for managing Azure Storage account registrations.
 *
 * Account keys are stored in the EDC vault as secrets.
 * The registry of account names + labels is kept in localStorage
 * (since the vault API has no list/query endpoint).
 *
 * On initialization, call {@link reconcileWithVault} to prune any
 * localStorage entries whose vault secrets have been deleted externally.
 */
@Injectable()
export class StorageAccountService {
  readonly #secretsV3 = inject(SecretV3Service);
  readonly #toastService = inject(ToastService);

  /** Reactive signal holding the current list of registered accounts. */
  readonly accounts = signal<StorageAccount[]>(this.#loadFromLocalStorage());

  /** Whether vault reconciliation is currently in progress. */
  readonly reconciling = signal(false);

  // ── Mutations ──────────────────────────────────────────────────────────

  readonly createAccountMutation = injectMutation(() => ({
    mutationKey: ['createStorageAccount'],
    onSuccess: (_data: unknown, formData: StorageAccountFormData) => {
      this.#addToRegistry({ accountName: formData.accountName, label: formData.label });
      this.#toastService.showSuccess(
        `Storage account "${formData.accountName}" was registered successfully.`
      );
    },
    onError: (error: Error) => {
      const msg = composedErrorMessage(error, 'registering', 'storage account');
      this.#toastService.showError(msg);
    },
    mutationFn: (formData: StorageAccountFormData) =>
      this.#upsertSecret(toSecretId(formData.accountName), formData.accountKey)
  }));

  readonly updateAccountMutation = injectMutation(() => ({
    mutationKey: ['updateStorageAccount'],
    onSuccess: (_data: unknown, formData: StorageAccountFormData) => {
      this.#updateInRegistry({ accountName: formData.accountName, label: formData.label });
      this.#toastService.showSuccess(
        `Storage account "${formData.accountName}" was updated successfully.`
      );
    },
    onError: (error: Error) => {
      const msg = composedErrorMessage(error, 'updating', 'storage account');
      this.#toastService.showError(msg);
    },
    mutationFn: async (formData: StorageAccountFormData) => {
      const secretId = toSecretId(formData.accountName);
      const compatibilitySecretIds = getKnownSecretIds(formData.accountName).filter(
        (candidate) => candidate !== secretId
      );

      await this.#upsertSecret(secretId, formData.accountKey);

      for (const compatibilitySecretId of compatibilitySecretIds) {
        if (await this.#secretExists(compatibilitySecretId)) {
          await this.#upsertSecret(compatibilitySecretId, formData.accountKey);
        }
      }
    }
  }));

  readonly deleteAccountMutation = injectMutation(() => ({
    mutationKey: ['deleteStorageAccount'],
    onSuccess: (_data: unknown, accountName: string) => {
      this.#removeFromRegistry(accountName);
      this.#toastService.showSuccess(`Storage account "${accountName}" was removed successfully.`);
    },
    onError: (error: Error) => {
      const msg = composedErrorMessage(error, 'removing', 'storage account');
      this.#toastService.showError(msg);
    },
    mutationFn: async (accountName: string) => {
      const secretIds = getKnownSecretIds(accountName);
      let deleted = false;

      for (const secretId of secretIds) {
        try {
          await lastValueFrom(this.#secretsV3.removeSecretV3(secretId));
          deleted = true;
        } catch {
          // try next known secret ID format
        }
      }

      if (!deleted) {
        throw new Error(`Storage account secret for "${accountName}" was not found.`);
      }
    }
  }));

  // ── Public helpers ─────────────────────────────────────────────────────

  /**
   * Reconciles the localStorage registry with the vault.
   *
   * For each registered account, verifies that the corresponding vault
   * secret still exists. Accounts whose secrets have been deleted
   * externally are pruned from the registry.
   */
  async reconcileWithVault(): Promise<void> {
    const current = this.accounts();
    if (current.length === 0) return;

    this.reconciling.set(true);
    try {
      const results = await Promise.all(
        current.map(async (account) => {
          try {
            await this.#getSecretOutput(account.accountName);
            return { account, exists: true };
          } catch {
            return { account, exists: false };
          }
        })
      );

      const surviving = results.filter((r) => r.exists).map((r) => r.account);
      const removed = results.filter((r) => !r.exists).map((r) => r.account);

      if (removed.length > 0) {
        this.#saveToLocalStorage(surviving);
        this.accounts.set(surviving);
      }
    } finally {
      this.reconciling.set(false);
    }
  }

  /**
   * Checks if an account with the given name is already registered.
   */
  isRegistered(accountName: string): boolean {
    return this.accounts().some((a) => a.accountName === accountName);
  }

  /**
   * Retrieves the vault secret for an account (to verify it exists or get the key).
   * Returns null if the secret is not found.
   */
  async getAccountKey(accountName: string): Promise<string | null> {
    try {
      const result = await this.#getSecretOutput(accountName);
      const normalized = await normalizeJsonLD<SecretInput>(result);
      return normalized.value ?? null;
    } catch {
      return null;
    }
  }

  // ── Private: localStorage registry ─────────────────────────────────────

  #loadFromLocalStorage(): StorageAccount[] {
    try {
      const raw = localStorage.getItem(STORAGE_ACCOUNTS_REGISTRY_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  #saveToLocalStorage(accounts: StorageAccount[]): void {
    localStorage.setItem(STORAGE_ACCOUNTS_REGISTRY_KEY, JSON.stringify(accounts));
  }

  #addToRegistry(account: StorageAccount): void {
    const current = this.accounts();
    const updated = [...current, account];
    this.#saveToLocalStorage(updated);
    this.accounts.set(updated);
  }

  #updateInRegistry(account: StorageAccount): void {
    const current = this.accounts();
    const updated = current.map((a) =>
      a.accountName === account.accountName ? { ...a, label: account.label } : a
    );
    this.#saveToLocalStorage(updated);
    this.accounts.set(updated);
  }

  #removeFromRegistry(accountName: string): void {
    const current = this.accounts();
    const updated = current.filter((a) => a.accountName !== accountName);
    this.#saveToLocalStorage(updated);
    this.accounts.set(updated);
  }

  async #getSecretOutput(accountName: string) {
    const secretId = toSecretId(accountName);
    let lastError: unknown;

    for (const candidateSecretId of getKnownSecretIds(accountName)) {
      try {
        const secret = await this.#readSecret(candidateSecretId);
        if (candidateSecretId !== secretId) {
          const normalized = await normalizeJsonLD<SecretInput>(secret);
          if (normalized.value) {
            await this.#upsertSecret(secretId, normalized.value);
          }
        }
        return secret;
      } catch (error) {
        lastError = error;
      }
    }

    throw lastError;
  }

  async #secretExists(secretId: string): Promise<boolean> {
    try {
      await this.#readSecret(secretId);
      return true;
    } catch {
      return false;
    }
  }

  async #upsertSecret(secretId: string, value: string): Promise<void> {
    const secret: SecretInput = {
      '@context': {},
      '@id': secretId,
      value
    };

    if (await this.#secretExists(secretId)) {
      await lastValueFrom(this.#secretsV3.updateSecretV3(addContext(secret, ['@vocab'])));
      return;
    }

    await lastValueFrom(this.#secretsV3.createSecretV3(addContext(secret, ['@vocab'])));
  }

  #readSecret(secretId: string) {
    return lastValueFrom(this.#secretsV3.getSecretV3(secretId));
  }
}
