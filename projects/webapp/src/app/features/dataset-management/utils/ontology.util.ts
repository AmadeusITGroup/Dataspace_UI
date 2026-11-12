import { Asset } from '../model/asset/asset';
import { OntologySelection } from '../model/ontology';

export function addOntologyMetadata(asset: Asset, selection: OntologySelection | null): Asset {
  if (!selection) {
    return asset;
  }

  return {
    ...asset,
    properties: {
      ...asset.properties,
      'dcat:distribution': [
        {
          '@type': 'dcat:Distribution',
          'dcat:accessService': {
            '@type': 'dcat:DataService',
            'dcterms:conformsTo': { '@id': selection.profileIri },
            'dcat:endpointDescription': { '@id': selection.endpointDescription }
          }
        }
      ]
    }
  };
}
