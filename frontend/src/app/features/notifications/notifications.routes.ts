import { Routes } from '@angular/router';

export default [
  {
    path: '',
    loadComponent: () => import('./notification-list.component').then(m => m.NotificationListComponent),
    title: 'Notifications',
  },
] as Routes;
