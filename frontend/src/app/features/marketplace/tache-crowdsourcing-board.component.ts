import { Component, OnInit, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { HexSealComponent } from '../../core/hex-seal.component';
import { ToastService } from '../../core/toast.service';
import { TacheCrowdsourcingService } from './tache-crowdsourcing.service';

@Component({
  selector: 'app-tache-crowdsourcing-board',
  standalone: true,
  imports: [HexSealComponent],
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
        @if (currentRole() === 'admin' && taches().length > 0) {
          <div class="proof-list">
            @for (t of taches(); track t._id) {
              <div class="proof-row">
                <app-hex-seal [status]="sealStatus(t)" [hash]="t.preuve?.txHash" [size]="26"></app-hex-seal>
                <span class="proof-title">{{ t.titre }}</span>
                <span class="proof-statut" [class]="'statut--' + sealStatus(t)">{{ sealLabel(t) }}</span>
                @if (isAnchored(t)) {
                  <a class="proof-sepolia" [href]="etherscanUrl(t)" target="_blank" rel="noopener noreferrer">Vérifier sur Sepolia</a>
                } @else {
                  <button class="proof-anchor" [disabled]="anchoringId() === t._id" (click)="ancrer(t)">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>
                    {{ anchoringId() === t._id ? 'Ancrage…' : 'Ancrer sur la blockchain' }}
                  </button>
                }
              </div>
            }
            @if (anchorError()) {
              <div class="proof-error">{{ anchorError() }}</div>
            }
          </div>
        }
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

    .proof-list { display: flex; flex-direction: column; gap: 8px; margin-bottom: 14px; padding: 12px; background: var(--ink-900); border-radius: var(--radius-md); }
    .proof-row { display: flex; align-items: center; gap: 12px; color: var(--paper-50); padding: 6px 4px; border-bottom: 1px solid rgba(246,245,242,0.1); }
    .proof-row:last-of-type { border-bottom: none; }
    .proof-title { font-size: var(--text-sm); font-weight: 600; flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .proof-statut { font-size: var(--text-xs); font-weight: 500; font-family: var(--font-mono); white-space: nowrap; }
    .statut--valide { color: var(--verify-500); }
    .statut--en_attente { color: var(--honey-500); }
    .statut--echec { color: var(--alert-500); }
    .proof-anchor { display: inline-flex; align-items: center; gap: 6px; background: rgba(246,245,242,0.08); border: 1px solid rgba(246,245,242,0.2); color: var(--paper-50); padding: 5px 12px; border-radius: var(--radius-sm); font-family: var(--font-body); font-size: var(--text-xs); font-weight: 500; cursor: pointer; transition: all var(--transition); white-space: nowrap; }
    .proof-anchor:hover:not(:disabled) { background: rgba(246,245,242,0.15); }
    .proof-anchor:disabled { opacity: 0.45; cursor: not-allowed; }
    .proof-sepolia { color: var(--honey-500); font-size: var(--text-xs); font-weight: 500; text-decoration: none; transition: opacity var(--transition); white-space: nowrap; }
    .proof-sepolia:hover { opacity: 0.8; text-decoration: underline; }
    .proof-error { font-size: var(--text-xs); color: var(--alert-500); background: rgba(196,67,46,0.08); padding: 6px 10px; border-radius: var(--radius-sm); }

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
  private toast = inject(ToastService);
  private tacheService = inject(TacheCrowdsourcingService);
  loading = signal(true);
  taches = signal<any[]>([]);
  currentRole = signal<string | null>(null);
  anchoringId = signal<string | null>(null);
  anchorError = signal<string | null>(null);

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
    this.http.get<{ role: string }>('/api/auth/me').subscribe({
      next: m => this.currentRole.set(m.role),
      error: () => this.currentRole.set(null),
    });
  }

  sealStatus(t: any): 'valide' | 'en_attente' | 'echec' {
    const s = t?.preuve?.statut;
    if (s === 'ancre') return 'valide';
    if (s === 'en_attente') return 'en_attente';
    if (s === 'echec') return 'echec';
    return 'en_attente';
  }

  sealLabel(t: any): string {
    const s = t?.preuve?.statut;
    if (s === 'ancre') return 'Ancrée';
    if (s === 'en_attente') return 'En attente';
    if (s === 'echec') return 'Échec';
    return 'Non soumise';
  }

  isAnchored(t: any): boolean {
    return t?.preuve?.statut === 'ancre';
  }

  etherscanUrl(t: any): string {
    return 'https://sepolia.etherscan.io/tx/' + (t?.preuve?.txHash || '');
  }

  ancrer(t: any) {
    this.anchoringId.set(t._id);
    this.anchorError.set(null);
    this.tacheService.ancrerTacheCrowdsourcing(t._id).subscribe({
      next: () => {
        this.anchoringId.set(null);
        this.toast.success('Tâche ancrée sur la blockchain.');
        this.http.get<any[]>('/api/taches-crowdsourcing').subscribe(list => this.taches.set(list));
      },
      error: e => {
        this.anchoringId.set(null);
        this.anchorError.set(e.error?.error || e.error?.detail || "Échec de l'ancrage blockchain.");
      },
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
