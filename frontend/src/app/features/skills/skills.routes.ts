import { Routes } from '@angular/router';

export const skillsRoutes: Routes = [
  {
    path: '',
    redirectTo: 'formations',
    pathMatch: 'full',
  },
  {
    path: 'formations',
    loadComponent: () =>
      import('./formation-list.component').then(m => m.FormationListComponent),
    title: 'Formations',
  },
  {
    path: 'formations/creer',
    loadComponent: () =>
      import('./formation-form.component').then(m => m.FormationFormComponent),
    title: 'Nouvelle formation',
  },
  {
    path: 'mentorats',
    loadComponent: () =>
      import('./mentorat-dashboard.component').then(m => m.MentoratDashboardComponent),
    title: 'Mentorats',
  },
  {
    path: 'mentorats/accepter',
    loadComponent: () =>
      import('./mentorat-accepter.component').then(m => m.MentoratAccepterComponent),
    title: 'Accepter un mentorat',
  },
  {
    path: 'mentorats/demander',
    loadComponent: () =>
      import('./mentorat-demand.component').then(m => m.MentoratDemandComponent),
    title: 'Demander un mentor',
  },
];
