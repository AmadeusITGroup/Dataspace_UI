import { inject, Injectable } from '@angular/core';
import { injectMutation, injectQuery } from '@tanstack/angular-query-experimental';
import { PolicyDefinitionV3Service } from 'management-sdk';
import { lastValueFrom } from 'rxjs';
import { addContext, noPaginationQuerySpec, normalizeJsonLD } from '../../../jsonld';
import { PolicyResponse } from '../../../core/models/policy';

const formatItems = async (promise: Promise<PolicyResponse>) => {
  const item = await promise;
  ['odrl:permission', 'odrl:obligation', 'odrl:prohibition'].forEach((key) => {
    // @ts-expect-error just typescript being typescript
    if (item.policy[key]) {
      // @ts-expect-error just typescript being typescript
      item.policy[key] = Array.isArray(item.policy[key]) ? item.policy[key] : [item.policy[key]];
    }
  });
  return item;
};
@Injectable()
export class PolicyManagementService {
  readonly #policyV3: PolicyDefinitionV3Service = inject(PolicyDefinitionV3Service);

  readonly policiesQuery = injectQuery(() => ({
    queryKey: ['policies'],
    queryFn: () =>
      lastValueFrom(
        this.#policyV3.queryPolicyDefinitionsV3(
          {
            ...noPaginationQuerySpec,
            sortOrder: 'DESC',
            sortField: 'createdAt'
          },
          undefined
        )
      ).then(
        async (items) =>
          await Promise.all(items.map(normalizeJsonLD<PolicyResponse>).map(formatItems))
      )
  }));

  readonly createPolicyQuery = injectMutation(() => ({
    mutationKey: ['createPolicy'],
    mutationFn: (policyR: PolicyResponse) => {
      return lastValueFrom(
        this.#policyV3.createPolicyDefinitionV3(
          addContext<PolicyResponse>(policyR, ['@vocab', 'eox-policy', 'edc'])
        )
      );
    }
  }));

  readonly updatePolicyQuery = injectMutation(() => ({
    mutationKey: ['updatePolicy'],
    mutationFn: (policyR: PolicyResponse) => {
      return lastValueFrom(
        this.#policyV3.updatePolicyDefinitionV3(
          policyR['@id'],
          addContext<PolicyResponse>(policyR, ['@vocab', 'eox-policy', 'edc'])
        )
      );
    }
  }));

  readonly deletePolicyQuery = injectMutation(() => ({
    mutationKey: ['deletePolicy'],
    mutationFn: (policyR: PolicyResponse) => {
      return lastValueFrom(this.#policyV3.deletePolicyDefinitionV3(policyR['@id']));
    }
  }));
}
