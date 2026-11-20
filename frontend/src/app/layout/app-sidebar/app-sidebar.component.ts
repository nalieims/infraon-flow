import { ChangeDetectionStrategy, Component, booleanAttribute, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

/** One menu row: where it goes and which Figma icon it shows (icon size in px). */
interface SidebarLink {
  label: string;
  path: string;
  icon: string;
  iconWidth: number;
  iconHeight: number;
}

/**
 * Main navigation sidebar, desktop layout (Figma 1472:812): logo row, WORKSPACE and
 * INSIGHTS menus, and the signed-in user at the bottom.
 */
@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app-sidebar.component.html',
  styleUrl: './app-sidebar.component.css',
  host: {
    class: 'flex h-full w-full flex-col border-r-[0.667px] border-line-soft bg-surface',
  },
})
export class AppSidebarComponent {
  /** True when the sidebar is collapsed to a narrow icon-only rail. */
  readonly collapsed = input(false, { transform: booleanAttribute });

  /** Emitted when the collapse/expand button is pressed. */
  readonly collapseToggle = output<void>();
  /** True when the sidebar is shown inside the mobile menu drawer (close button instead of collapse). */
  readonly inDrawer = input(false, { transform: booleanAttribute });

  /** Emitted when the drawer should close: the close button or a menu link was pressed. */
  readonly closeRequested = output<void>();
  // Static sample data from the Figma design.
  protected readonly workspaceLinks: readonly SidebarLink[] = [
    {
      label: 'Dashboard',
      path: '/dashboard',
      icon: '/icons/app-shell/nav-dashboard.svg',
      iconWidth: 14,
      iconHeight: 14,
    },
    {
      label: 'OKRs',
      path: '/okrs',
      icon: '/icons/create-account/okr.svg',
      iconWidth: 16,
      iconHeight: 16,
    },
    {
      label: 'Initiatives',
      path: '/initiatives',
      icon: '/icons/create-account/initiatives.svg',
      iconWidth: 16,
      iconHeight: 16,
    },
    {
      label: 'My Tasks',
      path: '/tasks',
      icon: '/icons/app-shell/nav-my-tasks.svg',
      iconWidth: 16,
      iconHeight: 13,
    },
    {
      label: 'My Day',
      path: '/my-day',
      icon: '/icons/personal-workspace/my-day.svg',
      iconWidth: 16,
      iconHeight: 16,
    },
    {
      label: 'Teams',
      path: '/teams',
      icon: '/icons/create-account/users.svg',
      iconWidth: 20,
      iconHeight: 16,
    },
  ];
  protected readonly settingsLink: SidebarLink = {
    label: 'Settings',
    path: '/settings',
    icon: '/icons/app-shell/nav-settings.svg',
    iconWidth: 15.32,
    iconHeight: 16,
  };
  protected readonly userName = 'Priya Raman';
  protected readonly userRole = 'Team Lead · Product';
  protected readonly userInitials = 'PR';
}
