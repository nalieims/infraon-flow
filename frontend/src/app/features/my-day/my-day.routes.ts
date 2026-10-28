import { Routes } from '@angular/router';

export const MY_DAY_ROUTES: Routes = [
  { path: '', title: 'My Day · Infraon Flow', loadComponent: () => import('./my-day-page').then((m) => m.MyDayPage) },
];
