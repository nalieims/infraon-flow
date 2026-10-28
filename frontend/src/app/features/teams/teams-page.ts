import { ChangeDetectionStrategy, Component } from '@angular/core';

import { PagePlaceholder } from '../../shared/components/page-placeholder/page-placeholder';

@Component({
  selector: 'app-teams-page',
  imports: [PagePlaceholder],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<app-page-placeholder title="Teams" description="Workspace teams, members and team leads." />`,
})
export class TeamsPage {}
