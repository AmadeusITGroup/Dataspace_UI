import { TestBed } from '@angular/core/testing';
import { provideTanStackQuery, QueryClient } from '@tanstack/angular-query-experimental';
import { of, throwError } from 'rxjs';
import { SecretV3Service } from 'management-sdk';
import { ToastService } from '../../../core/toasts/toast-service';
import { addContext } from '../../../jsonld';
import {
  STORAGE_ACCOUNTS_REGISTRY_KEY,
  toAccidentalSecretId,
  toLegacySecretId,
  toSecretId
} from '../model/storage-account.model';
import { StorageAccountService } from './storage-account.service';

describe('StorageAccountService', () => {
  const buildSecret = (secretId: string, value?: string) =>
    addContext(
      {
        '@id': secretId,
        '@type': 'Secret',
        ...(value !== undefined ? { value } : {})
      },
      ['@vocab']
    );

  const mockSecretsV3 = {
    createSecretV3: jest.fn(),
    getSecretV3: jest.fn(),
    removeSecretV3: jest.fn(),
    updateSecretV3: jest.fn()
  };

  const mockToastService = {
    showError: jest.fn(),
    showSuccess: jest.fn()
  };

  const getService = () => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: SecretV3Service,
          useValue: mockSecretsV3
        },
        {
          provide: ToastService,
          useValue: mockToastService
        },
        provideTanStackQuery(
          new QueryClient({
            defaultOptions: {
              mutations: {
                retry: false
              },
              queries: {
                retry: false
              }
            }
          })
        ),
        StorageAccountService
      ]
    });

    return TestBed.inject(StorageAccountService);
  };

  beforeEach(() => {
    jest.resetAllMocks();
    localStorage.clear();
  });

  it('migrates previous -key secrets to the canonical -key1 id', async () => {
    const accountName = 'dseprovider';
    const canonicalSecretId = toSecretId(accountName);
    const accidentalSecretId = toAccidentalSecretId(accountName);

    mockSecretsV3.getSecretV3.mockImplementation((secretId: string) => {
      if (secretId === accidentalSecretId) {
        return of(buildSecret(accidentalSecretId, 'secret-value'));
      }

      return throwError(() => new Error(`Missing secret: ${secretId}`));
    });
    mockSecretsV3.createSecretV3.mockReturnValue(of({}));

    const service = getService();

    await expect(service.getAccountKey(accountName)).resolves.toBe('secret-value');
    expect(mockSecretsV3.createSecretV3).toHaveBeenCalledWith(
      expect.objectContaining({
        '@id': canonicalSecretId,
        value: 'secret-value'
      })
    );
  });

  it('creates the canonical -key1 secret and registers the account on create', async () => {
    const accountName = 'newaccount';
    const canonicalSecretId = toSecretId(accountName);

    mockSecretsV3.getSecretV3.mockImplementation((secretId: string) =>
      throwError(() => new Error(`Missing secret: ${secretId}`))
    );
    mockSecretsV3.createSecretV3.mockReturnValue(of({}));

    const service = getService();

    await service.createAccountMutation.mutateAsync({
      accountKey: 'new-secret',
      accountName,
      label: 'New Account'
    });

    expect(mockSecretsV3.createSecretV3).toHaveBeenCalledWith(
      expect.objectContaining({
        '@id': canonicalSecretId,
        value: 'new-secret'
      })
    );
    expect(service.accounts()).toEqual([{ accountName, label: 'New Account' }]);
    expect(mockToastService.showSuccess).toHaveBeenCalledWith(
      `Storage account "${accountName}" was registered successfully.`
    );
  });

  it('updates canonical and previous secrets while skipping missing legacy ids', async () => {
    const accountName = 'dseprovider';
    const canonicalSecretId = toSecretId(accountName);
    const accidentalSecretId = toAccidentalSecretId(accountName);
    const legacySecretId = toLegacySecretId(accountName);

    localStorage.setItem(
      STORAGE_ACCOUNTS_REGISTRY_KEY,
      JSON.stringify([
        { accountName, label: 'Old Label' },
        { accountName: 'other-account', label: 'Other Label' }
      ])
    );

    mockSecretsV3.getSecretV3.mockImplementation((secretId: string) => {
      if (secretId === canonicalSecretId || secretId === accidentalSecretId) {
        return of(buildSecret(secretId, 'existing-secret'));
      }

      if (secretId === legacySecretId) {
        return throwError(() => new Error(`Missing secret: ${secretId}`));
      }

      return throwError(() => new Error(`Unexpected secret: ${secretId}`));
    });
    mockSecretsV3.updateSecretV3.mockReturnValue(of({}));

    const service = getService();

    await service.updateAccountMutation.mutateAsync({
      accountKey: 'updated-secret',
      accountName,
      label: 'Updated Label'
    });

    expect(mockSecretsV3.updateSecretV3.mock.calls.map((args) => args[0]['@id'])).toEqual([
      canonicalSecretId,
      accidentalSecretId
    ]);
    expect(service.accounts()).toEqual([
      { accountName, label: 'Updated Label' },
      { accountName: 'other-account', label: 'Other Label' }
    ]);
  });

  it('returns null when no known secret id exists', async () => {
    const accountName = 'missing-account';

    mockSecretsV3.getSecretV3.mockImplementation((secretId: string) =>
      throwError(() => new Error(`Missing secret: ${secretId}`))
    );

    const service = getService();

    await expect(service.getAccountKey(accountName)).resolves.toBeNull();
  });

  it('returns null when the secret exists without a stored value', async () => {
    const accountName = 'empty-secret';
    const canonicalSecretId = toSecretId(accountName);

    mockSecretsV3.getSecretV3.mockImplementation((secretId: string) => {
      if (secretId === canonicalSecretId) {
        return of(buildSecret(canonicalSecretId));
      }

      return throwError(() => new Error(`Unexpected secret: ${secretId}`));
    });

    const service = getService();

    await expect(service.getAccountKey(accountName)).resolves.toBeNull();
  });

  it('reconciles local storage by pruning accounts missing from the vault', async () => {
    localStorage.setItem(
      STORAGE_ACCOUNTS_REGISTRY_KEY,
      JSON.stringify([
        { accountName: 'existing-account', label: 'Existing' },
        { accountName: 'missing-account', label: 'Missing' }
      ])
    );

    mockSecretsV3.getSecretV3.mockImplementation((secretId: string) => {
      if (secretId === toSecretId('existing-account')) {
        return of(buildSecret(secretId, 'existing-secret'));
      }

      return throwError(() => new Error(`Missing secret: ${secretId}`));
    });

    const service = getService();

    await service.reconcileWithVault();

    expect(service.accounts()).toEqual([{ accountName: 'existing-account', label: 'Existing' }]);
    expect(service.reconciling()).toBe(false);
  });

  it('returns early when there are no stored accounts to reconcile', async () => {
    const service = getService();

    await service.reconcileWithVault();

    expect(mockSecretsV3.getSecretV3).not.toHaveBeenCalled();
    expect(service.reconciling()).toBe(false);
  });

  it('deletes canonical, accidental, and legacy secret ids', async () => {
    const accountName = 'dseprovider';

    mockSecretsV3.removeSecretV3.mockReturnValue(of({}));

    const service = getService();

    await service.deleteAccountMutation.mutateAsync(accountName);

    expect(mockSecretsV3.removeSecretV3.mock.calls.map((args) => args[0])).toEqual([
      toSecretId(accountName),
      toAccidentalSecretId(accountName),
      toLegacySecretId(accountName)
    ]);
  });

  it('surfaces an error when no known secret id can be deleted', async () => {
    const accountName = 'missing-account';

    mockSecretsV3.removeSecretV3.mockImplementation((secretId: string) =>
      throwError(() => new Error(`Missing secret: ${secretId}`))
    );

    const service = getService();

    await expect(service.deleteAccountMutation.mutateAsync(accountName)).rejects.toThrow(
      `Storage account secret for "${accountName}" was not found.`
    );
    expect(mockToastService.showError).toHaveBeenCalled();
  });
});
