import { ChangeDetectionStrategy, Component } from '@angular/core';

import { PagePlaceholder } from '../../shared/components/page-placeholder/page-placeholder';

@Component({
  selector: 'app-my-day-page',
  imports: [PagePlaceholder],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<app-page-placeholder title="My Day" description="Planned, due-today and overdue tasks for the selected date." />`,
})
export class MyDayPage {}
