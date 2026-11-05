import { FormControl } from '@angular/forms';
import { buildFilterOptions } from './policy.util';

describe('policy.util', () => {
  describe('buildFilterOptions', () => {
    it('should build filter options', () => {
      const controls = {
        policySearch: new FormControl('')
      };

      const result = buildFilterOptions(controls);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(1);
    });

    it('should include search filter with correct properties', () => {
      const controls = {
        policySearch: new FormControl('')
      };

      const result = buildFilterOptions(controls);
      const searchFilter = result[0];

      expect(searchFilter.label).toBe('Search by');
      expect(searchFilter.id).toBe('policySearch');
      expect(searchFilter.placeholder).toBe('ID');
      expect(searchFilter.type).toBe('search');
      expect(searchFilter.defaultValue).toBe('');
    });

    it('should bind control correctly', () => {
      const testControl = new FormControl('test-value');
      const controls = {
        policySearch: testControl
      };

      const result = buildFilterOptions(controls);

      expect(result[0].control).toBe(testControl);
      expect(result[0].control?.value).toBe('test-value');
    });
  });
});
