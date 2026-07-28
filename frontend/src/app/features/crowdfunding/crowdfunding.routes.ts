import { Routes } from '@angular/router';

export default [
  { path: '', loadComponent: () => import('./campagne-list.component').then(m => m.CampagneListComponent), title: 'Crowdfunding' },
  { path: 'new', loadComponent: () => import('./campagne-form.component').then(m => m.CampagneFormComponent), title: 'Nouvelle campagne' },
  { path: ':id', loadComponent: () => import('./campagne-detail.component').then(m => m.CampagneDetailComponent), title: 'Campagne' },
] as Routes;
