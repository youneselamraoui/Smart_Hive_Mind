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
  selector: 'app-validation-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="section">
      <div class="section-head">
        <div>
          <h1>Validations</h1>
          <p>Évaluations des missions par la communauté</p>
        </div>
        <a routerLink="/marketplace/validations/new" class="btn btn-primary">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Nouvelle validation
        </a>
      </div>

      @if (loading()) {
        <div class="skel-grid">@for (i of [1,2,3]; track i) { <div class="skel-card"><div class="skel-line w-70"></div><div class="skel-line w-90"></div></div> }</div>
      } @else { @if (items.length === 0) {
        <div class="empty">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--honey-500)" stroke-width="1" opacity="0.3"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
          <h3>Aucune validation</h3>
          <p>Les validations apparaîtront ici une fois soumises.</p>
        </div>
      } @else {
        <div class="grid">
          @for (v of paginatedItems(); track v._id) {
            <div class="card">
              <div class="card-top">
                <span class="card-title">{{ v.missionId?.titre || v.competence || 'Validation' }}</span>
              </div>
              <div class="card-body">
                <div class="card-meta">
                  <span class="meta-item">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    {{ v.membreId?.prenom || '' }} {{ v.membreId?.nom || 'Membre' }}
                  </span>
                  <span class="meta-item">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    {{ v.createdAt | date:'dd/MM/yyyy' }}
                  </span>
                </div>
                <div class="score-row">
                  <span class="score-label">Compétence :</span>
                  <span class="score-value">{{ v.competence || '—' }}</span>
                </div>
                <div class="score-row">
                  <span class="score-label">Note :</span>
                  <span class="score-value">{{ v.note ?? '—' }} / 5</span>
                </div>
                @if (v.validePar?.prenom) {
                  <div class="valide-par">
                    Validé par {{ v.validePar.prenom }} {{ v.validePar.nom }}
                  </div>
                }
              </div>
            </div>
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
    .w-70 { width: 70%; } .w-90 { width: 90%; }
    @keyframes sh { 0%{opacity:0.5} 50%{opacity:1} 100%{opacity:0.5} }

    .empty { display: flex; flex-direction: column; align-items: center; text-align: center; padding: 60px 24px; }
    .empty h3 { font-size: var(--text-lg); margin: 12px 0 4px; }
    .empty p { font-size: var(--text-sm); color: var(--ink-700); margin: 0; }

    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 16px; }
    .card { background: var(--color-surface); border: 1px solid var(--line-200); border-radius: var(--radius-md); padding: 18px; display: flex; flex-direction: column; gap: 10px; transition: border-color var(--transition); }
    .card:hover { border-color: var(--honey-500); }
    .card p { font-size: var(--text-sm); color: var(--ink-700); margin: 0; line-height: 1.5; }
    .card-top { margin-bottom: 4px; }
    .card-title { font-weight: 600; font-size: var(--text-base); }
    .card-body { display: flex; flex-direction: column; gap: 8px; }
    .card-meta { display: flex; gap: 16px; flex-wrap: wrap; }
    .meta-item { display: inline-flex; align-items: center; gap: 4px; font-size: var(--text-xs); color: var(--ink-700); }
    .meta-item :deep(svg) { flex-shrink: 0; }
    .score-row { display: flex; gap: 6px; font-size: var(--text-sm); }
    .score-label { color: var(--ink-700); }
    .score-value { font-weight: 600; }
    .valide-par { font-size: var(--text-xs); color: var(--ink-700); font-style: italic; padding-top: 4px; border-top: 1px solid var(--line-200); }

    @media (max-width: 768px) { .grid { grid-template-columns: 1fr; } }
  `]
})
export class ValidationListComponent implements OnInit {
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
    this.http.get<any[]>('/api/placements/validations').subscribe({
      next: list => this.items = list,
      error: () => this.items = [],
      complete: () => this.loading.set(false),
    });
  }
}
