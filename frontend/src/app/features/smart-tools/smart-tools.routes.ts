import { Routes } from '@angular/router';

export const smartToolsRoutes: Routes = [
  { path: '', redirectTo: 'models', pathMatch: 'full' },
  {
    path: 'ateliers/new',
    loadComponent: () =>
      import('./atelier-start/atelier-start').then(m => m.AtelierStartComponent),
    title: 'Lancer un atelier',
  },
  {
    path: 'datasets/upload',
    loadComponent: () =>
      import('./dataset-upload/dataset-upload').then(m => m.DatasetUploadComponent),
    title: 'Uploader un jeu de donnees',
  },
  {
    path: 'models',
    loadComponent: () =>
      import('./model-bank-list/model-bank-list').then(m => m.ModelBankListComponent),
    title: 'Model Bank',
  },
  {
    path: 'models/publish',
    loadComponent: () =>
      import('./model-publish.component').then(m => m.ModelPublishComponent),
    title: 'Publier un modèle',
  },
  {
    path: 'outils',
    loadComponent: () =>
      import('./outil-list/outil-list').then(m => m.OutilListComponent),
    title: 'Outils',
  },
  {
    path: 'ateliers/:id',
    loadComponent: () =>
      import('./atelier-runner/atelier-runner').then(m => m.AtelierRunnerComponent),
    title: 'Atelier en cours',
  },
  {
    path: 'atelier-neuro-symbolique',
    loadComponent: () =>
      import('./atelier-neuro-symbolique.component').then(m => m.AtelierNeuroSymboliqueComponent),
    title: 'Atelier neuro-symbolique',
  },
  {
    path: 'atelier-neuro-symbolique/:id',
    loadComponent: () =>
      import('./atelier-neuro-symbolique.component').then(m => m.AtelierNeuroSymboliqueComponent),
    title: 'Atelier neuro-symbolique',
  },
];
