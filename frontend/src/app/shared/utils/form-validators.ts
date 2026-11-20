import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/** Rejects values that are only whitespace. Empty values are left to `required`. */
export const notBlankValidator: ValidatorFn = (
  control: AbstractControl<string | null>,
): ValidationErrors | null => {
  const value = control.value ?? '';
  return value.length > 0 && !value.trim() ? { required: true } : null;
};

/** Rejects values made only of digits (and spaces). Empty values are left to `required`. */
export const notOnlyNumbersValidator: ValidatorFn = (
  control: AbstractControl<string | null>,
): ValidationErrors | null => {
  const value = (control.value ?? '').trim();
  return value && /^[\d\s]+$/.test(value) ? { onlyNumbers: true } : null;
};
