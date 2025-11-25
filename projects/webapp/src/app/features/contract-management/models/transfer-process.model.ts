import { TransferStateEnum } from '../constants/transfer-state.enum';

export interface TransferProcess {
  '@id': string;
  id: string;
  assetId: string;
  callbackAddresses: string[];
  contractId: string;
  correlationId: string;
  errorDetail?: string;
  state: TransferStateEnum;
  stateTimestamp: number;
  transferType: string;
  type: string;
}
