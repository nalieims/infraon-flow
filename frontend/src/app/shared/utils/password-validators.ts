import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export const PASSWORD_MIN_LENGTH = 12;

/** At least 12 characters with a number and a symbol. Empty values are left to `required`. */
export const passwordPolicyValidator: ValidatorFn = (
  control: AbstractControl<string | null>,
): ValidationErrors | null => {
  const value = control.value ?? '';
  if (!value) {
    return null;
  }
  const ok =
    value.length >= PASSWORD_MIN_LENGTH && /\d/.test(value) && /[^A-Za-z0-9\s]/.test(value);
  return ok ? null : { passwordPolicy: true };
};
