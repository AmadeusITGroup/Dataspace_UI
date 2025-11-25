import { inject, Injectable } from '@angular/core';
import { SecretInputV3, SecretV3Service } from 'management-sdk';
import { injectMutation, QueryClient, queryOptions } from '@tanstack/angular-query-experimental';
import { lastValueFrom } from 'rxjs';
import { addContext, normalizeJsonLD } from '../../../jsonld';
import { ToastService } from '../../../core/toasts/toast-service';
import { composedErrorMessage } from '../../../core/utils/object.util';

@Injectable()
export class SecretManagementService {
  readonly #secretsV3: SecretV3Service = inject(SecretV3Service);
  readonly #queryClient: QueryClient = inject(QueryClient);
  readonly #toastService = inject(ToastService);

  readonly createSecretQuery = injectMutation(() => ({
    mutationKey: ['createSecret'],
    onSuccess: async (data, secret: SecretInputV3) => {
      this.#toastService.showSuccess(`Secret "${secret['@id']}" was created successfully.`);
    },
    onError: (error: Error) => {
      const composedMessage = composedErrorMessage(error, 'creating', 'secret');
      this.#toastService.showError(composedMessage);
    },
    mutationFn: (secret: SecretInputV3) => {
      return lastValueFrom(this.#secretsV3.createSecretV3(addContext(secret, ['@vocab'])));
    }
  }));

  readonly updateSecretQuery = injectMutation(() => ({
    mutationKey: ['updateSecret'],
    onSuccess: async (data, secret: SecretInputV3) => {
      await this.#queryClient.invalidateQueries({ queryKey: ['getSecretById', secret['@id']] });
      this.#toastService.showSuccess(`Secret "${secret['@id']}" was updated successfully.`);
    },
    onError: (error: Error) => {
      const composedMessage = composedErrorMessage(error, 'updating', 'secret');
      this.#toastService.showError(composedMessage);
    },
    mutationFn: (secret: SecretInputV3) => {
      return lastValueFrom(this.#secretsV3.updateSecretV3(addContext(secret, ['@vocab'])));
    }
  }));

  readonly getSecretByIdQuery = (id: string | undefined) =>
    queryOptions({
      queryKey: ['getSecretById', id],
      queryFn: () => {
        if (!id) {
          return Promise.resolve(null);
        }
        return lastValueFrom(this.#secretsV3.getSecretV3(id))
          .then(async (item) => await normalizeJsonLD<SecretInputV3>(item))
          .catch(() => Promise.resolve(null));
      }
    });

  readonly deleteSecretQuery = injectMutation(() => ({
    mutationKey: ['deleteSecret'],
    onSuccess: async (data, id: string) => {
      await Promise.all([
        this.#queryClient.invalidateQueries({ queryKey: ['getSecretById', id] }),
        this.#queryClient.invalidateQueries({ queryKey: ['assets'] })
      ]);
      this.#toastService.showSuccess(`Secret "${id}" successfully marked for deletion.`);
    },
    onError: (error: Error) => {
      const composedMessage = composedErrorMessage(error, 'deleting', 'secret');
      this.#toastService.showError(composedMessage);
    },
    mutationFn: (id: string) => {
      return lastValueFrom(this.#secretsV3.removeSecretV3(id));
    }
  }));
}
