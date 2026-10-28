import { Routes } from '@angular/router';

export const REPORTS_ROUTES: Routes = [
  { path: '', title: 'Reports · Infraon Flow', loadComponent: () => import('./reports-page').then((m) => m.ReportsPage) },
];
