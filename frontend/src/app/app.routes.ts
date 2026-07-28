import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { MainLayoutComponent } from './layout/main-layout.component';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent),
    title: 'Smart Hive Mind',
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent),
    title: 'Connexion',
  },
  {
    path: 'register',
    loadComponent: () => import('./pages/register/register.component').then(m => m.RegisterComponent),
    title: 'Inscription',
  },
  {
    path: 'forgot-password',
    loadComponent: () => import('./pages/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent),
    title: 'Mot de passe oublié',
  },
  {
    path: 'app',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent),
        title: 'Dashboard',
      },
      {
        path: 'publications',
        loadChildren: () =>
          import('./features/publications/publications.routes').then(m => m.publicationsRoutes),
      },
      {
        path: 'communaute',
        loadChildren: () =>
          import('./features/communaute/communaute.routes').then(m => m.communauteRoutes),
      },
      {
        path: 'smart-tools',
        loadChildren: () =>
          import('./features/smart-tools/smart-tools.routes').then(m => m.smartToolsRoutes),
      },
      {
        path: 'marketplace',
        loadChildren: () =>
          import('./features/marketplace/marketplace.routes').then(m => m.marketplaceRoutes),
      },
      {
        path: 'entrepreneuriat',
        loadChildren: () =>
          import('./features/entrepreneuriat/entrepreneuriat.routes').then(m => m.entrepreneuriatRoutes),
      },
      {
        path: 'placements',
        loadChildren: () =>
          import('./features/placements/placements.routes').then(m => m.placementsRoutes),
      },
      {
        path: 'evenements',
        loadChildren: () =>
          import('./features/evenements/evenements.routes').then(m => m.evenementsRoutes),
      },
      {
        path: 'profile',
        loadComponent: () => import('./pages/profile/profile.component').then(m => m.ProfileComponent),
        title: 'Mon profil',
      },
      {
        path: 'skills',
        loadChildren: () =>
          import('./features/skills/skills.routes').then(m => m.skillsRoutes),
      },
      {
        path: 'dataset',
        loadChildren: () =>
          import('./features/dataset/dataset.routes'),
      },
      {
        path: 'membre/:id',
        loadComponent: () => import('./pages/member-profile/member-profile.component').then(m => m.MemberProfileComponent),
        title: 'Profil membre',
      },
      {
        path: 'crowdfunding',
        loadChildren: () =>
          import('./features/crowdfunding/crowdfunding.routes'),
      },
      {
        path: 'admin',
        loadChildren: () =>
          import('./features/admin/admin.routes'),
      },
      {
        path: 'ai',
        loadChildren: () =>
          import('./features/ai/ai.routes'),
      },
      {
        path: 'notifications',
        loadChildren: () =>
          import('./features/notifications/notifications.routes'),
      },
      {
        path: 'recherche',
        loadComponent: () => import('./pages/search/search.component').then(m => m.SearchComponent),
        title: 'Recherche',
      },
      { path: '**', loadComponent: () => import('./pages/not-found/not-found.component').then(m => m.NotFoundComponent), title: 'Page introuvable' },
      { path: '', redirectTo: '/app/dashboard', pathMatch: 'full' },
    ],
  },
  // CompatibilitÃ© avec les anciens liens absolus qui ne comportent pas /app.
  { path: ':legacy', redirectTo: 'app/:legacy', pathMatch: 'prefix' },
];
