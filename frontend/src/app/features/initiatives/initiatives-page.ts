import { ChangeDetectionStrategy, Component } from '@angular/core';

import { PagePlaceholder } from '../../shared/components/page-placeholder/page-placeholder';

@Component({
  selector: 'app-initiatives-page',
  imports: [PagePlaceholder],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<app-page-placeholder title="Initiatives" description="Bodies of work linked to key results." />`,
})
export class InitiativesPage {}
