import { Component, OnInit, inject, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../core/toast.service';

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
  imports: [FormsModule],
  template: `
    <div class="page">
      <div class="page-head"><div><h1>Offres</h1><p>Emplois et missions disponibles</p></div></div>

      <div class="filters">
        <select class="filter-sel" [value]="selectedType" (change)="selectedType = $any($event.target).value">
          <option value="">Tous les types</option>
          <option value="emploi">Emploi</option>
          <option value="mission">Mission</option>
        </select>
      </div>

      @if (loading()) {
        <div class="skel-grid">@for (i of [1,2,3]; track i) { <div class="skel-card"><div class="skel-line w-70"></div><div class="skel-line w-40"></div></div> }</div>
      } @else { @if (filtered.length === 0) {
        <div class="empty"><h3>Aucune offre</h3><p>Les offres apparaîtront ici une fois publiées.</p></div>
      } @else {
        <div class="grid">
          @for (o of filtered; track o._id) {
            <div class="card">
              <div class="card-top">
                <span class="type-tag" [class]="'type--' + o.type">{{ o.type }}</span>
                <span class="statut-tag" [class]="'statut--' + o.statut">{{ o.statut }}</span>
              </div>
              <h3>{{ o.titre }}</h3>
              <div class="card-body">
                <p class="org">Par {{ o.organisationId?.prenom }} {{ o.organisationId?.nom }}</p>
                @if (o.exigences?.length) {
                  <div class="exig"><strong>Exigences</strong><ul>@for (e of o.exigences; track e) { <li>{{ e }}</li> }</ul></div>
                }
              </div>
              <div class="card-foot">
                @if (o.matchingScore !== undefined) {
                  <div class="match-gauge" [innerHTML]="arcGauge(o.matchingScore * 100)"></div>
                }
                <button class="btn btn-primary" (click)="postuler(o)">Postuler</button>
              </div>
            </div>
          }
        </div>
      }}
    </div>
  `,
  styles: [`
    :host { display: block; }
    .page-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
    .page-head h1 { font-size: var(--text-2xl); margin: 0 0 2px; }
    .page-head p { margin: 0; font-size: var(--text-sm); color: var(--ink-700); }

    .filters { display: flex; gap: 10px; margin-bottom: 20px; }
    .filter-sel { padding: 6px 14px; border: 1px solid var(--line-200); border-radius: var(--radius-sm); font-family: var(--font-body); font-size: var(--text-sm); background: var(--color-surface); color: var(--ink-900); outline: none; cursor: pointer; }
    .filter-sel:focus { border-color: var(--honey-500); }

    .empty { display: flex; flex-direction: column; align-items: center; text-align: center; padding: 60px 24px; }
    .empty h3 { font-size: var(--text-lg); margin: 0 0 4px; }
    .empty p { font-size: var(--text-sm); color: var(--ink-700); margin: 0; }

    .skel-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 16px; }
    .skel-card { background: var(--color-surface); border: 1px solid var(--line-200); border-radius: var(--radius-md); padding: 20px; }
    .skel-line { height: 12px; border-radius: 4px; background: var(--line-200); margin-bottom: 10px; animation: sh 1.5s infinite; }
    .w-70 { width: 70%; } .w-40 { width: 40%; }
    @keyframes sh { 0%{opacity:0.5} 50%{opacity:1} 100%{opacity:0.5} }

    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(380px, 1fr)); gap: 16px; }
    .card { background: var(--color-surface); border: 1px solid var(--line-200); border-radius: var(--radius-md); padding: 24px; display: flex; flex-direction: column; gap: 12px; transition: border-color var(--transition); }
    .card:hover { border-color: var(--honey-500); }
    .card h3 { font-size: var(--text-base); margin: 0; }
    .card-top { display: flex; gap: 6px; }
    .type-tag { font-size: var(--text-xs); font-weight: 600; text-transform: uppercase; padding: 2px 10px; border-radius: 999px; }
    .type--emploi { background: rgba(91,79,224,0.1); color: var(--agentic-500); }
    .type--mission { background: rgba(217,160,43,0.1); color: var(--honey-600); }
    .statut-tag { font-size: var(--text-xs); font-weight: 500; padding: 2px 10px; border-radius: 999px; background: var(--line-200); color: var(--ink-700); }
    .card-body { flex: 1; }
    .org { font-size: var(--text-sm); color: var(--ink-700); margin: 0 0 8px; }
    .exig { font-size: var(--text-sm); }
    .exig strong { display: block; margin-bottom: 4px; font-size: var(--text-xs); text-transform: uppercase; letter-spacing: 0.04em; color: var(--ink-700); }
    .exig ul { margin: 0 0 0 16px; padding: 0; }
    .exig li { margin-bottom: 2px; }

    .card-foot { display: flex; align-items: flex-end; justify-content: space-between; gap: 12px; padding-top: 12px; border-top: 1px solid var(--line-200); }
    .match-gauge { display: flex; flex-direction: column; align-items: center; gap: 2px; flex-shrink: 0; }
    .match-gauge :deep(.match-label) { font-size: 0.55rem; text-align: center; color: var(--ink-700); line-height: 1.2; max-width: 80px; }

    .btn { display: inline-flex; align-items: center; gap: 6px; padding: 8px 20px; border: none; border-radius: var(--radius-sm); font-family: var(--font-body); font-size: var(--text-sm); font-weight: 600; cursor: pointer; transition: all var(--transition); white-space: nowrap; }
    .btn-primary { background: var(--honey-500); color: var(--ink-900); }
    .btn-primary:hover { background: var(--honey-600); }

    @media (max-width: 768px) { .grid { grid-template-columns: 1fr; } }
  `]
})
export class OffreListComponent implements OnInit {
  private http = inject(HttpClient);
  private toast = inject(ToastService);
  loading = signal(true);
  items: any[] = [];
  selectedType = '';
  arcGauge = arcGauge;

  get filtered() {
    if (!this.selectedType) return this.items;
    return this.items.filter(o => o.type === this.selectedType);
  }

  ngOnInit() {
    this.http.get<any[]>('/api/placements/offres').subscribe({
      next: list => this.items = list,
      error: () => this.loading.set(false),
      complete: () => this.loading.set(false),
    });
  }

  postuler(o: any) {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders(token ? { Authorization: `Bearer ${token}` } : {});
    this.http.post('/api/placements/postuler', { offreId: o._id }, { headers }).subscribe({
      next: () => this.toast.success('Candidature envoyée pour ' + o.titre),
      error: () => this.toast.error('Erreur lors de la candidature'),
    });
  }
}
