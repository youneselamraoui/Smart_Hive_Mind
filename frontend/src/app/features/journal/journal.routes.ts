import { Routes } from '@angular/router';
import { roleGuard } from '../../guards/role.guard';

export const journalRoutes: Routes = [
  // Politique d'accès des routes de consultation ('' et ':id') :
  // pas de authGuard ajouté ici — la route parente /app porte déjà authGuard
  // (app.routes.ts), donc ces enfants sont inaccessibles sans authentification.
  // Conformément au concept d'"espace public" des journaux (domaine Publications
  // et confiance, Entités et Processus), tout membre authentifié peut consulter
  // la liste et le détail des journaux ; seules les écritures (new, edit) sont
  // restreintes via roleGuard. Cohérent avec publications.routes.ts, feature sœur.
  {
    path: '',
    loadComponent: () =>
      import('./journal-list.component').then(m => m.JournalListComponent),
    title: 'Journaux',
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./journal-form.component').then(m => m.JournalFormComponent),
    title: 'Nouveau journal',
    canActivate: [roleGuard],
    data: { roles: ['admin', 'organisation'] },
  },
  {
    path: ':id/edit',
    loadComponent: () =>
      import('./journal-form.component').then(m => m.JournalFormComponent),
    title: 'Modifier le journal',
    canActivate: [roleGuard],
    data: { roles: ['admin', 'organisation'] },
  },
  // ':id' (détail) : même politique que la liste — lecture ouverte à tout
  // membre authentifié, protégée par l'authGuard parent de /app (voir commentaire en tête).
  {
    path: ':id',
    loadComponent: () =>
      import('./journal-detail.component').then(m => m.JournalDetailComponent),
    title: 'Détail journal',
  },
];
