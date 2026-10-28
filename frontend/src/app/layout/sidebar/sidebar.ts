import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

interface NavItem {
  label: string;
  path: string;
  icon: string;
}

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav aria-label="Primary" class="flex h-full flex-col gap-1 p-3">
      <div class="mb-4 px-3 py-2 text-lg font-semibold text-slate-900">Infraon Flow</div>
      @for (item of navItems; track item.path) {
        <a
          [routerLink]="item.path"
          routerLinkActive="bg-slate-100 text-slate-900 font-medium"
          ariaCurrentWhenActive="page"
          class="flex items-center gap-3 rounded-md px-3 py-2 text-slate-600 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-slate-400"
        >
          <i [class]="'pi ' + item.icon" aria-hidden="true"></i>
          <span>{{ item.label }}</span>
        </a>
      }
    </nav>
  `,
})
export class Sidebar {
  // Primary navigation from PRD §6.
  protected readonly navItems: readonly NavItem[] = [
    { label: 'Dashboard', path: '/dashboard', icon: 'pi-home' },
    { label: 'OKRs', path: '/okrs', icon: 'pi-bullseye' },
    { label: 'Initiatives', path: '/initiatives', icon: 'pi-flag' },
    { label: 'My Tasks', path: '/tasks', icon: 'pi-check-square' },
    { label: 'My Day', path: '/my-day', icon: 'pi-sun' },
    { label: 'Teams', path: '/teams', icon: 'pi-users' },
    { label: 'Reports', path: '/reports', icon: 'pi-chart-bar' },
    { label: 'Settings', path: '/settings', icon: 'pi-cog' },
  ];
}
