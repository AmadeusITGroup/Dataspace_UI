import { FormControl } from '@angular/forms';
import { resourceExistsValidator } from './resource-exists.validator';

describe('resourceExistsValidator', () => {
  interface TestResource {
    id: string;
    name: string;
  }

  const resources: TestResource[] = [
    { id: '1', name: 'Resource 1' },
    { id: '2', name: 'Resource 2' },
    { id: '3', name: 'Resource 3' }
  ];

  it('should return null for empty value', () => {
    const control = new FormControl('');
    const validator = resourceExistsValidator(resources, 'id');
    expect(validator(control)).toBeNull();
  });

  it('should return null for null value', () => {
    const control = new FormControl(null);
    const validator = resourceExistsValidator(resources, 'id');
    expect(validator(control)).toBeNull();
  });

  it('should return null when resource exists', () => {
    const control = new FormControl('1');
    const validator = resourceExistsValidator(resources, 'id');
    expect(validator(control)).toBeNull();
  });

  it('should return error when resource does not exist', () => {
    const control = new FormControl('999');
    const validator = resourceExistsValidator(resources, 'id');
    expect(validator(control)).toEqual({ resourceNotFound: 'notFound' });
  });

  it('should work with different key types', () => {
    const control = new FormControl('Resource 2');
    const validator = resourceExistsValidator(resources, 'name');
    expect(validator(control)).toBeNull();
  });

  it('should return error for non-existent name', () => {
    const control = new FormControl('Non-existent');
    const validator = resourceExistsValidator(resources, 'name');
    expect(validator(control)).toEqual({ resourceNotFound: 'notFound' });
  });

  it('should work with empty resource list', () => {
    const control = new FormControl('1');
    const validator = resourceExistsValidator([], 'id');
    expect(validator(control)).toEqual({ resourceNotFound: 'notFound' });
  });
});
