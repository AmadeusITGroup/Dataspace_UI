import { FormControl, FormGroup } from '@angular/forms';
import { makeOthersRequiredValidator } from './make-others-required.validator';

describe('makeOthersRequiredValidator', () => {
  it('should return null when trigger control is empty', () => {
    const formGroup = new FormGroup({
      trigger: new FormControl(''),
      field1: new FormControl(''),
      field2: new FormControl('')
    });

    const validator = makeOthersRequiredValidator('trigger', ['field1', 'field2']);
    expect(validator(formGroup)).toBeNull();
  });

  it('should return null when trigger control is whitespace only', () => {
    const formGroup = new FormGroup({
      trigger: new FormControl('   '),
      field1: new FormControl(''),
      field2: new FormControl('')
    });

    const validator = makeOthersRequiredValidator('trigger', ['field1', 'field2']);
    expect(validator(formGroup)).toBeNull();
  });

  it('should return null when trigger has value and all other fields have values', () => {
    const formGroup = new FormGroup({
      trigger: new FormControl('trigger value'),
      field1: new FormControl('value1'),
      field2: new FormControl('value2')
    });

    const validator = makeOthersRequiredValidator('trigger', ['field1', 'field2']);
    expect(validator(formGroup)).toBeNull();
  });

  it('should return error when trigger has value but other fields are empty', () => {
    const formGroup = new FormGroup({
      trigger: new FormControl('trigger value'),
      field1: new FormControl(''),
      field2: new FormControl('')
    });

    const validator = makeOthersRequiredValidator('trigger', ['field1', 'field2']);
    expect(validator(formGroup)).toEqual({ makeOthersRequired: true });
  });

  it('should return error when trigger has value and some fields are empty', () => {
    const formGroup = new FormGroup({
      trigger: new FormControl('trigger value'),
      field1: new FormControl('value1'),
      field2: new FormControl('')
    });

    const validator = makeOthersRequiredValidator('trigger', ['field1', 'field2']);
    expect(validator(formGroup)).toEqual({ makeOthersRequired: true });
  });

  it('should return error when trigger has value and fields have only whitespace', () => {
    const formGroup = new FormGroup({
      trigger: new FormControl('trigger value'),
      field1: new FormControl('  '),
      field2: new FormControl('value2')
    });

    const validator = makeOthersRequiredValidator('trigger', ['field1', 'field2']);
    expect(validator(formGroup)).toEqual({ makeOthersRequired: true });
  });

  it('should handle single dependent field', () => {
    const formGroup = new FormGroup({
      trigger: new FormControl('trigger value'),
      field1: new FormControl('value1')
    });

    const validator = makeOthersRequiredValidator('trigger', ['field1']);
    expect(validator(formGroup)).toBeNull();
  });

  it('should handle non-existent fields gracefully', () => {
    const formGroup = new FormGroup({
      trigger: new FormControl('trigger value'),
      field1: new FormControl('')
    });

    const validator = makeOthersRequiredValidator('trigger', ['field1', 'nonExistent']);
    expect(validator(formGroup)).toEqual({ makeOthersRequired: true });
  });
});
