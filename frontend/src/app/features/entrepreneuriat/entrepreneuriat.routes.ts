import { Routes } from '@angular/router';

export const entrepreneuriatRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./business-plan-list.component').then(m => m.BusinessPlanListComponent),
    title: 'Business plans',
  },
  {
    path: 'business-plans',
    loadComponent: () => import('./business-plan-list.component').then(m => m.BusinessPlanListComponent),
    title: 'Business plans',
  },
  {
    path: 'business-plans/new',
    loadComponent: () => import('./business-plan-form.component').then(m => m.BusinessPlanFormComponent),
    title: 'Nouveau business plan',
  },
  {
    path: 'business-plans/:id',
    loadComponent: () => import('./business-plan-form.component').then(m => m.BusinessPlanFormComponent),
    title: 'Business plan',
  },
  {
    path: 'idees',
    loadComponent: () =>
      import('./boite-idees.component').then(m => m.BoiteIdeesComponent),
    title: 'Boite a idees',
  },
  {
    path: 'projets/:id',
    loadComponent: () =>
      import('./projet-detail.component').then(m => m.ProjetDetailComponent),
    title: 'Projet',
  },
  {
    path: 'campagnes',
    loadComponent: () =>
      import('./campagne-crowdfunding.component').then(m => m.CampagneCrowdfundingComponent),
    title: 'Campagnes de crowdfunding',
  },
  {
    path: ':id',
    redirectTo: 'business-plans/:id',
    pathMatch: 'full',
  },
  {
    path: 'mentorats/demander',
    loadComponent: () =>
      import('./mentorat-demander.component').then(m => m.MentoratDemanderComponent),
    title: 'Demander un mentor',
  },
];
