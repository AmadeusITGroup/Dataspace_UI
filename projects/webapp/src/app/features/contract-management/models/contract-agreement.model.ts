import { ContractAgreement } from 'management-sdk';
import { Policy } from '../../../core/models/policy';

export interface ContractAgreementDetail extends ContractAgreement {
  policy: Policy;
}
