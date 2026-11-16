import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+$/;
const DOMAIN_ENDING = /@[^\s@.]+(\.[^\s@.]+)*\.[a-z]{2,}$/i;

/** Validates an email address string. Returns null when valid. */
export function checkEmail(value: string): 'email' | 'domainEnding' | null {
  const email = value.trim();
  if (!EMAIL_SHAPE.test(email)) {
    return 'email';
  }
  return DOMAIN_ENDING.test(email) ? null : 'domainEnding';
}

/** Email format plus a domain ending (`name@company.com`). Empty values are left to `required`. */
export const workEmailValidator: ValidatorFn = (
  control: AbstractControl<string | null>,
): ValidationErrors | null => {
  const value = control.value ?? '';
  if (!value.trim()) {
    return null;
  }
  const error = checkEmail(value);
  return error ? { [error]: true } : null;
};
