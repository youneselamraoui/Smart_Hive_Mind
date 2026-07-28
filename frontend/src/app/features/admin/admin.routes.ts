import { Routes } from '@angular/router';

export default [
  { path: '', loadComponent: () => import('./dashboard.component').then(m => m.DashboardComponent), title: 'Administration' },
  { path: 'badges/attribuer', loadComponent: () => import('./badge-attribuer.component').then(m => m.BadgeAttribuerComponent), title: 'Attribuer un badge' },
  {
    path: 'badges',
    loadComponent: () => import('./badge-list.component').then(m => m.BadgeListComponent),
    title: 'Badges attribués',
  },
] as Routes;
