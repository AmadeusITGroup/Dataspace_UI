import { WritableSignal } from '@angular/core';
import { ContractNegotiation as SDKContractNegotiation } from 'management-sdk';
import { Dataset } from '../../federated-catalog/models/catalog.model';
import { ContractAgreementDetail } from './contract-agreement.model';

export interface ContractNegotiationErrorDetail {
  '@type': 'dspace:ContractNegotiationError';
  'dspace:code': string;
  'dspace:processId': string;
  'dspace:reason': string;
}

export interface ContractNegotiation extends SDKContractNegotiation {
  createdAt: number;
  errorDetailObject?: ContractNegotiationErrorDetail;
  createdTransferId: WritableSignal<string | null>;
}

export interface EnrichedNegotiation {
  negotiation: ContractNegotiation;
  agreement: ContractAgreementDetail | null;
  dataset: Dataset | null;
}
