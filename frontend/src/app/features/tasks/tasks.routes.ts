import { Routes } from '@angular/router';

export const TASKS_ROUTES: Routes = [
  { path: '', title: 'My Tasks · Infraon Flow', loadComponent: () => import('./tasks-page').then((m) => m.TasksPage) },
];
