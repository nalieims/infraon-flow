import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TagModule } from 'primeng/tag';

import { HealthService } from '../../core/services/health.service';

type ApiStatus = 'checking' | 'online' | 'offline';

@Component({
  selector: 'app-topbar',
  imports: [TagModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="flex h-14 items-center justify-between border-b border-slate-200 bg-white px-6">
      <!-- Workspace switcher, global create action and user menu arrive in M1 (PRD §12). -->
      <span class="text-sm text-slate-500">No workspace selected</span>
      <p-tag [value]="statusLabel[apiStatus()]" [severity]="statusSeverity[apiStatus()]" />
    </header>
  `,
})
export class Topbar {
  protected readonly apiStatus = signal<ApiStatus>('checking');
  protected readonly statusLabel: Record<ApiStatus, string> = {
    checking: 'API: checking…',
    online: 'API: online',
    offline: 'API: unreachable',
  };
  protected readonly statusSeverity: Record<ApiStatus, 'secondary' | 'success' | 'danger'> = {
    checking: 'secondary',
    online: 'success',
    offline: 'danger',
  };

  constructor() {
    inject(HealthService)
      .check()
      .pipe(takeUntilDestroyed(inject(DestroyRef)))
      .subscribe({
        next: () => this.apiStatus.set('online'),
        error: () => this.apiStatus.set('offline'),
      });
  }
}
