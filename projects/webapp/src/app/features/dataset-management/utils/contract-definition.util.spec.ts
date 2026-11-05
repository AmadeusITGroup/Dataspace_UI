import {
  buildFilterOptions,
  buildTypeheadList,
  filterContractDefinition
} from './contract-definition.util';
import { ContractDefinition } from '../model/contract/contract-definition.model';

describe('contract-definition.util', () => {
  describe('buildFilterOptions', () => {
    it('should build filter options', () => {
      const result = buildFilterOptions();

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].label).toBe('Search by');
      expect(result[0].type).toBe('search');
    });
  });

  describe('buildTypeheadList', () => {
    it('should extract unique values from contract definitions', () => {
      const data: ContractDefinition[] = [
        { '@id': '1', assetName: 'Asset1', accessPolicyId: 'policy1' } as any,
        { '@id': '2', assetName: 'Asset2', accessPolicyId: 'policy1' } as any,
        { '@id': '3', assetName: 'Asset1', accessPolicyId: 'policy2' } as any
      ];

      const result = buildTypeheadList(data, 'assetName');

      expect(result.length).toBe(2);
      expect(result).toContain('Asset1');
      expect(result).toContain('Asset2');
    });

    it('should filter out empty values', () => {
      const data: ContractDefinition[] = [
        { '@id': '1', assetName: 'Asset1' } as any,
        { '@id': '2', assetName: '' } as any,
        { '@id': '3', assetName: 'Asset2' } as any
      ];

      const result = buildTypeheadList(data, 'assetName');

      expect(result.length).toBe(2);
      expect(result).not.toContain('');
    });

    it('should handle null data', () => {
      const result = buildTypeheadList(null as any, 'assetName');
      expect(result).toEqual([]);
    });
  });

  describe('filterContractDefinition', () => {
    const mockData: ContractDefinition[] = [
      {
        '@id': 'contract1',
        assetName: 'Asset1',
        accessPolicyId: 'policy1',
        contractPolicyId: 'cpolicy1'
      } as any,
      {
        '@id': 'contract2',
        assetName: 'Asset2',
        accessPolicyId: 'policy2',
        contractPolicyId: 'cpolicy2'
      } as any
    ];

    it('should return all items when no filters applied', () => {
      const result = filterContractDefinition(mockData, {});
      expect(result.length).toBe(2);
    });

    it('should filter by asset name', () => {
      const result = filterContractDefinition(mockData, { assetFilter: 'Asset1' });
      expect(result.length).toBe(1);
      expect(result[0].assetName).toBe('Asset1');
    });

    it('should filter by access policy', () => {
      const result = filterContractDefinition(mockData, { accessPolicyFilter: 'policy2' });
      expect(result.length).toBe(1);
      expect(result[0].accessPolicyId).toBe('policy2');
    });

    it('should filter by contract policy', () => {
      const result = filterContractDefinition(mockData, { contractPolicyFilter: 'cpolicy1' });
      expect(result.length).toBe(1);
      expect(result[0].contractPolicyId).toBe('cpolicy1');
    });

    it('should filter by search term', () => {
      const result = filterContractDefinition(mockData, { search: 'contract2' });
      expect(result.length).toBe(1);
      expect(result[0]['@id']).toBe('contract2');
    });

    it('should apply multiple filters', () => {
      const result = filterContractDefinition(mockData, {
        assetFilter: 'Asset1',
        search: 'contract1'
      });
      expect(result.length).toBe(1);
      expect(result[0]['@id']).toBe('contract1');
    });
  });
});
