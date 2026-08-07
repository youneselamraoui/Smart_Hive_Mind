import { Component, OnInit, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { DecimalPipe, DatePipe } from '@angular/common';

@Component({
  selector: 'app-business-plan-list',
  standalone: true,
  imports: [RouterLink, DatePipe, DecimalPipe],
  template: `
    <div class="page">
      <div class="page-head"><div><h1>Business Plans</h1><p>Dossiers investisseurs</p></div><a class="new-btn" routerLink="/app/entrepreneuriat/business-plans/new">Nouveau business plan</a></div>

      @if (loading()) {
        <div class="skel-grid">@for (i of [1,2,3]; track i) { <div class="skel-card"><div class="skel-line w-60"></div><div class="skel-line w-40"></div><div class="skel-line w-80"></div></div> }</div>
      } @else { @if (list().length === 0) {
        <div class="empty"><h3>Aucun business plan</h3><p>Créez votre premier dossier investisseur.</p></div>
      } @else {
        <div class="grid">
          @for (bp of list(); track bp._id) {
            <a class="card" [routerLink]="['/app/entrepreneuriat', 'business-plans', bp._id]">
              <div class="card-head">
                <h3>{{ bp.titre }}</h3>
                <span class="card-date">{{ bp.createdAt | date:'dd MMM yyyy' }}</span>
              </div>
              <div class="budget">{{ (bp.budget ?? 0) | number:'1.0-0' }} <span>FCFA</span></div>
              <p class="model">{{ truncate(bp.modeleEconomique, 120) }}</p>
              <div class="card-foot">
                @if (bp.assistanceDetails?.length) {
                  <span class="ia-badge">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    Assistance IA
                  </span>
                }
                <span class="statut-tag" [class]="'statut--' + bp.statut">{{ bp.statut }}</span>
              </div>
            </a>
          }
        </div>
      }}
    </div>
  `,
  styles: [`
    :host { display: block; }
    .page-head { margin-bottom: 24px; display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; }
    .page-head h1 { font-size: var(--text-2xl); margin: 0 0 2px; }
    .page-head p { margin: 0; font-size: var(--text-sm); color: var(--ink-700); }
    .new-btn { padding: 8px 16px; border-radius: var(--radius-sm); background: var(--honey-500); color: var(--ink-900); font-size: var(--text-sm); font-weight: 600; text-decoration: none; white-space: nowrap; transition: filter var(--transition); }
    .new-btn:hover { filter: brightness(1.08); }

    .skel-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 16px; }
    .skel-card { background: var(--color-surface); border: 1px solid var(--line-200); border-radius: var(--radius-md); padding: 20px; }
    .skel-line { height: 12px; border-radius: 4px; background: var(--line-200); margin-bottom: 10px; animation: sh 1.5s infinite; }
    .w-60 { width: 60%; } .w-40 { width: 40%; } .w-80 { width: 80%; }
    @keyframes sh { 0%{opacity:0.5} 50%{opacity:1} 100%{opacity:0.5} }

    .empty { display: flex; flex-direction: column; align-items: center; padding: 60px 24px; }
    .empty h3 { font-size: var(--text-lg); margin: 0 0 4px; }
    .empty p { font-size: var(--text-sm); color: var(--ink-700); margin: 0; }

    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(360px, 1fr)); gap: 16px; }
    .card { display: flex; flex-direction: column; background: var(--color-surface); border: 1px solid var(--line-200); border-radius: var(--radius-md); padding: 24px; text-decoration: none; color: inherit; transition: border-color var(--transition); }
    .card:hover { border-color: var(--honey-500); }
    .card-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; margin-bottom: 8px; }
    .card-head h3 { font-size: var(--text-base); margin: 0; }
    .card-date { font-size: var(--text-xs); color: var(--ink-700); white-space: nowrap; }
    .budget { font-family: var(--font-display); font-size: var(--text-2xl); font-weight: 600; color: var(--ink-900); margin-bottom: 6px; }
    .budget span { font-family: var(--font-body); font-size: var(--text-sm); font-weight: 400; color: var(--ink-700); margin-left: 4px; }
    .model { font-size: var(--text-sm); color: var(--ink-700); line-height: 1.5; margin: 0 0 16px; flex: 1; }
    .card-foot { display: flex; align-items: center; justify-content: space-between; gap: 10px; }

    .ia-badge { display: inline-flex; align-items: center; gap: 4px; font-size: var(--text-xs); font-weight: 500; color: var(--ink-700); background: var(--line-200); padding: 2px 10px; border-radius: 999px; }
    .statut-tag { font-size: var(--text-xs); font-weight: 600; text-transform: uppercase; padding: 2px 10px; border-radius: 999px; }
    .statut--brouillon { background: rgba(91,79,224,0.1); color: var(--agentic-500); }
    .statut--soumis { background: rgba(217,160,43,0.1); color: var(--honey-600); }
    .statut--valide { background: rgba(31,158,109,0.1); color: var(--verify-500); }
    .statut--refuse { background: rgba(196,67,46,0.1); color: var(--alert-500); }

    @media (max-width: 768px) { .grid { grid-template-columns: 1fr; } }
  `]
})
export class BusinessPlanListComponent implements OnInit {
  private http = inject(HttpClient);
  list = signal<any[]>([]);
  loading = signal(true);

  ngOnInit() {
    this.http.get<any[]>('/api/entrepreneuriat/business-plans').subscribe({
      next: l => this.list.set(l),
      error: () => this.loading.set(false),
      complete: () => this.loading.set(false),
    });
  }

  truncate(t: string, max: number): string {
    if (!t) return '';
    return t.length <= max ? t : t.slice(0, max) + '…';
  }
}
