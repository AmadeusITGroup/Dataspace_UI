import { PolicyCondition } from './policy-condition';

export interface PolicyResponse {
  '@id': string;
  '@type'?: string;
  createdAt?: number;
  policy: Policy;
}

export interface Policy extends PolicyCondition {
  '@id'?: string;
  '@type'?: PolicyType;
  '@context'?: string;
  uid?: string;
  'odrl:assignee'?: string;
  'odrl:assigner'?: string;
  'odrl:target'?: string;
  'odrl:profiles': string[];
  extensibleProperties?: object;
  inheritsFrom?: string;
}

export type PolicyType =
  | 'http://www.w3.org/ns/odrl/2/Set'
  | 'http://www.w3.org/ns/odrl/2/Set/Offer'
  | 'http://www.w3.org/ns/odrl/2/Contract';
