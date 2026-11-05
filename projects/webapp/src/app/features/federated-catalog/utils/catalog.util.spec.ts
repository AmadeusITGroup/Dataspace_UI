import {
  enrichCatalogItems,
  filterCatalogItems,
  buildFilterOptions,
  getAvailableParticipants
} from './catalog.util';
import { FormControl } from '@angular/forms';
import { CatalogItem, DatasetEnriched } from '../models/catalog.model';

describe('catalog.util', () => {
  describe('enrichCatalogItems', () => {
    it('should return empty array when items is undefined', () => {
      const result = enrichCatalogItems(undefined, null, null);
      expect(result).toEqual([]);
    });

    it('should enrich catalog items with negotiations and ownership info', () => {
      const items: CatalogItem[] = [
        {
          participantId: 'did:web:participant123',
          dataset: [{ id: 'dataset1', description: 'Test dataset' }],
          originator: 'originator1'
        } as any
      ];

      const result = enrichCatalogItems(items, null, 'participant123');

      expect(result.length).toBe(1);
      expect(result[0].owned).toBe(true);
      expect(result[0].shortParticipantId).toBe('participant123');
      expect(result[0].negotiated).toBe(false);
    });

    it('should mark items as negotiated when agreements exist', () => {
      const items: CatalogItem[] = [
        {
          participantId: 'did:web:participant456',
          dataset: [{ id: 'dataset1' }],
          originator: 'originator1'
        } as any
      ];

      const agreements = {
        'did:web:participant456/dataset1': [{ id: 'agreement1' } as any]
      };

      const result = enrichCatalogItems(items, agreements, 'participant123');

      expect(result[0].negotiated).toBe(true);
      expect(result[0].owned).toBe(false);
    });

    it('should handle multiple datasets in catalog item', () => {
      const items: CatalogItem[] = [
        {
          participantId: 'did:web:participant789',
          dataset: [{ id: 'dataset1' }, { id: 'dataset2' }],
          originator: 'originator1'
        } as any
      ];

      const result = enrichCatalogItems(items, null, null);

      expect(result.length).toBe(2);
      expect(result[0].id).toBe('dataset1');
      expect(result[1].id).toBe('dataset2');
    });

    it('should fall back to the full participant id when no short id segment exists', () => {
      const items: CatalogItem[] = [
        {
          participantId: 'did:web:',
          dataset: [{ id: 'dataset1' }],
          originator: 'originator1'
        } as any
      ];

      const result = enrichCatalogItems(items, null, null);

      expect(result[0].shortParticipantId).toBe('did:web:');
    });
  });

  describe('enrichCatalogItems with did:web participant ids', () => {
    const PROVIDER_DID = 'did:web:provider-identityhub%3A8383:api:did';
    const CONSUMER_DID = 'did:web:consumer-identityhub%3A8383:api:did';
    const items: CatalogItem[] = [
      {
        participantId: PROVIDER_DID,
        dataset: [{ id: 'mds-vehicle-technical-definition' }],
        originator: 'http://provider-controlplane:8282/api/dsp/2025-1'
      } as any,
      {
        participantId: CONSUMER_DID,
        dataset: [{ id: 'consumer-dataset' }],
        originator: 'http://consumer-controlplane:8282/api/dsp/2025-1'
      } as any
    ];

    it('should name the participant from the DID host, not the trailing "did" segment', () => {
      const result = enrichCatalogItems(items, null, 'provider', PROVIDER_DID);
      expect(result.map((d) => d.shortParticipantId)).toEqual(['provider', 'consumer']);
    });

    it('should mark only the current participant datasets as owned (full id)', () => {
      const result = enrichCatalogItems(items, null, 'provider', PROVIDER_DID);
      expect(result.map((d) => d.owned)).toEqual([true, false]);
    });

    it('should mark ownership from the short name when no full id is known', () => {
      const result = enrichCatalogItems(items, null, 'provider');
      expect(result.map((d) => d.owned)).toEqual([true, false]);
    });

    it('should not mark anything owned for a participant absent from the catalog', () => {
      const result = enrichCatalogItems(items, null, 'eonaxtest');
      expect(result.map((d) => d.owned)).toEqual([false, false]);
    });

    it('should offer one participant filter option per DID host', () => {
      expect(getAvailableParticipants(items)).toEqual([
        { value: '', label: 'All' },
        { value: 'consumer', label: 'consumer' },
        { value: 'provider', label: 'provider' }
      ]);
    });

    it('should filter by the DID-derived participant name', () => {
      const enriched = enrichCatalogItems(items, null, 'provider', PROVIDER_DID);
      const result = filterCatalogItems(enriched, { participant: 'provider' });
      expect(result.map((d) => d.id)).toEqual(['mds-vehicle-technical-definition']);
    });
  });

  describe('filterCatalogItems', () => {
    const mockItems: DatasetEnriched[] = [
      {
        id: 'dataset1',
        name: 'Test Dataset',
        description: 'A test dataset',
        shortParticipantId: 'participant1',
        owned: true,
        negotiated: false
      } as any,
      {
        id: 'dataset2',
        name: 'Another Dataset',
        description: 'Another test',
        shortParticipantId: 'participant2',
        owned: false,
        negotiated: true
      } as any
    ];

    it('should return empty array when items is null', () => {
      const result = filterCatalogItems(null as any, {});
      expect(result).toEqual([]);
    });

    it('should filter by participant', () => {
      const result = filterCatalogItems(mockItems, { participant: 'participant1' });
      expect(result.length).toBe(1);
      expect(result[0].shortParticipantId).toBe('participant1');
    });

    it('should filter by owned status', () => {
      const result = filterCatalogItems(mockItems, { status: 'owned' });
      expect(result.length).toBe(1);
      expect(result[0].owned).toBe(true);
    });

    it('should filter by negotiated status', () => {
      const result = filterCatalogItems(mockItems, { status: 'negotiated' });
      expect(result.length).toBe(1);
      expect(result[0].negotiated).toBe(true);
    });

    it('should filter by available status', () => {
      const items: DatasetEnriched[] = [
        { id: '1', owned: false, negotiated: false } as any,
        { id: '2', owned: true, negotiated: false } as any
      ];

      const result = filterCatalogItems(items, { status: 'available' });
      expect(result.length).toBe(1);
      expect(result[0].id).toBe('1');
    });

    it('should filter by search term', () => {
      const result = filterCatalogItems(mockItems, { search: 'Another' });
      expect(result.length).toBe(1);
      expect(result[0].name).toBe('Another Dataset');
    });

    it('should filter by explicit delivery type', () => {
      const items: DatasetEnriched[] = [
        { id: '1', deliveryMethod: 'Kafka', owned: false, negotiated: false } as any,
        { id: '2', deliveryMethod: 'File', owned: false, negotiated: false } as any
      ];

      const result = filterCatalogItems(items, { deliveryType: 'kafka' });

      expect(result).toEqual([items[0]]);
    });

    it('should default missing delivery methods to api when filtering by delivery type', () => {
      const items: DatasetEnriched[] = [
        { id: '1', owned: false, negotiated: false } as any,
        { id: '2', deliveryMethod: 'Kafka', owned: false, negotiated: false } as any
      ];

      const result = filterCatalogItems(items, { deliveryType: 'api' });

      expect(result).toEqual([items[0]]);
    });
  });

  describe('getAvailableParticipants', () => {
    it('should return empty array when items is undefined', () => {
      const result = getAvailableParticipants(undefined);
      expect(result).toEqual([]);
    });

    it('should extract unique participants', () => {
      const items: CatalogItem[] = [
        { participantId: 'did:web:participant1' } as any,
        { participantId: 'did:web:participant2' } as any,
        { participantId: 'did:web:participant1' } as any
      ];

      const result = getAvailableParticipants(items);

      expect(result.length).toBe(3); // 'All' + 2 unique participants
      expect(result[0]).toEqual({ value: '', label: 'All' });
      expect(result[1].value).toBe('participant1');
      expect(result[2].value).toBe('participant2');
    });

    it('should fall back to the full participant id when the short segment is empty', () => {
      const items: CatalogItem[] = [{ participantId: 'did:web:' } as any];

      const result = getAvailableParticipants(items);

      expect(result).toEqual([
        { value: '', label: 'All' },
        { value: 'did:web:', label: 'did:web:' }
      ]);
    });
  });

  describe('buildFilterOptions', () => {
    it('should build filter options with controls', () => {
      const controls = {
        participant: new FormControl(''),
        status: new FormControl(''),
        deliveryType: new FormControl(''),
        search: new FormControl('')
      };

      const participants = [{ value: 'p1', label: 'Participant 1' }];

      const result = buildFilterOptions(controls, participants);

      expect(result.length).toBe(4);
      expect(result[0].label).toBe('Participant');
      expect(result[0].type).toBe('select');
      expect(result[1].label).toBe('Status');
      expect(result[2].label).toBe('Delivery Type');
      expect(result[2].type).toBe('select');
      expect(result[3].label).toBe('Search by');
      expect(result[3].type).toBe('search');
    });
  });
});
