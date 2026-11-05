import { genericFilter } from './search.util';

describe('search.util', () => {
  describe('genericFilter', () => {
    interface TestItem {
      id: string;
      name: string;
      age: number;
      city?: string;
    }

    const testData: TestItem[] = [
      { id: '1', name: 'John Doe', age: 30, city: 'New York' },
      { id: '2', name: 'Jane Smith', age: 25, city: 'Los Angeles' },
      { id: '3', name: 'Bob Johnson', age: 35, city: 'Chicago' },
      { id: '4', name: 'Alice Brown', age: 28, city: 'New York' }
    ];

    it('should return all data when filter is null', () => {
      const result = genericFilter(testData, null, ['name']);
      expect(result).toEqual(testData);
    });

    it('should return all data when filter is undefined', () => {
      const result = genericFilter(testData, undefined, ['name']);
      expect(result).toEqual(testData);
    });

    it('should return all data when filter is empty string', () => {
      const result = genericFilter(testData, '', ['name']);
      expect(result).toEqual(testData);
    });

    it('should filter by key=value format', () => {
      const result = genericFilter(testData, 'city=New York', ['name']);
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('John Doe');
      expect(result[1].name).toBe('Alice Brown');
    });

    it('should filter by multiple key=value pairs', () => {
      const result = genericFilter(testData, 'city=New York,name=John', ['name']);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('John Doe');
    });

    it('should filter case-insensitively for key=value format', () => {
      const result = genericFilter(testData, 'city=new york', ['name']);
      expect(result).toHaveLength(2);
    });

    it('should filter by simple text search across specified keys', () => {
      const result = genericFilter(testData, 'John', ['name']);
      expect(result).toHaveLength(2);
      expect(result.map((r) => r.name)).toContain('John Doe');
      expect(result.map((r) => r.name)).toContain('Bob Johnson');
    });

    it('should filter case-insensitively for simple text search', () => {
      const result = genericFilter(testData, 'SMITH', ['name']);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Jane Smith');
    });

    it('should search across multiple value keys', () => {
      const result = genericFilter(testData, 'New', ['name', 'city']);
      expect(result).toHaveLength(2);
    });

    it('should use custom matcher when provided for key=value format', () => {
      const matcher = (item: TestItem, key: string, value: string) => {
        if (key === 'age') {
          return item.age === parseInt(value);
        }
        return false;
      };
      const result = genericFilter(testData, 'age=30', ['name'], matcher);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('John Doe');
    });

    it('should use custom matcher when provided for simple search', () => {
      const matcher = (item: TestItem, key: string, value: string) => {
        return item.name.toLowerCase().startsWith(value);
      };
      const result = genericFilter(testData, 'j', ['name'], matcher);
      expect(result).toHaveLength(2);
    });

    it('should handle numeric values in simple search', () => {
      const result = genericFilter(testData, '30', ['age']);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('John Doe');
    });
  });
});
