import { computed, inject, Injectable } from '@angular/core';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { ManagementApiService } from 'management-sdk-be';
import { lastValueFrom } from 'rxjs';
import { transformInArray } from '../../../core/utils/object.util';
import { normalizeJsonLD } from '../../../jsonld';
import { CatalogItem, Dataset } from '../models/catalog.model';

const normalizeCatalog = async (inputCatalog: object): Promise<CatalogItem> => {
  const outputCatalog = await normalizeJsonLD<CatalogItem>(inputCatalog);
  outputCatalog.dataset = transformInArray(outputCatalog.dataset);

  // Normalize `hasPolicy` for each dataset item
  outputCatalog.dataset.forEach((item) => {
    item.hasPolicy = transformInArray(item.hasPolicy);
  });
  return outputCatalog;
};

@Injectable()
export class CatalogService {
  readonly #managementApiService = inject(ManagementApiService);

  readonly catalogQuery = injectQuery(() => ({
    queryKey: ['catalog'],
    queryFn: () =>
      lastValueFrom(this.#managementApiService.participantcatalog()).then(async (items) =>
        (await Promise.all(items.map(normalizeCatalog))).filter(
          (catalog: { dataset: string | unknown[] }) => catalog.dataset.length
        )
      )
  }));

  readonly datasetsById = computed(() => {
    const data = this.catalogQuery.data();
    if (!data) {
      return {};
    }
    const res: Record<string, Dataset> = {};
    for (const catalog of data) {
      for (const dataset of catalog.dataset) {
        res[`${catalog.participantId}/${dataset.id}`] = dataset;
      }
    }
    return res;
  });
}
