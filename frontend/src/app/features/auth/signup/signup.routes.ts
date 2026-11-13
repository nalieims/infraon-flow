import { Routes } from '@angular/router';

export const SIGNUP_ROUTES: Routes = [
  {
    path: '',
    title: 'Create account · Infraon Flow',
    loadComponent: () =>
      import('./components/signup-page/signup-page.component').then((m) => m.SignupPageComponent),
  },
];
