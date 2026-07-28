import { Routes } from '@angular/router';
import { roleGuard } from '../../guards/role.guard';

export const evenementsRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./evenement-list.component').then(m => m.EvenementListComponent),
    title: 'Evenements',
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./evenement-form.component').then(m => m.EvenementFormComponent),
    title: 'Nouvel evenement',
    canActivate: [roleGuard],
    data: { roles: ['encadrant', 'admin'] },
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./evenement-detail.component').then(m => m.EvenementDetailComponent),
    title: 'Evenement',
  },
];
