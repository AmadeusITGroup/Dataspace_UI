import { FormControl, FormGroup } from '@angular/forms';
import { atLeastOneRequiredValidator } from './at-least-one-required.validator';

describe('atLeastOneRequiredValidator', () => {
  it('should return null when at least one control has a value', () => {
    const formGroup = new FormGroup({
      field1: new FormControl('value'),
      field2: new FormControl(''),
      field3: new FormControl('')
    });
    const validator = atLeastOneRequiredValidator(['field1', 'field2', 'field3']);
    expect(validator(formGroup)).toBeNull();
  });

  it('should return null when multiple controls have values', () => {
    const formGroup = new FormGroup({
      field1: new FormControl('value1'),
      field2: new FormControl('value2'),
      field3: new FormControl('')
    });
    const validator = atLeastOneRequiredValidator(['field1', 'field2', 'field3']);
    expect(validator(formGroup)).toBeNull();
  });

  it('should return error when all controls are empty', () => {
    const formGroup = new FormGroup({
      field1: new FormControl(''),
      field2: new FormControl(''),
      field3: new FormControl('')
    });
    const validator = atLeastOneRequiredValidator(['field1', 'field2', 'field3']);
    expect(validator(formGroup)).toEqual({ atLeastOneRequired: true });
  });

  it('should return error when all controls are null', () => {
    const formGroup = new FormGroup({
      field1: new FormControl(null),
      field2: new FormControl(null),
      field3: new FormControl(null)
    });
    const validator = atLeastOneRequiredValidator(['field1', 'field2', 'field3']);
    expect(validator(formGroup)).toEqual({ atLeastOneRequired: true });
  });

  it('should return error when controls have only whitespace', () => {
    const formGroup = new FormGroup({
      field1: new FormControl('   '),
      field2: new FormControl('  '),
      field3: new FormControl('')
    });
    const validator = atLeastOneRequiredValidator(['field1', 'field2', 'field3']);
    expect(validator(formGroup)).toEqual({ atLeastOneRequired: true });
  });

  it('should handle non-existent control names', () => {
    const formGroup = new FormGroup({
      field1: new FormControl(''),
      field2: new FormControl('')
    });
    const validator = atLeastOneRequiredValidator(['field1', 'field2', 'nonExistent']);
    expect(validator(formGroup)).toEqual({ atLeastOneRequired: true });
  });

  it('should work with single control', () => {
    const formGroup = new FormGroup({
      field1: new FormControl('value')
    });
    const validator = atLeastOneRequiredValidator(['field1']);
    expect(validator(formGroup)).toBeNull();
  });

  it('should trim whitespace when checking values', () => {
    const formGroup = new FormGroup({
      field1: new FormControl('  value  ')
    });
    const validator = atLeastOneRequiredValidator(['field1']);
    expect(validator(formGroup)).toBeNull();
  });
});
