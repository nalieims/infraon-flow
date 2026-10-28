import { Routes } from '@angular/router';

export const TEAMS_ROUTES: Routes = [
  { path: '', title: 'Teams · Infraon Flow', loadComponent: () => import('./teams-page').then((m) => m.TeamsPage) },
];
