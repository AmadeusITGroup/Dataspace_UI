import {
  removeEmptyProperties,
  isResourceNotFound,
  arePropertiesEqual,
  retrieveErrorMessage,
  composedErrorMessage,
  transformInArray,
  extractErrorReason
} from './object.util';
import { HttpErrorResponse } from '@angular/common/http';

describe('object.util', () => {
  describe('removeEmptyProperties', () => {
    it('removes undefined and empty string properties', () => {
      const obj = { a: 1, b: undefined, c: '', d: 2 };
      expect(removeEmptyProperties(obj)).toEqual({ a: 1, d: 2 });
    });
    it('returns a new object', () => {
      const obj = { a: 1 };
      const result = removeEmptyProperties(obj);
      expect(result).not.toBe(obj);
    });
  });

  describe('isResourceNotFound', () => {
    it('returns true if resource not found', () => {
      const resources = [{ id: '1' }, { id: '2' }];
      expect(isResourceNotFound('3', resources, 'id')).toBe(true);
    });
    it('returns false if resource found', () => {
      const resources = [{ id: '1' }, { id: '2' }];
      expect(isResourceNotFound('2', resources, 'id')).toBe(false);
    });
    it('returns false if resources is undefined', () => {
      expect(isResourceNotFound('1', undefined, 'id')).toBe(false);
    });
  });

  describe('arePropertiesEqual', () => {
    it('returns true if all properties are equal', () => {
      expect(arePropertiesEqual({ a: 1 }, { a: 1, b: 2 })).toBe(true);
    });
    it('returns false if any property is different', () => {
      expect(arePropertiesEqual({ a: 1 }, { a: 2, b: 2 })).toBe(false);
    });
  });

  describe('retrieveErrorMessage', () => {
    it('returns message from HttpErrorResponse with array error', () => {
      const error = new HttpErrorResponse({ error: [{ message: 'Test error' }] });
      expect(retrieveErrorMessage(error)).toBe('Test error');
    });
    it('returns stringified error if error is string', () => {
      const error = new HttpErrorResponse({ error: 'Some error' });
      expect(retrieveErrorMessage(error)).toBe('Some error');
    });
    it('returns message from Error object', () => {
      const error = new Error('Error message');
      expect(retrieveErrorMessage(error)).toBe('Error message');
    });
    it('parses JSON error message', () => {
      const error = new HttpErrorResponse({ error: '{"error":{"message":"Parsed error"}}' });
      expect(retrieveErrorMessage(error)).toBe('Parsed error');
    });
  });

  describe('composedErrorMessage', () => {
    it('returns error message if present', () => {
      const error = new Error('Some error');
      expect(composedErrorMessage(error, 'saving', 'resource')).toBe('Some error');
    });
    it('returns fallback message if error message is empty', () => {
      const error = new Error('');
      expect(composedErrorMessage(error, 'updating', 'item')).toContain(
        'An unknown error occurred'
      );
    });
  });

  describe('transformInArray', () => {
    it('wraps value in array if not array', () => {
      expect(transformInArray('a')).toEqual(['a']);
    });
    it('returns array as is', () => {
      expect(transformInArray(['a', 'b'])).toEqual(['a', 'b']);
    });
    it('returns empty array for undefined', () => {
      expect(transformInArray(undefined)).toEqual([]);
    });
    it('returns empty array for null', () => {
      expect(transformInArray(null)).toEqual([]);
    });
  });

  describe('extractErrorReason', () => {
    it('returns reason from errorDetailObject with @type ending Error', () => {
      const obj = {
        errorDetailObject: { '@type': 'SomeError', 'dspace:reason': 'Reason here' }
      };
      expect(extractErrorReason(obj)).toBe('Reason here');
    });
    it('parses stringified errorDetailObject', () => {
      const obj = {
        errorDetailObject: JSON.stringify({
          '@type': 'SomeError',
          'dspace:reason': 'Parsed reason'
        })
      };
      expect(extractErrorReason(obj)).toBe('Parsed reason');
    });
    it('returns message if no detail', () => {
      const obj = { message: 'Fallback message' };
      expect(extractErrorReason(obj)).toBe('Fallback message');
    });
    it('returns errorDetail if present and string', () => {
      const obj = { errorDetail: 'Error detail' };
      expect(extractErrorReason(obj)).toBe('Error detail');
    });
    it('returns message from detail object', () => {
      const obj = { errorDetailObject: { message: 'Detail message' } };
      expect(extractErrorReason(obj)).toBe('Detail message');
    });
    it('returns undefined if nothing matches', () => {
      expect(extractErrorReason({})).toBeUndefined();
    });
  });
});
