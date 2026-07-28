import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

function arcGauge(pct: number): string {
  const r = 38, circumference = 2 * Math.PI * r;
  const offset = circumference - (pct / 100) * circumference;
  const label = pct >= 80 ? 'Bonne correspondance' : pct >= 50 ? 'Correspondance partielle' : 'Correspondance faible';
  return `<svg viewBox="0 0 96 56" width="96" height="56" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 48 A 38 38 0 0 1 88 48" fill="none" stroke="var(--line-200)" stroke-width="6" stroke-linecap="round"/>
    <path d="M8 48 A 38 38 0 0 1 88 48" fill="none" stroke="var(--honey-500)" stroke-width="6" stroke-linecap="round"
      stroke-dasharray="${circumference}" stroke-dashoffset="${offset}" style="transition: stroke-dashoffset 0.8s ease-out"/>
    <text x="48" y="44" text-anchor="middle" font-family="var(--font-mono)" font-size="12" font-weight="700" fill="var(--ink-900)">${Math.round(pct)}%</text>
  </svg>
  <span class="match-label">${label}</span>`;
}

@Component({
  selector: 'app-mission-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="section">
      <div class="section-head">
        <div>
          <h1>Missions</h1>
          <p>Missions proposées par la communauté</p>
        </div>
        <a routerLink="/marketplace/missions/new" class="btn btn-primary">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Nouvelle mission
        </a>
      </div>

      @if (loading()) {
        <div class="skel-grid">@for (i of [1,2,3,4]; track i) { <div class="skel-card"><div class="skel-line w-70"></div><div class="skel-line w-50"></div></div> }</div>
      } @else { @if (items.length === 0) {
        <div class="empty">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--honey-500)" stroke-width="1" opacity="0.3"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          <h3>Aucune mission</h3>
          <p>Les missions apparaîtront ici une fois publiées.</p>
        </div>
      } @else {
        <div class="grid">
          @for (m of paginatedItems(); track m._id) {
            <a class="card" [routerLink]="'/marketplace/missions/' + m._id">
              <h3>{{ m.titre }}</h3>
              <p>{{ (m.description || '').length > 100 ? (m.description | slice:0:100) + '…' : m.description }}</p>
              <div class="card-footer">
                <div class="card-meta">
                  <span class="budget">{{ m.budget | number }} FCFA</span>
                  <span class="deadline">Limite: {{ m.dateLimite | date:'dd/MM/yyyy' }}</span>
                </div>
                @if (m.matchingScore !== undefined) {
                  <div class="match-gauge" [innerHTML]="arcGauge(m.matchingScore * 100)"></div>
                }
              </div>
            </a>
          }
        </div>
      }}
    </div>
  `,
  styles: [`
    :host { display: block; }
    .section { position: relative; }
    .section-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; flex-wrap: wrap; gap: 12px; }
    .section-head h1 { font-size: var(--text-xl); margin: 0 0 2px; }
    .section-head p { margin: 0; font-size: var(--text-sm); color: var(--ink-700); }

    .btn { display: inline-flex; align-items: center; gap: 8px; padding: 10px 20px; border: none; border-radius: var(--radius-md); font-family: var(--font-body); font-size: var(--text-sm); font-weight: 600; cursor: pointer; text-decoration: none; transition: all var(--transition); }
    .btn-primary { background: var(--honey-500); color: var(--ink-900); }
    .btn-primary:hover { background: var(--honey-600); }

    .skel-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; }
    .skel-card { background: var(--color-surface); border: 1px solid var(--line-200); border-radius: var(--radius-md); padding: 20px; }
    .skel-line { height: 12px; border-radius: 4px; background: var(--line-200); margin-bottom: 10px; animation: sh 1.5s infinite; }
    .w-70 { width: 70%; } .w-50 { width: 50%; }
    @keyframes sh { 0%{opacity:0.5} 50%{opacity:1} 100%{opacity:0.5} }

    .empty { display: flex; flex-direction: column; align-items: center; text-align: center; padding: 60px 24px; }
    .empty h3 { font-size: var(--text-lg); margin: 12px 0 4px; }
    .empty p { font-size: var(--text-sm); color: var(--ink-700); margin: 0; }

    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 16px; }
    .card { display: flex; flex-direction: column; background: var(--color-surface); border: 1px solid var(--line-200); border-radius: var(--radius-md); padding: 20px; text-decoration: none; color: inherit; transition: border-color var(--transition); gap: 10px; }
    .card:hover { border-color: var(--honey-500); }
    .card h3 { font-size: var(--text-base); margin: 0; }
    .card p { font-size: var(--text-sm); color: var(--ink-700); margin: 0; line-height: 1.5; }
    .card-footer { display: flex; align-items: flex-end; justify-content: space-between; gap: 10px; margin-top: auto; padding-top: 10px; border-top: 1px solid var(--line-200); }
    .card-meta { display: flex; flex-direction: column; gap: 2px; }
    .budget { font-weight: 600; font-size: var(--text-sm); }
    .deadline { font-size: var(--text-xs); color: var(--ink-700); }

    .match-gauge { display: flex; flex-direction: column; align-items: center; gap: 2px; flex-shrink: 0; }
    .match-gauge :deep(.match-label) { font-size: 0.55rem; text-align: center; color: var(--ink-700); line-height: 1.2; max-width: 80px; }

    @media (max-width: 768px) { .grid { grid-template-columns: 1fr; } }
  `]
})
export class MissionListComponent implements OnInit {
  private http = inject(HttpClient);
  items: any[] = [];
  loading = signal(true);
  pageSize = 10;
  currentPage = signal(1);
  arcGauge = arcGauge;

  paginatedItems = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize;
    return this.items.slice(start, start + this.pageSize);
  });

  ngOnInit() {
    this.http.get<any[]>('/api/placements/missions').subscribe({
      next: list => this.items = list,
      error: () => this.items = [],
      complete: () => this.loading.set(false),
    });
  }
}
