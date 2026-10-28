import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { Sidebar } from '../sidebar/sidebar';
import { Topbar } from '../topbar/topbar';

/** Authenticated application shell: sidebar navigation, topbar and routed page content. */
@Component({
  selector: 'app-main-layout',
  imports: [RouterOutlet, Sidebar, Topbar],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex h-screen">
      <aside class="hidden w-60 shrink-0 border-r border-slate-200 bg-white md:block">
        <app-sidebar />
      </aside>
      <div class="flex min-w-0 flex-1 flex-col">
        <app-topbar />
        <main class="flex-1 overflow-y-auto p-6">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
})
export class MainLayout {}
