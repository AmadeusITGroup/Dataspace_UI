import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function makeOthersRequiredValidator(
  controlNameTrigger: string,
  controlNames: string[]
): ValidatorFn {
  return (formGroup: AbstractControl): ValidationErrors | null => {
    const controls = controlNames.map((controlName) => formGroup.get(controlName));
    const controlNameTriggerControl = formGroup.get(controlNameTrigger);
    const hasValue =
      controlNameTriggerControl &&
      controlNameTriggerControl.value &&
      controlNameTriggerControl.value.trim() !== '';

    if (hasValue) {
      const invalidControls = controls.filter(
        (control) => control && (!control.value || control.value.trim() === '')
      );
      if (invalidControls.length > 0) {
        return { makeOthersRequired: true };
      }
    }

    return null;
  };
}
