import { Routes } from '@angular/router';

export const INITIATIVES_ROUTES: Routes = [
  { path: '', title: 'Initiatives · Infraon Flow', loadComponent: () => import('./initiatives-page').then((m) => m.InitiativesPage) },
];
