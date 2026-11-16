import { Routes } from '@angular/router';

export const AUTH_ROUTES: Routes = [
  { path: 'login', title: 'Sign in · Infraon Flow', loadComponent: () => import('./login-page').then((m) => m.LoginPage) },
];
