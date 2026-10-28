import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Temporary page body used by scaffolded routes until each feature is implemented. */
@Component({
  selector: 'app-page-placeholder',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="rounded-lg border border-dashed border-slate-300 bg-white p-8">
      <h1 class="text-2xl font-semibold text-slate-900">{{ title() }}</h1>
      @if (description()) {
        <p class="mt-2 text-slate-600">{{ description() }}</p>
      }
      <ng-content />
    </section>
  `,
})
export class PagePlaceholder {
  readonly title = input.required<string>();
  readonly description = input<string>('');
}
