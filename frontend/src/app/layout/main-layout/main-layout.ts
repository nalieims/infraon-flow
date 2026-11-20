import { BreakpointObserver } from '@angular/cdk/layout';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DrawerModule } from 'primeng/drawer';

import { AppSidebarComponent } from '../app-sidebar/app-sidebar.component';
import { AppHeaderComponent } from '../app-header/app-header.component';
/** Authenticated application shell: sidebar navigation, topbar and routed page content. */
@Component({
  selector: 'app-main-layout',
  imports: [AppSidebarComponent, AppHeaderComponent, DrawerModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex h-dvh">
      <aside
        class="hidden shrink-0 transition-[width] duration-200 motion-reduce:transition-none lg:block"
        [class.w-61]="!sidebarCollapsed()"
        [class.w-16]="sidebarCollapsed()"
      >
        <app-sidebar [collapsed]="sidebarCollapsed()" (collapseToggle)="toggleSidebar()" />
      </aside>
      <div class="flex min-w-0 flex-1 flex-col">
        <app-header [menuOpen]="menuOpen()" (menuToggle)="toggleMenu()" />
        <main
          class="flex-1 overflow-y-auto bg-page p-6 pb-[calc(88px+env(safe-area-inset-bottom))] lg:pb-6"
        ></main>
      </div>
      <p-drawer
        [visible]="menuOpen()"
        (visibleChange)="menuOpen.set($event)"
        position="left"
        styleClass="w-[300px] lg:hidden"
      >
        <ng-template #headless>
          <app-sidebar inDrawer (closeRequested)="closeMenu()" />
        </ng-template>
      </p-drawer>
    </div>
  `,
})
export class MainLayout {
  /** Whether the desktop sidebar is collapsed to the icon-only rail. */
  protected readonly sidebarCollapsed = signal(false);
  /** Whether the mobile menu drawer is open. */
  protected readonly menuOpen = signal(false);

  constructor() {
    // Close the drawer if the screen grows to desktop size, where the sidebar is always visible.
    inject(BreakpointObserver)
      .observe('(min-width: 1024px)')
      .pipe(takeUntilDestroyed())
      .subscribe((state) => {
        if (state.matches) {
          this.closeMenu();
        }
      });
  }

  /** Collapse button in the sidebar: switch between the full sidebar and the icon rail. */
  protected toggleSidebar(): void {
    this.sidebarCollapsed.update((collapsed) => !collapsed);
  }
  /** ☰ or "More" in the header: open the drawer, or close it if it is open. */
  protected toggleMenu(): void {
    this.menuOpen.update((open) => !open);
  }

  /** Close button, a menu link, or growing to desktop size: close the drawer. */
  protected closeMenu(): void {
    this.menuOpen.set(false);
  }
}
