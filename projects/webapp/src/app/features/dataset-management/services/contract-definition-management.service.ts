import { inject, Injectable } from '@angular/core';
import { injectMutation, injectQuery } from '@tanstack/angular-query-experimental';
import {
  ContractDefinitionInput,
  ContractDefinitionOutput,
  ContractDefinitionV3Service
} from 'management-sdk';
import { lastValueFrom } from 'rxjs';
import { addContext, noPaginationQuerySpec, normalizeJsonLD } from '../../../jsonld';
import { ContractDefinition } from '../model/contract/contract-definition.model';

const formatContractDefinition = async (
  promise: Promise<ContractDefinitionOutput>
): Promise<ContractDefinition> => {
  const item = await promise;
  const selectors = Array.isArray(item.assetsSelector)
    ? item.assetsSelector
    : item.assetsSelector
      ? [item.assetsSelector]
      : [];

  const contractFormated = {
    ...item,
    '@id': item['@id'] as string,
    assetsSelector: selectors.map((selector) => ({
      ...selector,
      '@type': selector['@type'] || 'Criterion',
      operandLeft: selector.operandLeft?.toString() || '',
      operandRight: selector.operandRight?.toString() || ''
    }))
  };
  return {
    ...contractFormated,
    assetName:
      contractFormated.assetsSelector && contractFormated.assetsSelector.length
        ? contractFormated.assetsSelector[0]?.operandRight?.toString()
        : ''
  };
};

@Injectable()
export class ContractDefinitionManagementService {
  readonly #contractDefV3: ContractDefinitionV3Service = inject(ContractDefinitionV3Service);

  contractDefinitionQuery = injectQuery(() => ({
    queryKey: ['contracts'],
    queryFn: async () => {
      return lastValueFrom(
        this.#contractDefV3.queryContractDefinitionsV3(noPaginationQuerySpec, undefined)
      ).then(async (items) => {
        const formattedItems = await Promise.all(
          items.map(normalizeJsonLD<ContractDefinitionOutput>).map(formatContractDefinition)
        );
        return formattedItems.filter(
          (contractDefinition) => contractDefinition && contractDefinition['@id']
        );
      });
    }
  }));

  deleteContractDefinitionQuery = injectMutation(() => ({
    mutationKey: ['deleteContract'],
    mutationFn: (id: string) => {
      return lastValueFrom(this.#contractDefV3.deleteContractDefinitionV3(id));
    }
  }));

  createContractDefinitionQuery = injectMutation(() => ({
    mutationKey: ['createContract'],
    mutationFn: (newContractDefinition: ContractDefinitionInput) => {
      return lastValueFrom(
        this.#contractDefV3.createContractDefinitionV3(
          addContext<ContractDefinitionInput>(newContractDefinition, ['@vocab'])
        )
      );
    }
  }));

  updateContractDefinitionQuery = injectMutation(() => ({
    mutationKey: ['updateContract'],
    mutationFn: (contractDefinition: ContractDefinitionInput) => {
      return lastValueFrom(
        this.#contractDefV3.updateContractDefinitionV3(
          addContext<ContractDefinitionInput>(contractDefinition, ['@vocab'])
        )
      );
    }
  }));
}
