export interface OntologySummary {
  id: string;
  ontologyName: string;
  description: string;
}

export interface OntologyPublicationGuide {
  triggerProperty: string;
  triggerValue: string;
  openApiDocumentProperty: string;
  openApiClassAnnotation: string;
  assetMetadataExample: Record<string, unknown>;
  openApiSchemaExample: Record<string, unknown>;
}

export interface OntologySchemaProperty {
  title?: string;
  description?: string;
  type?: string;
  $ref?: string;
  'x-iata-$ref'?: string;
  items?: OntologySchemaProperty;
}

export interface OntologySchema {
  title?: string;
  description?: string;
  type?: string;
  required?: string[];
  properties?: Record<string, OntologySchemaProperty>;
  $ref?: string;
}

export interface OntologyDetails extends OntologySummary {
  version: string;
  profileIri: string;
  namespace: string;
  publication: OntologyPublicationGuide;
  openApiSchema: {
    components: {
      schemas: Record<string, OntologySchema>;
    };
  };
}

export interface OntologySelection {
  ontologyId: string;
  profileIri: string;
  endpointDescription: string;
}
