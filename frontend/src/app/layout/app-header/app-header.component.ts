import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  booleanAttribute,
  computed,
  inject,
  input,
  output,
  viewChild,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter, map } from 'rxjs';
/** One tab of the phone bottom bar: where it goes and the Tailwind classes that draw its icon. */
interface BottomTab {
  label: string;
  path: string;
  iconClass: string;
}

/** One breadcrumb step: the text and the page it links to. */
interface Breadcrumb {
  label: string;
  link: string;
}

/** The main sections, matching the sidebar menu. */
const SECTIONS: readonly Breadcrumb[] = [
  { label: 'Dashboard', link: '/dashboard' },
  { label: 'OKRs', link: '/okrs' },
  { label: 'Initiatives', link: '/initiatives' },
  { label: 'My Tasks', link: '/tasks' },
  { label: 'My Day', link: '/my-day' },
  { label: 'Teams', link: '/teams' },
  { label: 'Reports', link: '/reports' },
  { label: 'Settings', link: '/settings' },
];

/**
 * Top bar of the app shell, one component for both layouts.
 * Desktop, 1024 px and up (Figma 1472:912): breadcrumb, search, Create, notifications, help, account.
 * Phone and tablet, below 1024 px (Figma 1474:1554): menu button, page title, icon actions.
 * The breadcrumb and the phone title follow the current page.
 */
@Component({
  selector: 'app-header',
  imports: [RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app-header.component.html',
  styleUrl: './app-header.component.css',
  host: {
    class: 'block',
    '(document:keydown.control.k)': 'focusSearch($event)',
    '(document:keydown.meta.k)': 'focusSearch($event)',
  },
})
export class AppHeaderComponent {
  /** Whether the navigation drawer opened by the menu button is open. */
  readonly menuOpen = input(false, { transform: booleanAttribute });

  /** Emitted when the phone menu button is pressed. */
  readonly menuToggle = output<void>();

  // ----- Injected services -----
  private readonly router = inject(Router);

  // ----- Static sample data from the Figma design (replace with real data later) -----
  private readonly workspaceName = 'Infraon Labs';
  protected readonly userInitials = 'PR';
  /** Phone bottom bar tabs (Figma 1474:2075). Icon sizes are Figma's sizes inside the 18 px box. */
  protected readonly bottomTabs: readonly BottomTab[] = [
    {
      label: 'Dashboard',
      path: '/dashboard',
      iconClass: 'size-[15.75px] [--icon:url(/icons/app-shell/nav-dashboard.svg)]',
    },
    {
      label: 'OKRs',
      path: '/okrs',
      iconClass: 'size-[18px] [--icon:url(/icons/create-account/okr.svg)]',
    },
    {
      label: 'My Day',
      path: '/my-day',
      iconClass: 'size-[18px] [--icon:url(/icons/personal-workspace/my-day.svg)]',
    },
    {
      label: 'Tasks',
      path: '/tasks',
      iconClass: 'h-[14.63px] w-[18px] [--icon:url(/icons/app-shell/nav-my-tasks.svg)]',
    },
  ];
  protected readonly unreadCount = 3;
  protected readonly notificationsLabel = `Notifications (${this.unreadCount} unread)`;

  // ----- Elements in the template -----
  /** The desktop search box (`#searchInput` in the template). */
  private readonly searchInput = viewChild<ElementRef<HTMLInputElement>>('searchInput');

  // ----- State -----

  /**
   * The current address, for example "/okrs/123".
   * The router sends many events; we only keep `NavigationEnd`, which fires once a page has opened.
   */
  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );

  // ----- Values derived from state (computed) -----

  /** The address without "?query" or "#fragment": "/okrs/123?tab=1" becomes "/okrs/123". */
  private readonly currentPath = computed(() => {
    const url = this.currentUrl();
    return url.split('?')[0].split('#')[0];
  });

  /** The section the current page belongs to, or null. "/okrs/123" belongs to OKRs. */
  private readonly currentSection = computed(() => {
    const path = this.currentPath();
    for (const section of SECTIONS) {
      const isSectionPage = path === section.link;
      const isPageInsideSection = path.startsWith(section.link + '/');
      if (isSectionPage || isPageInsideSection) {
        return section;
      }
    }
    return null;
  });

  /** Desktop breadcrumb: "Infraon Labs › <section>". */
  protected readonly breadcrumbs = computed(() => {
    const items: Breadcrumb[] = [{ label: this.workspaceName, link: '/dashboard' }];
    const section = this.currentSection();
    if (section) {
      items.push(section);
    }
    return items;
  });

  /** Phone title: "Objective" on an objective's page (Figma 1474:1560), otherwise the section name. */
  protected readonly pageTitle = computed(() => {
    // An objective's page is "/okrs/<id>": exactly two parts, the first being "okrs".
    const parts = this.currentPath()
      .split('/')
      .filter((part) => part !== '');
    if (parts.length === 2 && parts[0] === 'okrs') {
      return 'Objective';
    }
    const section = this.currentSection();
    if (section) {
      return section.label;
    }
    return '';
  });

  // ----- Actions -----

  /** Ctrl+K / Cmd+K moves focus to the desktop search box. */
  protected focusSearch(event: Event): void {
    const field = this.searchInput()?.nativeElement;
    if (!field) {
      return;
    }
    // `offsetParent` is null when the element is hidden (the search box is hidden on phones).
    const isVisible = field.offsetParent !== null;
    if (!isVisible) {
      return;
    }
    event.preventDefault(); // stop the browser's own Ctrl+K shortcut
    field.focus();
  }
}
