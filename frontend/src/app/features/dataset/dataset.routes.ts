import { Routes } from '@angular/router';

export default [
  {
    path: '',
    loadComponent: () => import('./dataset-download.component').then(m => m.DatasetDownloadComponent),
    title: 'Datasets',
  },
] as Routes;