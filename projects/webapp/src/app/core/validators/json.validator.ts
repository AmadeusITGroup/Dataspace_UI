import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function jsonValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) {
      return null; // Don't validate empty values
    }
    try {
      JSON.parse(control.value);
      return null; // Valid JSON
    } catch (e) {
      console.debug(e);
      return { invalidJson: true }; // Invalid JSON
    }
  };
}
