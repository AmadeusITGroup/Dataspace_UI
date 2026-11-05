/**
 * Represents a registered Azure Storage account.
 *
 * Storage accounts are persisted in two places:
 *   1. Vault secret (ID: `<accountName>-key1`, value: account access key)
 *   2. Browser localStorage (account name + optional label for discovery,
 *      since the vault has no list/query endpoint)
 */
export interface StorageAccount {
  /** The Azure Storage account name (globally unique, e.g. "mystorageaccount") */
  accountName: string;
  /** Optional display label for the account */
  label?: string;
}

/**
 * Form data used when adding or editing a storage account registration.
 */
export interface StorageAccountFormData {
  accountName: string;
  accountKey: string;
  label?: string;
}

/**
 * localStorage key used to persist the list of registered storage accounts.
 */
export const STORAGE_ACCOUNTS_REGISTRY_KEY = 'azure-storage-accounts';

/**
 * Derives the vault secret ID from an Azure Storage account name.
 */
export function toSecretId(accountName: string): string {
  return `${accountName}-key1`;
}

/**
 * Previous secret ID format kept for backward compatibility with already
 * registered storage accounts and existing assets.
 */
export function toAccidentalSecretId(accountName: string): string {
  return `${accountName}-key`;
}

/**
 * Legacy secret ID format kept for backward compatibility with already
 * registered storage accounts and existing assets.
 */
export function toLegacySecretId(accountName: string): string {
  return accountName;
}
