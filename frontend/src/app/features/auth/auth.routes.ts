import { Routes } from '@angular/router';

export const AUTH_ROUTES: Routes = [
  { path: 'login', title: 'Sign in · Infraon Flow', loadComponent: () => import('./login-page').then((m) => m.LoginPage) },
  {
    path: 'register',
    title: 'Create account · Infraon Flow',
    loadComponent: () => import('./register-page').then((m) => m.RegisterPage),
  },
];
