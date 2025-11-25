export interface Criterion {
  '@type': string;
  operandLeft: string;
  operator: string;
  operandRight: string | object; // Allow both string and object
}

export interface ContractDefinition {
  '@id': string;
  '@type'?: string | undefined;
  accessPolicyId?: string;
  assetsSelector?: Criterion[];
  contractPolicyId?: string;
  createdAt?: number;
  // for UI only
  assetName?: string;
}
