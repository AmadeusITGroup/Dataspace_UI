import { normalizeJsonLD } from './jsonld';

describe('JSON-LD normalization', () => {
  it('normalizes legacy assets with undeclared dcterms keys', async () => {
    const asset = {
      '@id': 'dev-domain-asset',
      '@type': 'Asset',
      properties: {
        'dcterms:title': 'Payment Events API',
        'dcterms:conformsTo': {
          '@id': 'https://example.com/specification/1.0',
          '@type': 'dcterms:Standard',
          'dcterms:title': 'Event Driven API Model Specification 1.0'
        }
      },
      '@context': {
        '@vocab': 'https://w3id.org/edc/v0.0.1/ns/'
      }
    };

    await expect(normalizeJsonLD(asset)).resolves.toMatchObject({
      '@id': 'dev-domain-asset',
      properties: {
        'dcterms:title': 'Payment Events API',
        'dcterms:conformsTo': {
          '@id': 'https://example.com/specification/1.0'
        }
      }
    });
  });
});
