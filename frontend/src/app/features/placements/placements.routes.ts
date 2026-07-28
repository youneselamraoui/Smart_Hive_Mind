import { Routes } from '@angular/router';

export const placementsRoutes: Routes = [
  {
    path: '',
    redirectTo: 'offres',
    pathMatch: 'full',
  },
  {
    path: 'offres',
    loadComponent: () =>
      import('./offre-list.component').then(m => m.OffreListComponent),
    title: 'Offres',
  },
  {
    path: 'profil/:id',
    loadComponent: () =>
      import('./profil-certifie.component').then(m => m.ProfilCertifieComponent),
    title: 'Profil certifie',
  },
  {
    path: 'accepter-candidature',
    loadComponent: () =>
      import('./accepter-candidature.component').then(m => m.AccepterCandidatureComponent),
    title: 'Accepter une candidature',
  },
  {
    path: 'cloturer-mission',
    loadComponent: () =>
      import('./cloturer-mission.component').then(m => m.CloturerMissionComponent),
    title: 'Clôturer une mission',
  },
  {
    path: 'candidatures',
    loadComponent: () => import('./candidature-list.component').then(m => m.CandidatureListComponent),
    title: 'Mes candidatures',
  },
];
