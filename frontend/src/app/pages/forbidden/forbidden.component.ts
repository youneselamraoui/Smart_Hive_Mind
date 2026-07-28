import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-forbidden',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="page">
      <div class="content">
        <div class="seal">
          <svg viewBox="0 0 100 100" width="120" height="120" xmlns="http://www.w3.org/2000/svg">
            <polygon points="50 5 91 28 91 72 50 95 9 72 9 28" fill="none" stroke="var(--alert-500)" stroke-width="2.5" opacity="0.5"/>
            <polygon points="50 15 82 33 82 67 50 85 18 67 18 33" fill="none" stroke="var(--alert-500)" stroke-width="1.5" opacity="0.3"/>
            <line x1="18" y1="18" x2="82" y2="82" stroke="var(--alert-500)" stroke-width="3" stroke-linecap="round"/>
            <line x1="82" y1="18" x2="18" y2="82" stroke="var(--alert-500)" stroke-width="3" stroke-linecap="round"/>
          </svg>
        </div>
        <h1 class="title">Accès refusé</h1>
        <p class="desc">Cette zone nécessite une autorisation que votre profil n'a pas encore.</p>
        <a class="btn" routerLink="/dashboard">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
          Retour au tableau de bord
        </a>
      </div>
    </div>
  `,
  styles: [`
    :host { display: flex; align-items: center; justify-content: center; min-height: 60vh; }
    .page { text-align: center; padding: 40px 20px; }
    .content { max-width: 420px; margin: 0 auto; display: flex; flex-direction: column; align-items: center; gap: 16px; }
    .seal { margin-bottom: 8px; }
    .seal :deep(svg) { display: block; }
    .title { font-family: var(--font-display); font-size: var(--text-2xl); font-weight: 600; margin: 0; }
    .desc { font-size: var(--text-sm); color: var(--ink-700); margin: 0; }
    .btn { display: inline-flex; align-items: center; gap: 8px; padding: 10px 24px; background: var(--honey-500); color: var(--ink-900); border: none; border-radius: var(--radius-sm); font-family: var(--font-body); font-size: var(--text-sm); font-weight: 600; text-decoration: none; cursor: pointer; transition: background var(--transition); }
    .btn:hover { background: var(--honey-600); }
  `]
})
export class ForbiddenComponent {}
