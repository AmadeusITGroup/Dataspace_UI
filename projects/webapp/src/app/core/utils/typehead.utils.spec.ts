import { convertToTypeheadList } from './typehead.utils';

describe('typehead.utils', () => {
  describe('convertToTypeheadList', () => {
    interface TestItem {
      id: string;
      name: string;
      value: number;
    }

    const testData: TestItem[] = [
      { id: '1', name: 'Charlie', value: 30 },
      { id: '2', name: 'Alice', value: 20 },
      { id: '3', name: 'Bob', value: 10 },
      { id: '4', name: 'Alice', value: 25 }
    ];

    it('should convert list to array of strings by key', () => {
      const result = convertToTypeheadList(testData, 'name');
      expect(result).toEqual(['Alice', 'Bob', 'Charlie']);
    });

    it('should remove duplicates by default', () => {
      const result = convertToTypeheadList(testData, 'name');
      expect(result.filter((item) => item === 'Alice')).toHaveLength(1);
    });

    it('should sort results by default', () => {
      const result = convertToTypeheadList(testData, 'name');
      expect(result).toEqual(['Alice', 'Bob', 'Charlie']);
    });

    it('should keep duplicates when enableUniq is false', () => {
      const result = convertToTypeheadList(testData, 'name', false, false);
      expect(result).toEqual(['Charlie', 'Alice', 'Bob', 'Alice']);
    });

    it('should not sort when enableSorting is false', () => {
      const result = convertToTypeheadList(testData, 'name', true, false);
      expect(result).toEqual(['Charlie', 'Alice', 'Bob']);
    });

    it('should handle empty arrays', () => {
      const result = convertToTypeheadList([], 'name');
      expect(result).toEqual([]);
    });

    it('should filter out empty strings', () => {
      const dataWithEmpty = [
        { id: '1', name: 'Alice', value: 10 },
        { id: '2', name: '', value: 20 },
        { id: '3', name: 'Bob', value: 30 }
      ];
      const result = convertToTypeheadList(dataWithEmpty, 'name');
      expect(result).toEqual(['Alice', 'Bob']);
    });
  });
});
