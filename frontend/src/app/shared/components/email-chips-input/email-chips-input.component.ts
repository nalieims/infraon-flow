import { ChangeDetectionStrategy, Component, computed, input, model, signal } from '@angular/core';

import { checkEmail } from '../../utils/email-validators';
import { FieldErrorComponent } from '../field-error/field-error.component';

const MESSAGES = {
  email: 'Enter a valid email address, e.g. name@company.com.',
  domainEnding: 'Add the domain ending, e.g. name@company.com.',
  duplicate: 'That email is already on the list.',
} as const;

/**
 * Email chip input. Enter, comma, semicolon, space or leaving the field turns the typed text into
 * chips; Backspace in an empty field removes the last chip.
 */
@Component({
  selector: 'app-email-chips-input',
  imports: [FieldErrorComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './email-chips-input.component.html',
  styleUrl: './email-chips-input.component.css',
  host: { class: 'flex flex-col gap-1.5' },
})
export class EmailChipsInputComponent {
  readonly inputId = input.required<string>();
  readonly hint = input('');
  readonly placeholder = input('Add another email');
  /** Screen-reader name for the chip list, e.g. "Teammates to invite". */
  readonly listLabel = input('Added emails');
  readonly emails = model<string[]>([]);

  protected readonly draft = signal('');
  protected readonly error = signal<string | null>(null);

  protected readonly errorId = computed(() => `${this.inputId()}-error`);
  protected readonly hintId = computed(() => `${this.inputId()}-hint`);

  protected onInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.draft.set(value);
    this.error.set(null);
    if (/[\s,;]/.test(value)) {
      this.commit();
    }
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.commit();
    } else if (event.key === 'Backspace' && this.draft() === '' && this.emails().length > 0) {
      this.emails.update((list) => list.slice(0, -1));
    }
  }

  protected onBlur(): void {
    if (this.draft().trim()) {
      this.commit();
    }
  }

  protected remove(email: string): void {
    this.emails.update((list) => list.filter((item) => item !== email));
  }

  /** Turns the draft into chips. Invalid parts stay in the field with an error. */
  commit(): void {
    const parts = this.draft()
      .split(/[\s,;]+/)
      .map((part) => part.trim())
      .filter(Boolean);
    const added: string[] = [];
    const rejected: string[] = [];
    let message: string | null = null;
    for (const part of parts) {
      const problem = checkEmail(part);
      const known = [...this.emails(), ...added].some(
        (email) => email.toLowerCase() === part.toLowerCase(),
      );
      if (problem) {
        rejected.push(part);
        message ??= MESSAGES[problem];
      } else if (known) {
        message ??= MESSAGES.duplicate;
      } else {
        added.push(part);
      }
    }
    if (added.length) {
      this.emails.update((list) => [...list, ...added]);
    }
    this.draft.set(rejected.join(' '));
    this.error.set(message);
  }
}
