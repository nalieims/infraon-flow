import { Routes } from '@angular/router';

import { authGuard } from './core/guards/auth.guard';
import { AuthLayout } from './layout/auth-layout/auth-layout';
import { MainLayout } from './layout/main-layout/main-layout';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },

  // Sign-up has its own full-screen two-column layout; both steps live on /register
  {
    path: 'register',
    loadChildren: () => import('./features/auth/signup/signup.routes').then((m) => m.SIGNUP_ROUTES),
  },

  // Unauthenticated pages: /login
  {
    path: '',
    component: AuthLayout,
    loadChildren: () => import('./features/auth/auth.routes').then((m) => m.AUTH_ROUTES),
  },

  // Authenticated application shell
  {
    path: '',
    component: MainLayout,
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', loadChildren: () => import('./features/dashboard/dashboard.routes').then((m) => m.DASHBOARD_ROUTES) },
      { path: 'okrs', loadChildren: () => import('./features/okrs/okrs.routes').then((m) => m.OKRS_ROUTES) },
      { path: 'initiatives', loadChildren: () => import('./features/initiatives/initiatives.routes').then((m) => m.INITIATIVES_ROUTES) },
      { path: 'tasks', loadChildren: () => import('./features/tasks/tasks.routes').then((m) => m.TASKS_ROUTES) },
      { path: 'my-day', loadChildren: () => import('./features/my-day/my-day.routes').then((m) => m.MY_DAY_ROUTES) },
      { path: 'teams', loadChildren: () => import('./features/teams/teams.routes').then((m) => m.TEAMS_ROUTES) },
      { path: 'reports', loadChildren: () => import('./features/reports/reports.routes').then((m) => m.REPORTS_ROUTES) },
      { path: 'settings', loadChildren: () => import('./features/settings/settings.routes').then((m) => m.SETTINGS_ROUTES) },
    ],
  },

  { path: '**', redirectTo: 'dashboard' },
];
