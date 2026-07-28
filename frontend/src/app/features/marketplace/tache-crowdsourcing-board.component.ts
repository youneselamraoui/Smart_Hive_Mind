import { Component, OnInit, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-tache-crowdsourcing-board',
  standalone: true,
  imports: [],
  template: `
    <div class="section">
      <div class="section-head">
        <h2>Tâches de Crowdsourcing</h2>
        <button class="btn btn-primary btn-sm" (click)="create()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Nouvelle tâche
        </button>
      </div>

      @if (loading()) {
        <div class="skel-row">@for (i of [1,2,3,4]; track i) { <div class="skel-col"><div class="skel-line w-90"></div><div class="skel-line w-60"></div></div> }</div>
      } @else {
        <div class="legend">
          <span class="legend-item"><span class="legend-dot dot--nouveau"></span> Lots réservés nouveaux profils (équité 10%)</span>
        </div>
        <div class="kanban">
          @for (col of columns; track col.key) {
            <div class="kanban-col">
              <div class="kanban-head">
                <h3>{{ col.label }}</h3>
                <span class="kanban-count">{{ lotsByStatus(col.key).length }}</span>
              </div>
              <div class="kanban-cards">
                @for (lot of lotsByStatus(col.key); track lot._id || lot.description) {
                  <div class="kanban-card" [class.kard--nouveau]="lot.nouveauProfil">
                    @if (lot.nouveauProfil) {
                      <span class="kard-badge" title="Réservé nouveaux profils">Nouveau</span>
                    }
                    <span class="kard-desc">{{ lot.description }}</span>
                    <div class="kard-meta">
                      <span class="kard-remu">{{ lot.remunerationCalculee }}</span>
                      @if (lot.assigneA) {
                        <span class="kard-assign">{{ lot.assigneA.prenom }} {{ lot.assigneA.nom }}</span>
                      }
                      @if (col.key === 'ouverte') {
                        <button class="kard-take" (click)="prendre(lot.tacheId || lot._id)">Prendre</button>
                      }
                    </div>
                  </div>
                }
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    :host { display: block; }
    .section { position: relative; }
    .section-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; flex-wrap: wrap; gap: 10px; }
    .section-head h2 { font-size: var(--text-lg); margin: 0; }

    .btn { display: inline-flex; align-items: center; gap: 6px; border: none; border-radius: var(--radius-md); font-family: var(--font-body); font-size: var(--text-sm); font-weight: 600; cursor: pointer; transition: all var(--transition); text-decoration: none; }
    .btn-primary { background: var(--honey-500); color: var(--ink-900); }
    .btn-primary:hover { background: var(--honey-600); }
    .btn-sm { padding: 6px 14px; }

    .legend { margin-bottom: 14px; }
    .legend-item { display: inline-flex; align-items: center; gap: 6px; font-size: var(--text-xs); color: var(--ink-700); }
    .legend-dot { width: 8px; height: 8px; border-radius: 50%; }
    .dot--nouveau { background: var(--verify-500); }

    .skel-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
    .skel-col { background: var(--color-surface); border: 1px solid var(--line-200); border-radius: var(--radius-md); padding: 16px; }
    .skel-line { height: 12px; border-radius: 4px; background: var(--line-200); margin-bottom: 8px; animation: sh 1.5s infinite; }
    .w-90 { width: 90%; } .w-60 { width: 60%; }
    @keyframes sh { 0%{opacity:0.5} 50%{opacity:1} 100%{opacity:0.5} }

    .kanban { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; overflow-x: auto; }
    .kanban-col { background: var(--paper-50); border: 1px solid var(--line-200); border-radius: var(--radius-md); padding: 12px; display: flex; flex-direction: column; gap: 8px; min-height: 200px; }
    .kanban-head { display: flex; align-items: center; justify-content: space-between; }
    .kanban-head h3 { font-size: var(--text-sm); margin: 0; font-weight: 600; }
    .kanban-count { font-size: var(--text-xs); font-family: var(--font-mono); color: var(--ink-700); background: var(--line-200); padding: 1px 8px; border-radius: 999px; }
    .kanban-cards { display: flex; flex-direction: column; gap: 6px; }

    .kanban-card { position: relative; background: var(--color-surface); border: 1px solid var(--line-200); border-radius: var(--radius-sm); padding: 10px 12px; display: flex; flex-direction: column; gap: 6px; font-size: var(--text-xs); transition: border-color var(--transition); }
    .kanban-card:hover { border-color: var(--honey-500); }
    .kard--nouveau { border-left: 2px solid var(--verify-500); }
    .kard-badge { position: absolute; top: 6px; right: 6px; font-size: 0.55rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; padding: 1px 6px; border-radius: 4px; background: var(--verify-500); color: var(--paper-50); }
    .kard-desc { font-weight: 500; line-height: 1.4; }
    .kard-meta { display: flex; align-items: center; gap: 6px; }
    .kard-remu { font-family: var(--font-mono); font-size: 0.65rem; font-weight: 600; padding: 2px 6px; border-radius: 4px; background: var(--paper-50); color: var(--ink-900); }
    .kard-assign { font-size: 0.6rem; color: var(--ink-700); margin-left: auto; }
    .kard-take { padding: 2px 8px; border: none; border-radius: 4px; background: var(--honey-500); color: var(--ink-900); font-size: 0.6rem; font-weight: 600; cursor: pointer; margin-left: auto; }

    @media (max-width: 900px) { .kanban { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 600px) { .kanban { grid-template-columns: 1fr; } }
  `]
})
export class TacheCrowdsourcingBoardComponent implements OnInit {
  private http = inject(HttpClient);
  loading = signal(true);
  taches = signal<any[]>([]);

  columns = [
    { key: 'ouverte', label: 'Ouverte' },
    { key: 'assigne', label: 'Assignée' },
    { key: 'en_cours', label: 'En cours' },
    { key: 'terminee', label: 'Terminée' },
  ];

  lotsByStatus(status: string) {
    const lots: any[] = [];
    for (const t of this.taches()) {
      for (const lot of (t.lots || [])) {
        const s = (lot.statut || '').toLowerCase().replace(/\s+/g, '_');
        if (s === status || (status === 'ouverte' && s === 'ouverte') ||
            (status === 'assigne' && s === 'assignée') ||
            (status === 'en_cours' && s === 'en_cours') ||
            (status === 'terminee' && s === 'termine' || s === 'terminee')) {
          lots.push({ ...lot, tacheId: t._id });
        }
      }
    }
    return lots;
  }

  ngOnInit() {
    this.http.get<any[]>('/api/taches-crowdsourcing').subscribe({
      next: list => this.taches.set(list),
      error: () => this.taches.set([]),
      complete: () => this.loading.set(false),
    });
  }

  prendre(tacheId: string) {
    this.http.post('/api/taches-crowdsourcing/' + tacheId + '/repartir', {}).subscribe({
      next: () => this.http.get<any[]>('/api/taches-crowdsourcing').subscribe(list => this.taches.set(list)),
    });
  }

  create() {
    window.location.href = '/marketplace/taches-crowdsourcing/new';
  }
}
