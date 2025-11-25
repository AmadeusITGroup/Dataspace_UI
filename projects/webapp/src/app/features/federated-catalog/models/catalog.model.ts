import { PolicyCondition } from '../../../core/models/policy-condition';
import { ContractAgreement } from 'management-sdk';

export interface CatalogItem {
  participantId: string;
  originator: string;
  dataset: Dataset[];
}

export interface Dataset {
  name: string;
  description: string;
  id: string;
  version?: string;
  createdAt?: string;
  updatedAt?: string;
  logoUrl?: string;
  documentationUrl?: string;
  contenttype?: string;
  hasPolicy: Offer[];
}
export interface DatasetEnriched extends Dataset {
  negotiations: ContractAgreement[];
  owned: boolean;
  negotiated: boolean;
  originator: string;
  participantId: string;
  shortParticipantId: string;
  trackId: string;
}

export interface Offer extends PolicyCondition {
  '@id': string;
  assigner?: string;
  target?: string;
}
