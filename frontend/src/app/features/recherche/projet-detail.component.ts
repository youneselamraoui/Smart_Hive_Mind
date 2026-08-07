import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DatePipe, CurrencyPipe } from '@angular/common';
import { ProjetRechercheFinanceService, ProjetRechercheFinance } from './projet-recherche-finance.service';
import { StructureRechercheService, StructureRecherche } from './structure-recherche.service';
import { ToastService } from '../../core/toast.service';

@Component({
  selector: 'app-projet-detail',
  standalone: true,
  imports: [RouterLink, DatePipe, CurrencyPipe],
  template: `
    <div class="page">
      <a routerLink="/projets-recherche" class="back-link">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="15 18 9 12 15 6"/></svg>
        Tous les projets
      </a>

      @if (loading()) {
        <div class="loading-center"><div class="spin"></div><span>Chargement…</span></div>
      } @else { @let p = projet();
        <div class="detail-card">
          <div class="projet-hero">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--honey-500)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
            <div class="projet-hero-text">
              <h1>{{ p?.theme }}</h1>
              <span class="projet-statut" [class]="'statut--' + p?.statut">{{ statutLabel(p?.statut) }}</span>
            </div>
          </div>

          <div class="projet-info">
            <div class="pi-row"><span class="pi-label">Budget</span><span class="pi-value">{{ p?.budget != null ? (p?.budget | currency:'MAD':'symbol':'1.0-0') : '—' }}</span></div>
            <div class="pi-row"><span class="pi-label">Industriel</span><span class="pi-value">{{ p?.industrielId?.nom || p?.industrielId?.prenom || 'Industriel #' + p?.industrielId }}</span></div>
            <div class="pi-row"><span class="pi-label">Structure attribuée</span><span class="pi-value">{{ p?.structureRechercheId?.nom || 'Aucune' }}</span></div>
            <div class="pi-row"><span class="pi-label">Publié le</span><span class="pi-value">{{ p?.createdAt | date:'dd MMM yyyy' }}</span></div>
          </div>

          @if (p?.livrables?.length) {
            <div class="section">
              <h3>Livrables</h3>
              <div class="livrable-list">
                @for (l of p?.livrables; track l; let i = $index) {
                  <div class="livrable-row">
                    <span class="livrable-desc">{{ l.description || 'Livrable #' + (i + 1) }}</span>
                    <span class="livrable-meta">
                      {{ l.dateEcheance ? ('Échéance ' + (l.dateEcheance | date:'dd MMM yyyy')) : '' }}
                      {{ l.statut ? '· ' + l.statut : '' }}
                    </span>
                  </div>
                }
              </div>
            </div>
          }

          <div class="section">
            <h3>Candidatures ({{ p?.candidatures?.length || 0 }})</h3>
            @if (p?.candidatures?.length) {
              <div class="candidature-list">
                @for (c of p?.candidatures; track c) {
                  <div class="candidature-row">
                    <span class="candidature-equipe">{{ c.equipeId?.nom || 'Équipe #' + c.equipeId }}</span>
                    <span class="candidature-date">{{ c.dateCandidature ? (c.dateCandidature | date:'dd MMM yyyy') : '' }}</span>
                    <span class="candidature-statut" [class]="'cand--' + c.statut">{{ c.statut || '—' }}</span>
                  </div>
                }
              </div>
            } @else {
              <p class="placeholder">Aucune candidature pour le moment.</p>
            }
          </div>

          <!-- Candidater : visible si le projet accepte encore des candidatures et
               que l'utilisateur connecté appartient à au moins une structure de
               recherche (membres populés côté serveur). Si l'appartenance côté
               serveur échoue, le backend renvoie 403, affiché ci-dessous. -->
          @if (p?.statut === 'candidature' && estMembreStructure()) {
            @if (!candidatureOpen()) {
              <div class="detail-actions">
                <button class="btn btn-agentic" (click)="openCandidature()">Candidater</button>
              </div>
            } @else {
              <div class="action-box">
                <label class="action-label" for="cand-equipe">Candidater avec ma structure</label>
                <select id="cand-equipe" class="action-select" [value]="selectedEquipeId()" (change)="onEquipeChange($event)">
                  <option value="">Choisir une structure…</option>
                  @for (s of mesStructures(); track s._id) {
                    <option [value]="s._id">{{ s.nom }}</option>
                  }
                </select>
                <div class="action-buttons">
                  <button class="btn btn-agentic" [disabled]="!selectedEquipeId() || submitting()" (click)="candidater()">
                    {{ submitting() ? 'Envoi…' : 'Confirmer la candidature' }}
                  </button>
                  <button class="btn btn-outline" (click)="candidatureOpen.set(false)">Annuler</button>
                </div>
                @if (actionError()) { <div class="action-result action-result--error">{{ actionError() }}</div> }
                @if (actionOk()) { <div class="action-result action-result--success">{{ actionOk() }}</div> }
              </div>
            }
          }

          <!-- Attribuer : visible uniquement pour l'industriel ayant publié le
               projet et tant que le statut est 'candidature'. -->
          @if (p?.statut === 'candidature' && isOwner()) {
            @if (!attributionOpen()) {
              <div class="detail-actions">
                <button class="btn btn-outline" (click)="openAttribution()">Attribuer le projet</button>
              </div>
            } @else {
              <div class="action-box">
                <label class="action-label" for="attr-equipe">Attribuer à une équipe candidate</label>
                <select id="attr-equipe" class="action-select" [value]="selectedEquipeId()" (change)="onEquipeChange($event)">
                  <option value="">Choisir une équipe…</option>
                  @for (c of p?.candidatures; track c) {
                    <option [value]="c.equipeId?._id || c.equipeId">{{ c.equipeId?.nom || 'Équipe #' + c.equipeId }}</option>
                  }
                </select>
                <div class="action-buttons">
                  <button class="btn btn-agentic" [disabled]="!selectedEquipeId() || submitting()" (click)="attribuer()">
                    {{ submitting() ? 'Attribution…' : 'Confirmer l\'attribution' }}
                  </button>
                  <button class="btn btn-outline" (click)="attributionOpen.set(false)">Annuler</button>
                </div>
                @if (actionError()) { <div class="action-result action-result--error">{{ actionError() }}</div> }
                @if (actionOk()) { <div class="action-result action-result--success">{{ actionOk() }}</div> }
              </div>
            }
          }

          <div class="detail-actions">
            <button class="btn btn-outline" (click)="edit()">Modifier</button>
            <button class="btn btn-danger" [disabled]="deleting()" (click)="remove()">{{ deleting() ? 'Suppression…' : 'Supprimer' }}</button>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    :host { display: block; }
    .page { max-width: 720px; }
    .back-link { display: inline-flex; align-items: center; gap: 6px; color: var(--ink-700); text-decoration: none; font-size: var(--text-sm); margin-bottom: 16px; transition: color var(--transition); }
    .back-link:hover { color: var(--honey-500); }

    .loading-center { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 60px; color: var(--ink-700); }
    .spin { width: 24px; height: 24px; border: 2px solid var(--line-200); border-top-color: var(--honey-500); border-radius: 50%; animation: sp 0.7s linear infinite; }
    @keyframes sp { to { transform: rotate(360deg); } }

    .detail-card { background: var(--color-surface); border: 1px solid var(--line-200); border-radius: var(--radius-md); padding: 24px; display: flex; flex-direction: column; gap: 16px; }

    .projet-hero { display: flex; align-items: center; gap: 16px; }
    .projet-hero svg { flex-shrink: 0; }
    .projet-hero-text { flex: 1; }
    .projet-hero-text h1 { font-size: var(--text-xl); margin: 0 0 6px; line-height: 1.4; }
    .projet-statut { font-size: var(--text-xs); font-weight: 600; padding: 3px 10px; border-radius: 999px; text-transform: capitalize; }
    .statut--candidature { background: rgba(217,160,43,0.1); color: var(--honey-600); }
    .statut--en_cours { background: rgba(91,79,224,0.08); color: var(--agentic-500); }
    .statut--termine { background: rgba(31,158,109,0.1); color: var(--verify-500); }

    .projet-info { background: var(--paper-50); border: 1px solid var(--line-200); border-radius: var(--radius-sm); padding: 12px 16px; display: flex; flex-direction: column; gap: 6px; }
    .pi-row { display: flex; justify-content: space-between; font-size: var(--text-sm); }
    .pi-label { color: var(--ink-700); }
    .pi-value { font-weight: 500; }

    .section h3 { font-size: var(--text-sm); font-weight: 600; margin: 0 0 10px; }
    .livrable-list, .candidature-list { display: flex; flex-direction: column; gap: 6px; }
    .livrable-row, .candidature-row { display: flex; justify-content: space-between; align-items: center; gap: 10px; font-size: var(--text-sm); padding: 8px 12px; border: 1px solid var(--line-200); border-radius: var(--radius-sm); }
    .livrable-desc, .candidature-equipe { font-weight: 500; }
    .livrable-meta, .candidature-date { color: var(--ink-700); }
    .candidature-statut { font-size: var(--text-xs); font-weight: 600; padding: 2px 8px; border-radius: 999px; text-transform: capitalize; }
    .cand--retenue { background: rgba(31,158,109,0.1); color: var(--verify-500); }
    .cand--en_attente { background: rgba(217,160,43,0.1); color: var(--honey-600); }
    .placeholder { font-size: var(--text-sm); color: var(--ink-700); margin: 0; }

    .detail-actions { display: flex; gap: 10px; }
    .btn { display: inline-flex; align-items: center; gap: 8px; padding: 10px 22px; border-radius: var(--radius-md); font-family: var(--font-body); font-size: var(--text-sm); font-weight: 600; cursor: pointer; transition: all var(--transition); }
    .btn:disabled { opacity: 0.4; cursor: not-allowed; }
    .btn-outline { background: var(--color-surface); border: 1px solid var(--line-200); color: var(--ink-900); }
    .btn-outline:hover:not(:disabled) { border-color: var(--honey-500); color: var(--honey-500); }
    .btn-danger { background: none; border: 1px solid rgba(196,67,46,0.3); color: var(--alert-500); }
    .btn-danger:hover:not(:disabled) { background: rgba(196,67,46,0.06); }
    .btn-agentic { background: rgba(91,79,224,0.08); border: 1px solid rgba(91,79,224,0.2); color: var(--agentic-500); }
    .btn-agentic:hover:not(:disabled) { background: rgba(91,79,224,0.15); }

    .action-box { display: flex; flex-direction: column; gap: 8px; padding: 12px; border: 1px solid var(--line-200); border-radius: var(--radius-md); background: var(--color-surface); }
    .action-label { font-size: var(--text-xs); font-weight: 600; }
    .action-select { padding: 8px 12px; border: 1.5px solid var(--line-200); border-radius: var(--radius-sm); font-family: var(--font-body); font-size: var(--text-sm); background: var(--color-surface); color: var(--ink-900); outline: none; }
    .action-select:focus { border-color: var(--honey-500); }
    .action-buttons { display: flex; gap: 10px; }
    .action-result { font-size: var(--text-sm); padding: 10px 14px; border-radius: var(--radius-md); }
    .action-result--success { color: var(--verify-500); background: rgba(31,158,109,0.06); }
    .action-result--error { color: var(--alert-500); background: rgba(196,67,46,0.06); }
  `]
})
export class ProjetDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private service = inject(ProjetRechercheFinanceService);
  private structureService = inject(StructureRechercheService);
  private toast = inject(ToastService);

  loading = signal(true);
  projet = signal<ProjetRechercheFinance | null>(null);
  deleting = signal(false);
  mesStructures = signal<StructureRecherche[]>([]);
  candidatureOpen = signal(false);
  attributionOpen = signal(false);
  selectedEquipeId = signal('');
  submitting = signal(false);
  actionError = signal<string | null>(null);
  actionOk = signal<string | null>(null);
  currentUserId = localStorage.getItem('membreId') || '';

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;
    this.service.getById(id).subscribe({
      next: p => { this.projet.set(p); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
    this.structureService.list().subscribe({
      next: structures => {
        this.mesStructures.set(structures.filter(s =>
          (s.membres || []).some((m: any) => (m?._id || m) === this.currentUserId)
        ));
      },
      error: () => this.mesStructures.set([]),
    });
  }

  estMembreStructure(): boolean {
    return this.mesStructures().length > 0;
  }

  isOwner(): boolean {
    const p = this.projet();
    return ((p?.industrielId?._id || p?.industrielId) as any) === this.currentUserId;
  }

  openCandidature() {
    this.candidatureOpen.set(true);
    this.attributionOpen.set(false);
    this.selectedEquipeId.set('');
    this.actionError.set(null);
    this.actionOk.set(null);
  }

  openAttribution() {
    this.attributionOpen.set(true);
    this.candidatureOpen.set(false);
    this.selectedEquipeId.set('');
    this.actionError.set(null);
    this.actionOk.set(null);
  }

  onEquipeChange(event: Event) {
    this.selectedEquipeId.set((event.target as HTMLSelectElement).value);
  }

  candidater() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id || !this.selectedEquipeId()) return;
    this.submitting.set(true);
    this.actionError.set(null);
    this.actionOk.set(null);
    this.service.candidater(id, this.selectedEquipeId()).subscribe({
      next: p => {
        this.projet.set(p);
        this.submitting.set(false);
        this.candidatureOpen.set(false);
        this.actionOk.set('Candidature envoyée.');
      },
      error: e => {
        this.submitting.set(false);
        this.actionError.set(e.error?.error || 'Erreur lors de la candidature.');
      },
    });
  }

  attribuer() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id || !this.selectedEquipeId()) return;
    this.submitting.set(true);
    this.actionError.set(null);
    this.actionOk.set(null);
    this.service.attribuer(id, this.selectedEquipeId()).subscribe({
      next: p => {
        this.projet.set(p);
        this.submitting.set(false);
        this.attributionOpen.set(false);
        this.actionOk.set('Projet attribué, statut passé à en cours.');
      },
      error: e => {
        this.submitting.set(false);
        this.actionError.set(e.error?.error || 'Erreur lors de l\'attribution.');
      },
    });
  }

  edit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.router.navigate(['/projets-recherche', id, 'edit']);
  }

  remove() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;
    this.deleting.set(true);
    this.service.delete(id).subscribe({
      next: () => { this.toast.success('Projet supprimé.'); this.router.navigate(['/projets-recherche']); },
      error: () => { this.deleting.set(false); this.toast.error('Erreur lors de la suppression.'); },
    });
  }

  statutLabel(statut?: string): string {
    const labels: Record<string, string> = { candidature: 'Candidature', en_cours: 'En cours', termine: 'Terminé' };
    return statut ? (labels[statut] || statut) : '—';
  }
}
