import { inject, Injectable } from '@angular/core';
import { injectMutation, injectQuery, QueryClient } from '@tanstack/angular-query-experimental';
import { AssetV3Service, QuerySpec } from 'management-sdk';
import { lastValueFrom } from 'rxjs';
import { ToastService } from '../../../core/toasts/toast-service';
import { composedErrorMessage } from '../../../core/utils/object.util';
import { addContext, noPaginationQuerySpec, normalizeJsonLD } from '../../../jsonld';
import { Asset } from '../model/asset/asset';

@Injectable()
export class AssetManagementService {
  readonly #assetV3: AssetV3Service = inject(AssetV3Service);
  readonly #queryClient: QueryClient = inject(QueryClient);
  readonly #toastService = inject(ToastService);

  readonly assetsQuery = injectQuery(() => ({
    queryKey: ['assets'],
    queryFn: async () => {
      const normalizedQuerySpec = await normalizeJsonLD<QuerySpec>({
        ...noPaginationQuerySpec,
        sortOrder: 'DESC',
        sortField: 'createdAt'
      });
      return lastValueFrom(
        this.#assetV3.requestAssetsV3(normalizedQuerySpec as QuerySpec, undefined)
      ).then(async (items) => {
        const normalized = await Promise.all(items.map(normalizeJsonLD<Asset>));
        // [BUGFIX] - TODO Proper fix in the backend
        // Normalize asset properties to ensure all filter fields exist -
        return normalized.map((asset) => ({
          ...asset,
          properties: {
            ...asset.properties,
            accessType: asset.properties?.accessType || '',
            deliveryMethod: asset.properties?.deliveryMethod || asset.properties?.type || 'Api',
            domainCategories: asset.properties?.domainCategories || [],
            containsPII: asset.properties?.containsPII ?? false,
            containsPaymentInfo: asset.properties?.containsPaymentInfo ?? false,
            accessLevel: asset.properties?.accessLevel || '',
            licenses: asset.properties?.licenses || []
          }
        }));
      });
    }
  }));

  readonly createAssetQuery = injectMutation(() => ({
    mutationKey: ['createAsset'],
    onSuccess: async (data, updatedAsset) => {
      await this.#queryClient.invalidateQueries({ queryKey: ['assets'] });
      this.#toastService.showSuccess(`Dataset ${updatedAsset['@id']} was created successfully`);
    },
    onError: (error: Error) => {
      const composedMessage = composedErrorMessage(error, 'creating', 'dataset');
      this.#toastService.showError(composedMessage);
    },
    mutationFn: (newAsset: Asset) => {
      return lastValueFrom(this.#assetV3.createAssetV3(addContext<Asset>(newAsset, ['@vocab'])));
    }
  }));

  readonly updateAssetQuery = injectMutation(() => ({
    mutationKey: ['updateAsset'],
    onSuccess: async (data, asset) => {
      await this.#queryClient.invalidateQueries({ queryKey: ['assets'] });
      this.#toastService.showSuccess(`Dataset ${asset['@id']} updated successfully.`);
    },
    onError: (error: Error) => {
      const composedMessage = composedErrorMessage(error, 'updating', 'dataset');
      this.#toastService.showError(composedMessage);
    },
    mutationFn: (asset: Asset) => {
      return lastValueFrom(this.#assetV3.updateAssetV3(addContext<Asset>(asset, ['@vocab'])));
    }
  }));

  readonly deleteAssetQuery = injectMutation(() => ({
    mutationKey: ['deleteAsset'],
    onSuccess: async (data, id: string) => {
      await this.#queryClient.invalidateQueries({ queryKey: ['assets'] });
      this.#toastService.showSuccess(`Dataset "${id}" deleted successfully.`);
    },
    onError: (error: Error) => {
      const composedMessage = composedErrorMessage(error, 'deleting', 'dataset');
      this.#toastService.showError(composedMessage);
    },
    mutationFn: (id: string) => {
      return lastValueFrom(this.#assetV3.removeAssetV3(id));
    }
  }));
}
