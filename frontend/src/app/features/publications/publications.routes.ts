import { Routes } from '@angular/router';

export const publicationsRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./publication-list.component').then(m => m.PublicationListComponent),
    title: 'Publications',
  },
  {
    path: 'verify',
    loadComponent: () => import('./verify-publication.component').then(m => m.VerifyPublicationComponent),
    title: 'Vérifier une publication',
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./publication-form.component').then(m => m.PublicationFormComponent),
    title: 'Nouvelle publication',
  },
  {
    path: ':id/edit',
    loadComponent: () =>
      import('./publication-form.component').then(m => m.PublicationFormComponent),
    title: 'Modifier la publication',
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./publication-detail.component').then(m => m.PublicationDetailComponent),
    title: 'Détail publication',
  },
];
