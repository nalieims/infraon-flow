import { Routes } from '@angular/router';

export const OKRS_ROUTES: Routes = [
  { path: '', title: 'OKRs · Infraon Flow', loadComponent: () => import('./okr-list-page').then((m) => m.OkrListPage) },
  {
    path: ':id',
    title: 'Objective · Infraon Flow',
    loadComponent: () => import('./okr-detail-page').then((m) => m.OkrDetailPage),
  },
];
