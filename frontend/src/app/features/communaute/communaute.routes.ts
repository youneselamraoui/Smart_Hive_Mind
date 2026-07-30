import { Routes } from '@angular/router';

export const communauteRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./forum-list/forum-list').then(m => m.ForumListComponent),
    title: 'Forums - Communauté',
  },
  {
    path: 'sujets/new',
    loadComponent: () => import('./sujet-form.component').then(m => m.SujetFormComponent),
    title: 'Nouveau sujet',
  },
  {
    path: 'sujets/:id',
    loadComponent: () =>
      import('./sujet-detail/sujet-detail').then(m => m.SujetDetailComponent),
    title: 'Sujet',
  },
  {
    path: 'sondages/new',
    loadComponent: () => import('./sondage-form.component').then(m => m.SondageFormComponent),
    title: 'Nouveau sondage',
  },
  {
    path: 'sondages',
    loadComponent: () =>
      import('./sondage-widget/sondage-widget').then(m => m.SondageWidgetComponent),
    title: 'Sondages',
  },
  {
    path: 'sondages/:id',
    loadComponent: () => import('./sondage-detail.component').then(m => m.SondageDetailComponent),
    title: 'Détail du sondage',
  },
  {
    path: 'temoignages/new',
    loadComponent: () => import('./temoignage-form.component').then(m => m.TemoignageFormComponent),
    title: 'Nouveau témoignage',
  },
  {
    path: 'temoignages',
    loadComponent: () =>
      import('./temoignages-list/temoignages-list').then(m => m.TemoignagesListComponent),
    title: 'Témoignages',
  },
  {
    path: 'sujets',
    loadComponent: () => import('./sujet-list.component').then(m => m.SujetListComponent),
    title: 'Sujets de discussion',
  },
  {
    path: 'groupements',
    loadComponent: () =>
      import('./groupement-list/groupement-list').then(m => m.GroupementListComponent),
    title: 'Groupements',
  },
];
