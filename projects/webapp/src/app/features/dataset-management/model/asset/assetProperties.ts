export interface AssetProperties {
  name: string;
  description: string;
  type?: string;
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
  // Analytics Dataset specific fields
  coverage?: string;
  historyDepth?: string;
  timeGranularity?: string;
  updateFrequency?: string;
  size?: string;
  deliveryMethods?: string;
  'dcat:distribution'?: {
    '@type': 'dcat:Distribution';
    'dcat:accessService': {
      '@type': 'dcat:DataService';
      'dcterms:conformsTo': { '@id': string };
      'dcat:endpointDescription': { '@id': string };
    };
  }[];
}
