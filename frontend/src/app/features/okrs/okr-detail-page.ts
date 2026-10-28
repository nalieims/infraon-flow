import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { PagePlaceholder } from '../../shared/components/page-placeholder/page-placeholder';

@Component({
  selector: 'app-okr-detail-page',
  imports: [PagePlaceholder, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-page-placeholder title="Objective" [description]="'Objective ' + id()">
      <a routerLink="/okrs" class="mt-4 inline-block text-sm text-slate-600 underline">Back to OKRs</a>
    </app-page-placeholder>
  `,
})
export class OkrDetailPage {
  /** Objective UUID from the `:id` route parameter (bound via withComponentInputBinding). */
  readonly id = input.required<string>();
}
