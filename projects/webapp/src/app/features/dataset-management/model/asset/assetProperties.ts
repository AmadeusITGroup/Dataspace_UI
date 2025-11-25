export interface AssetProperties {
  name: string;
  description: string;
  documentationUrl?: string;
  logoUrl?: string;
  contenttype?: string;
  version?: string;
  key?: string;
  createdAt?: number;
  updatedAt?: number;
  id?: string;
  accessType?: string;
  deliveryMethod?: string;
  domainCategories?: string[];
  containsPII?: boolean;
  containsPaymentInfo?: boolean;
  accessLevel?: string;
  licenses?: string[];
  averageRecordSizeBytes?: number;
}
