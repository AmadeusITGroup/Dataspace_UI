import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { isResourceNotFound } from '../utils/object.util';

export function resourceExistsValidator<T>(resources: T[], idKey: keyof T): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) {
      return null;
    }
    return !isResourceNotFound(control.value, resources, idKey)
      ? null
      : { resourceNotFound: 'notFound' };
  };
}
