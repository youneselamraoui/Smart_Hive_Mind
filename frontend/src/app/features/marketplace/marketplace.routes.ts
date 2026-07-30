import { Routes } from '@angular/router';
import { roleGuard } from '../../guards/role.guard';

export const marketplaceRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./marketplace.component').then(m => m.MarketplaceComponent),
    title: 'Marketplace',
  },
  {
    path: 'offres/new',
    loadComponent: () =>
      import('./offre-form.component').then(m => m.OffreFormComponent),
    title: 'Nouvelle offre',
    canActivate: [roleGuard],
    data: { roles: ['encadrant', 'admin'] },
  },
  {
    path: 'bourses/new',
    loadComponent: () =>
      import('./bourse-form.component').then(m => m.BourseFormComponent),
    title: 'Nouvelle bourse',
    canActivate: [roleGuard],
    data: { roles: ['encadrant', 'admin'] },
  },
  {
    path: 'bounties/new',
    loadComponent: () =>
      import('./bounty-form.component').then(m => m.BountyFormComponent),
    title: 'Nouveau bounty',
  },
  {
    path: 'bounties',
    loadComponent: () => import('./bounty-list.component').then(m => m.BountyListComponent),
    title: 'Bounties',
  },
  {
    path: 'bounties/:id',
    loadComponent: () =>
      import('./bounty-detail.component').then(m => m.BountyDetailComponent),
    title: 'Bounty',
  },
  {
    path: 'prestations/new',
    loadComponent: () =>
      import('./prestation-form.component').then(m => m.PrestationFormComponent),
    title: 'Nouvelle prestation',
  },
  {
    path: 'prestations/:id/edit',
    loadComponent: () =>
      import('./prestation-form.component').then(m => m.PrestationFormComponent),
    title: 'Modifier la prestation',
  },
  {
    path: 'missions',
    loadComponent: () => import('./mission-list.component').then(m => m.MissionListComponent),
    title: 'Missions',
  },
  {
    path: 'missions/new',
    loadComponent: () =>
      import('./mission-form.component').then(m => m.MissionFormComponent),
    title: 'Nouvelle mission',
  },
  {
    path: 'validations',
    loadComponent: () => import('./validation-list.component').then(m => m.ValidationListComponent),
    title: 'Validations',
  },
  {
    path: 'taches-crowdsourcing/new',
    loadComponent: () => import('./tache-crowdsourcing-form.component').then(m => m.TacheCrowdsourcingFormComponent),
    title: 'Nouvelle tâche',
  },
  {
    path: 'validations/new',
    loadComponent: () =>
      import('./validation-form.component').then(m => m.ValidationFormComponent),
    title: 'Nouvelle validation',
  },
];
