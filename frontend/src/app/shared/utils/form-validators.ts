import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/** Rejects values that are only whitespace. Empty values are left to `required`. */
export const notBlankValidator: ValidatorFn = (
  control: AbstractControl<string | null>,
): ValidationErrors | null => {
  const value = control.value ?? '';
  return value.length > 0 && !value.trim() ? { required: true } : null;
};

const PERSON_NAME = /^[A-Za-z]+(?:[ '’-]+[A-Za-z]+)*$/;

/** Letters A-Z with spaces, hyphens and apostrophes between them. Empty and blank values are left to `required`. */
export const personNameValidator: ValidatorFn = (
  control: AbstractControl<string | null>,
): ValidationErrors | null => {
  const value = (control.value ?? '').trim();
  return value && !PERSON_NAME.test(value) ? { personName: true } : null;
};
