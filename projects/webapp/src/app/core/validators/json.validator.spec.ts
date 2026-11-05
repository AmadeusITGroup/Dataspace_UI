import { FormControl } from '@angular/forms';
import { jsonValidator } from './json.validator';

describe('jsonValidator', () => {
  it('should return null for valid JSON string', () => {
    const control = new FormControl('{"key": "value"}');
    const validator = jsonValidator();
    expect(validator(control)).toBeNull();
  });

  it('should return null for valid JSON array', () => {
    const control = new FormControl('[1, 2, 3]');
    const validator = jsonValidator();
    expect(validator(control)).toBeNull();
  });

  it('should return null for empty value', () => {
    const control = new FormControl('');
    const validator = jsonValidator();
    expect(validator(control)).toBeNull();
  });

  it('should return null for null value', () => {
    const control = new FormControl(null);
    const validator = jsonValidator();
    expect(validator(control)).toBeNull();
  });

  it('should return error for invalid JSON', () => {
    const control = new FormControl('{invalid json}');
    const validator = jsonValidator();
    expect(validator(control)).toEqual({ invalidJson: true });
  });

  it('should return error for malformed JSON', () => {
    const control = new FormControl('{"key": value}');
    const validator = jsonValidator();
    expect(validator(control)).toEqual({ invalidJson: true });
  });

  it('should return error for incomplete JSON', () => {
    const control = new FormControl('{"key": "value"');
    const validator = jsonValidator();
    expect(validator(control)).toEqual({ invalidJson: true });
  });

  it('should return null for valid nested JSON', () => {
    const control = new FormControl('{"outer": {"inner": "value"}}');
    const validator = jsonValidator();
    expect(validator(control)).toBeNull();
  });
});
