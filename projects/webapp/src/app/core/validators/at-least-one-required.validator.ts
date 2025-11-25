import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function atLeastOneRequiredValidator(controlNames: string[]): ValidatorFn {
  return (formGroup: AbstractControl): ValidationErrors | null => {
    const hasValue = controlNames.some((controlName) => {
      const control = formGroup.get(controlName);
      return control && control.value && control.value.trim() !== '';
    });

    return hasValue ? null : { atLeastOneRequired: true };
  };
}
