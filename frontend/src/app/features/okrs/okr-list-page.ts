import { ChangeDetectionStrategy, Component } from '@angular/core';

import { PagePlaceholder } from '../../shared/components/page-placeholder/page-placeholder';

@Component({
  selector: 'app-okr-list-page',
  imports: [PagePlaceholder],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<app-page-placeholder title="OKRs" description="Company, team and individual objectives with their key results." />`,
})
export class OkrListPage {}
