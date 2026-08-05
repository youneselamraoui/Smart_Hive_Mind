import { Component, OnInit, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { SafeHtmlPipe } from '../../core/safe-html.pipe';

function arcGauge(pct: number): string {
  const r = 38, cx = 48, cy = 48;
  const circumference = 2 * Math.PI * r;
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
  selector: 'app-offre-list',
  standalone: true,
  imports: [FormsModule, SafeHtmlPipe],
  template: `
    <div class="section">
      <div class="section-head">
        <h2>Offres d'emploi & stages</h2>
      </div>

      <div class="filters">
        <select class="filter-sel" [value]="selectedType" (change)="selectedType = $any($event.target).value">
          <option value="">Tous les types</option>
          <option value="emploi">Emploi</option>
          <option value="stage">Stage</option>
        </select>
        <select class="filter-sel" [value]="selectedExigence" (change)="selectedExigence = $any($event.target).value">
          <option value="">Toutes les compétences</option>
          @for (e of exigenceOptions; track e) { <option [value]="e">{{ e }}</option> }
        </select>
      </div>

      @if (loading()) {
        <div class="skel-grid">@for (i of [1,2,3]; track i) { <div class="skel-card"><div class="skel-line w-70"></div><div class="skel-line w-40"></div></div> }</div>
      } @else { @if (filtered.length === 0) {
        <div class="empty">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--honey-500)" stroke-width="1" opacity="0.3"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
          <h3>Aucune offre</h3>
          <p>Les offres apparaîtront ici une fois publiées.</p>
        </div>
      } @else {
        <div class="grid">
          @for (o of filtered; track o._id) {
            <div class="card">
              <div class="card-top">
                <span class="type-tag" [class]="'type--' + o.type">{{ o.type }}</span>
              </div>
              <h3>{{ o.titre }}</h3>
              <div class="exig">
                <strong>Exigences:</strong>
                <ul>@for (e of o.exigences; track e) { <li>{{ e }}</li> }</ul>
              </div>
              <div class="card-footer">
                <span class="org">Par {{ o.organisationId?.prenom }} {{ o.organisationId?.nom }}</span>
                @if (o.matchingScore !== undefined) {
                  <div class="match-gauge" [innerHTML]="arcGauge(o.matchingScore * 100) | safeHtml"></div>
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
    .section-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
    .section-head h2 { font-size: var(--text-lg); margin: 0; }

    .filters { display: flex; gap: 10px; margin-bottom: 20px; flex-wrap: wrap; }
    .filter-sel { padding: 6px 12px; border: 1px solid var(--line-200); border-radius: var(--radius-sm); font-family: var(--font-body); font-size: var(--text-sm); background: var(--color-surface); color: var(--ink-900); outline: none; cursor: pointer; }
    .filter-sel:focus { border-color: var(--honey-500); }

    .empty { display: flex; flex-direction: column; align-items: center; text-align: center; padding: 60px 24px; }
    .empty h3 { font-size: var(--text-lg); margin: 12px 0 4px; }
    .empty p { font-size: var(--text-sm); color: var(--ink-700); margin: 0; }

    .skel-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 16px; }
    .skel-card { background: var(--color-surface); border: 1px solid var(--line-200); border-radius: var(--radius-md); padding: 20px; }
    .skel-line { height: 12px; border-radius: 4px; background: var(--line-200); margin-bottom: 10px; animation: sh 1.5s infinite; }
    .w-70 { width: 70%; } .w-40 { width: 40%; }
    @keyframes sh { 0%{opacity:0.5} 50%{opacity:1} 100%{opacity:0.5} }

    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 16px; }
    .card { background: var(--color-surface); border: 1px solid var(--line-200); border-radius: var(--radius-md); padding: 20px; display: flex; flex-direction: column; gap: 10px; transition: border-color var(--transition); }
    .card:hover { border-color: var(--honey-500); }
    .card h3 { font-size: var(--text-base); margin: 0; }
    .card-top { display: flex; gap: 6px; }
    .type-tag { font-size: var(--text-xs); font-weight: 600; text-transform: uppercase; padding: 2px 10px; border-radius: 999px; }
    .type--emploi { background: rgba(91,79,224,0.1); color: var(--agentic-500); }
    .type--stage { background: rgba(217,160,43,0.1); color: var(--honey-600); }

    .exig { font-size: var(--text-sm); }
    .exig ul { margin: 4px 0 0 16px; padding: 0; }
    .exig li { margin-bottom: 2px; }
    .org { font-size: var(--text-xs); color: var(--ink-700); }

    .card-footer { display: flex; align-items: flex-end; justify-content: space-between; gap: 10px; margin-top: auto; padding-top: 8px; border-top: 1px solid var(--line-200); }
    .match-gauge { display: flex; flex-direction: column; align-items: center; gap: 2px; flex-shrink: 0; }
    .match-gauge :deep(.match-label) { font-size: 0.55rem; text-align: center; color: var(--ink-700); line-height: 1.2; max-width: 80px; }

    @media (max-width: 768px) { .grid { grid-template-columns: 1fr; } }
  `]
})
export class OffreListComponent implements OnInit {
  private http = inject(HttpClient);
  loading = signal(true);
  items: any[] = [];
  selectedType = '';
  selectedExigence = '';
  exigenceOptions: string[] = [];
  arcGauge = arcGauge;

  get filtered() {
    return this.items.filter(o => {
      if (this.selectedType && o.type !== this.selectedType) return false;
      if (this.selectedExigence && !o.exigences?.includes(this.selectedExigence)) return false;
      return true;
    });
  }

  ngOnInit() {
    this.http.get<any[]>('/api/offres').subscribe({
      next: list => {
        this.items = list;
        const allExig = new Set<string>();
        for (const o of list) for (const e of (o.exigences || [])) allExig.add(e);
        this.exigenceOptions = [...allExig];
      },
      error: () => this.items = [],
      complete: () => this.loading.set(false),
    });
  }
}
