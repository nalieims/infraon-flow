import { ChangeDetectionStrategy, Component, booleanAttribute, input } from '@angular/core';

/**
 * Red error line with the Figma error icon, shown under a field or above form actions.
 * Give it `errorId` and point the field's `aria-describedby` at that id.
 */
@Component({
  selector: 'app-field-error',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './field-error.component.html',
  styleUrl: './field-error.component.css',
  host: {
    class: 'flex items-start gap-1.5 text-[12px] font-medium text-danger-ink',
    '[attr.id]': 'errorId() || null',
    '[attr.role]': "alert() ? 'alert' : null",
  },
})
export class FieldErrorComponent {
  readonly errorId = input('');
  /** Announce immediately (for messages that appear without the user leaving a field). */
  readonly alert = input(false, { transform: booleanAttribute });
}
