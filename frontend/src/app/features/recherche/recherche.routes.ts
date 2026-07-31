import { Routes } from '@angular/router';
import { roleGuard } from '../../guards/role.guard';

// Politique d'accès des routes de consultation ('' et ':id') des deux entités :
// pas de authGuard ajouté ici — la route parente /app porte déjà authGuard
// (app.routes.ts, vérifié : `canActivate: [authGuard]` sur le chemin 'app'),
// donc ces enfants sont inaccessibles sans authentification. Comme pour les
// journaux, la lecture est ouverte à tout membre authentifié ; seules les
// écritures (new, edit) sont restreintes via roleGuard, cohérent avec la
// vérification serveur (create/update refusent 403 hors admin/organisation).
// Même politique que journal.routes.ts et publications.routes.ts.

export const structureRechercheRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./structure-list.component').then(m => m.StructureListComponent),
    title: 'Structures de recherche',
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./structure-form.component').then(m => m.StructureFormComponent),
    title: 'Nouvelle structure',
    canActivate: [roleGuard],
    data: { roles: ['admin', 'organisation'] },
  },
  {
    path: ':id/edit',
    loadComponent: () =>
      import('./structure-form.component').then(m => m.StructureFormComponent),
    title: 'Modifier la structure',
    canActivate: [roleGuard],
    data: { roles: ['admin', 'organisation'] },
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./structure-detail.component').then(m => m.StructureDetailComponent),
    title: 'Détail structure',
  },
];

export const projetRechercheFinanceRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./projet-list.component').then(m => m.ProjetListComponent),
    title: 'Projets financés',
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./projet-form.component').then(m => m.ProjetFormComponent),
    title: 'Nouveau projet financé',
    canActivate: [roleGuard],
    data: { roles: ['admin', 'organisation'] },
  },
  {
    path: ':id/edit',
    loadComponent: () =>
      import('./projet-form.component').then(m => m.ProjetFormComponent),
    title: 'Modifier le projet',
    canActivate: [roleGuard],
    data: { roles: ['admin', 'organisation'] },
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./projet-detail.component').then(m => m.ProjetDetailComponent),
    title: 'Détail projet financé',
  },
];
