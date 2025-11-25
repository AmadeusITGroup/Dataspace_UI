import { compact } from 'jsonld/lib/jsonld';
import type { QuerySpec } from 'management-sdk';

export const noPaginationQuerySpec: QuerySpec = {
  '@context': {
    '@vocab': 'https://w3id.org/edc/v0.0.1/ns/'
  },
  '@type': 'QuerySpec',
  offset: 0,
  limit: 10000
} as QuerySpec & { '@context': Record<string, string> };

export const jsonLDContext = {
  '@vocab': 'https://w3id.org/edc/v0.0.1/ns/',
  'eox-policy': 'https://w3id.org/eonax/policy/',
  edc: 'https://w3id.org/edc/v0.0.1/ns/',
  dcat: 'http://www.w3.org/ns/dcat#',
  dataset: 'dcat:dataset',
  dct: 'http://purl.org/dc/terms/',
  odrl: 'http://www.w3.org/ns/odrl/2/',
  hasPolicy: 'odrl:hasPolicy',
  dspace: 'https://w3id.org/dspace/v0.8/',
  participantId: 'dspace:participantId',
  assigner: { '@type': '@id', '@id': 'odrl:assigner' },
  target: { '@type': '@id', '@id': 'odrl:target' }
};

type KeyJsonLDContext = keyof typeof jsonLDContext;

export const normalizeJsonLD = async <T extends object>(input: object): Promise<T> => {
  const { '@context': _, ...output } = (await compact(input, jsonLDContext, {})) as object & {
    '@context': object;
  };
  return output as T;
};

export const normalizeJsonLDID = async <T extends object>(input: object): Promise<T> => {
  const {
    '@context': _,
    '@id': atId,
    ...output
  } = (await compact(input, jsonLDContext, {})) as object & {
    '@context': object;
    '@id'?: string;
  };
  return {
    ...output,
    ...(atId && { id: atId })
  } as T;
};

export const addContext = <T extends object>(
  item: T,
  keys: KeyJsonLDContext[]
): T & { '@context': object } => {
  const context = keys.reduce(
    (acc, key) => {
      acc[key] = jsonLDContext[key];
      return acc;
    },
    {} as Record<string, unknown>
  );
  return {
    ...item,
    '@context': context
  };
};
