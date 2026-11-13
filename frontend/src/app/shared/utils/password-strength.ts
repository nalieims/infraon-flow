import { PASSWORD_MIN_LENGTH } from './password-validators';

export type StrengthLevel = 'none' | 'weak' | 'fair' | 'strong' | 'very_strong';

export interface PasswordStrength {
  level: StrengthLevel;
  /** Number of filled meter segments, 0 to 4. */
  filled: number;
  /** Lead word shown before the rule, empty when nothing is typed. */
  label: string;
  tone: 'none' | 'warn' | 'success';
}

/**
 * Scores a password for the four-segment meter. The policy (length, number, symbol) decides
 * "strong"; mixed case on top of that fills the fourth segment.
 */
export function passwordStrength(value: string): PasswordStrength {
  if (!value) {
    return { level: 'none', filled: 0, label: '', tone: 'none' };
  }
  const met = [
    value.length >= PASSWORD_MIN_LENGTH,
    /\d/.test(value),
    /[^A-Za-z0-9\s]/.test(value),
  ].filter(Boolean).length;
  if (met < 2) {
    return { level: 'weak', filled: 1, label: 'Weak.', tone: 'warn' };
  }
  if (met === 2) {
    return { level: 'fair', filled: 2, label: 'Fair.', tone: 'warn' };
  }
  if (/[a-z]/.test(value) && /[A-Z]/.test(value)) {
    return { level: 'very_strong', filled: 4, label: 'Very strong.', tone: 'success' };
  }
  return { level: 'strong', filled: 3, label: 'Strong.', tone: 'success' };
}
