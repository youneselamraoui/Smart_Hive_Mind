import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="page">
      <div class="content">
        <div class="illus">
          <svg viewBox="0 0 120 80" width="200" height="133" xmlns="http://www.w3.org/2000/svg">
            <circle cx="20" cy="20" r="6" fill="none" stroke="var(--line-200)" stroke-width="2"/>
            <circle cx="60" cy="10" r="6" fill="none" stroke="var(--line-200)" stroke-width="2"/>
            <circle cx="100" cy="30" r="6" fill="none" stroke="var(--line-200)" stroke-width="2"/>
            <circle cx="40" cy="60" r="6" fill="none" stroke="var(--line-200)" stroke-width="2"/>
            <circle cx="80" cy="65" r="6" fill="none" stroke="var(--line-200)" stroke-width="2"/>
            <line x1="26" y1="22" x2="54" y2="14" stroke="var(--line-200)" stroke-width="2" stroke-dasharray="4 3"/>
            <line x1="66" y1="16" x2="94" y2="28" stroke="var(--line-200)" stroke-width="2" stroke-dasharray="4 3"/>
            <line x1="40" y1="54" x2="60" y2="16" stroke="var(--honey-500)" stroke-width="1.5" opacity="0.4"/>
            <line x1="100" y1="36" x2="80" y2="59" stroke="var(--line-200)" stroke-width="2" stroke-dasharray="4 3"/>
            <line x1="46" y1="62" x2="74" y2="63" stroke="var(--line-200)" stroke-width="2" stroke-dasharray="4 3"/>
            <line x1="14" y1="14" x2="20" y2="8" stroke="var(--alert-500)" stroke-width="2" opacity="0.5"/>
            <line x1="24" y1="8" x2="14" y2="14" stroke="var(--alert-500)" stroke-width="2" opacity="0.5"/>
          </svg>
        </div>
        <h1 class="title">Cette page n'existe pas dans la ruche</h1>
        <p class="desc">Le lien que vous avez suivi mène à une page qui n'existe plus ou n'a jamais existé.</p>
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
    .illus { margin-bottom: 8px; }
    .illus :deep(svg) { display: block; }
    .title { font-family: var(--font-display); font-size: var(--text-2xl); font-weight: 600; margin: 0; line-height: 1.2; }
    .desc { font-size: var(--text-sm); color: var(--ink-700); margin: 0; }
    .btn { display: inline-flex; align-items: center; gap: 8px; padding: 10px 24px; background: var(--honey-500); color: var(--ink-900); border: none; border-radius: var(--radius-sm); font-family: var(--font-body); font-size: var(--text-sm); font-weight: 600; text-decoration: none; cursor: pointer; transition: background var(--transition); }
    .btn:hover { background: var(--honey-600); }
  `]
})
export class NotFoundComponent {}
