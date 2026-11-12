import { Asset } from '../model/asset/asset';
import { addOntologyMetadata } from './ontology.util';

describe('ontology utilities', () => {
  const asset = {
    '@id': 'asset-id',
    properties: { name: 'Asset', description: '' },
    dataAddress: { type: 'HttpData' }
  } as Asset;

  it('leaves the asset unchanged when no ontology is selected', () => {
    expect(addOntologyMetadata(asset, null)).toBe(asset);
  });

  it('adds the validation profile and OpenAPI document as DCAT metadata', () => {
    const result = addOntologyMetadata(asset, {
      ontologyId: 'inria-iata-24.4.0',
      profileIri: 'https://w3id.org/dse/profile/inria-iata/24.4.0',
      endpointDescription: 'https://api.example.com/openapi.yaml'
    });

    expect(result.properties['dcat:distribution']).toEqual([
      {
        '@type': 'dcat:Distribution',
        'dcat:accessService': {
          '@type': 'dcat:DataService',
          'dcterms:conformsTo': {
            '@id': 'https://w3id.org/dse/profile/inria-iata/24.4.0'
          },
          'dcat:endpointDescription': {
            '@id': 'https://api.example.com/openapi.yaml'
          }
        }
      }
    ]);
    expect(result).not.toBe(asset);
  });
});
