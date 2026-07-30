import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Subscription, timer, switchMap, catchError, of } from 'rxjs';
import { ToastService } from '../../../core/toast.service';
import { EmptyStateComponent } from '../../../core/empty-state.component';

const STEP_ICONS: Record<string, string> = {
  selection: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>`,
  augmentation: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><rect x="14" y="14" width="6" height="6" rx="1"/><line x1="10" y1="7" x2="14" y2="7"/><line x1="7" y1="10" x2="7" y2="14"/></svg>`,
  nettoyage: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M12 3a9 9 0 0 0-9 9 9 9 0 0 0 9 9 9 9 0 0 0 9-9 9 9 0 0 0-9-9z"/><path d="M8 12h8"/><line x1="12" y1="8" x2="12" y2="16"/></svg>`,
  entrainement: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33"/><path d="M4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68"/></svg>`,
  explicabilite: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`,
};

function iconFor(label: string): string {
  const lower = label.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (lower.includes('sélection') || lower.includes('selection') || lower.includes('donnée') || lower.includes('donnee')) return STEP_ICONS['selection'];
  if (lower.includes('augment') || lower.includes('génération') || lower.includes('generation') || lower.includes('synthétique') || lower.includes('synthetique')) return STEP_ICONS['augmentation'];
  if (lower.includes('nettoy') || lower.includes('clean') || lower.includes('prétrait') || lower.includes('pretrait')) return STEP_ICONS['nettoyage'];
  if (lower.includes('entraîn') || lower.includes('entrain') || lower.includes('train') || lower.includes('apprentissage')) return STEP_ICONS['entrainement'];
  if (lower.includes('explic') || lower.includes('explain') || lower.includes('interpr') || lower.includes('interpret')) return STEP_ICONS['explicabilite'];
  return STEP_ICONS['augmentation'];
}

@Component({
  selector: 'app-atelier-runner',
  standalone: true,
  imports: [FormsModule, EmptyStateComponent],
  template: `
    <div class="page">
      <div class="page-head">
        <h1>Atelier en cours</h1>
        @if (atelier) { <p>{{ atelier.nom }}</p> }
      </div>

      @if (error()) {
        <app-empty-state icon="alert-circle" title="Atelier introuvable" [description]="error()!" actionLabel="Retour" actionRouterLink="/smart-tools/models" />
      } @else if (!atelier) {
        <div class="loading-center">
          <div class="spin"></div>
          <span>Chargement de l'atelier…</span>
        </div>
      } @else { @let a = atelier;
        <div class="runner-card">
          <div class="runner-top">
            <span class="global-badge" [class]="'badge--' + a.statutGlobal">
              <span class="badge-dot"></span>
              {{ a.statutGlobal === 'en_cours' ? 'En cours' : a.statutGlobal === 'termine' ? 'Terminé' : 'Échec' }}
            </span>
            @if (a.statutGlobal === 'en_cours') {
              <span class="poll-msg">Mise à jour automatique toutes les 3s</span>
            }
          </div>

          <!-- CI/CD timeline -->
          <div class="timeline">
            @for (etape of a.etapes || []; track etape.index; let last = $last) {
              <div class="tl-step" [class]="'tl--' + etape.statut">
                <!-- Connector line -->
                @if (!last) {
                  <div class="tl-line" [class]="'tl-line--' + (etape.statut === 'termine' ? 'done' : etape.statut === 'echec' ? 'fail' : 'wait')"></div>
                }
                <!-- Icon node -->
                <div class="tl-node" [class]="'tl-node--' + etape.statut">
                  @if (etape.statut === 'termine') {
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                  } @else if (etape.statut === 'echec') {
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                  } @else if (etape.statut === 'en_cours') {
                    <div class="tl-node-icon" [innerHTML]="iconFor(etape.label)"></div>
                  } @else {
                    <div class="tl-node-icon dim" [innerHTML]="iconFor(etape.label)"></div>
                  }
                </div>
                <!-- Content -->
                <div class="tl-content" [class]="'tl-content--' + etape.statut">
                  <span class="tl-label">{{ etape.label }}</span>
                  <span class="tl-status">{{ etape.statut === 'en_cours' ? 'En cours' : etape.statut === 'termine' ? 'Terminé' : etape.statut === 'echec' ? 'Échec' : 'En attente' }}</span>
                  @if (etape.resultatUrl) {
                    <a class="tl-link" [href]="etape.resultatUrl" target="_blank">Voir le résultat →</a>
                  }
                </div>
              </div>
            }
          </div>

          @if (a.statutGlobal === 'en_cours') {
            <div class="runner-actions">
              <div class="progress-form">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                <input class="progress-input" type="text" placeholder="Progression…" [(ngModel)]="progressMsg" />
                <button class="btn btn-outline btn-sm" (click)="reportProgress(a._id)">Signaler</button>
              </div>
              <button class="btn btn-primary" (click)="finalize(a._id)">Finaliser l'atelier</button>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    :host { display: block; }
    .page { position: relative; max-width: 700px; }
    .page-head { margin-bottom: 24px; }
    .page-head h1 { font-size: var(--text-xl); margin: 0 0 2px; }
    .page-head p { margin: 0; font-size: var(--text-sm); color: var(--ink-700); }

    .loading-center { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 60px 20px; color: var(--ink-700); }
    .spin { width: 24px; height: 24px; border: 2px solid var(--line-200); border-top-color: var(--agentic-500); border-radius: 50%; animation: sp 0.7s linear infinite; }
    @keyframes sp { to { transform: rotate(360deg); } }

    .runner-card { background: var(--color-surface); border: 1px solid var(--line-200); border-radius: var(--radius-md); padding: 24px; }

    .runner-top { display: flex; align-items: center; gap: 12px; margin-bottom: 28px; flex-wrap: wrap; }
    .global-badge { display: inline-flex; align-items: center; gap: 6px; font-size: var(--text-xs); font-weight: 700; text-transform: uppercase; padding: 4px 14px; border-radius: 999px; }
    .badge-dot { width: 6px; height: 6px; border-radius: 50%; }
    .badge--en_cours { background: rgba(91,79,224,0.1); color: var(--agentic-500); }
    .badge--en_cours .badge-dot { background: var(--agentic-500); animation: pulse-dot 1.5s ease-in-out infinite; }
    .badge--termine { background: rgba(31,158,109,0.1); color: var(--verify-500); }
    .badge--termine .badge-dot { background: var(--verify-500); }
    .badge--echec { background: rgba(196,67,46,0.1); color: var(--alert-500); }
    .badge--echec .badge-dot { background: var(--alert-500); }
    @keyframes pulse-dot { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(0.7)} }
    .poll-msg { font-size: var(--text-xs); color: var(--ink-700); font-style: italic; }

    /* Timeline */
    .timeline { display: flex; flex-direction: column; }
    .tl-step { display: flex; gap: 16px; padding-left: 24px; position: relative; padding-bottom: 24px; }
    .tl-step:last-child { padding-bottom: 0; }

    .tl-line { position: absolute; left: 31px; top: 40px; bottom: 0; width: 2px; }
    .tl-line--done { background: var(--verify-500); }
    .tl-line--fail { background: var(--alert-500); }
    .tl-line--wait { background: var(--line-200); }

    .tl-node { position: absolute; left: 18px; top: 0; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; z-index: 1; }
    .tl-node--termine { background: var(--verify-500); color: var(--paper-50); }
    .tl-node--echec { background: var(--alert-500); color: var(--paper-50); }
    .tl-node--en_cours { background: var(--agentic-500); color: var(--paper-50); animation: pulse-node 1.5s ease-in-out infinite; }
    .tl-node--en_attente { background: var(--line-200); color: var(--ink-700); }
    .tl-node-icon { width: 18px; height: 18px; display: flex; align-items: center; justify-content: center; }
    .tl-node-icon svg { width: 18px; height: 18px; }
    .tl-node-icon.dim { opacity: 0.4; }
    @keyframes pulse-node { 0%,100%{box-shadow:0 0 0 0 rgba(91,79,224,0.4)} 50%{box-shadow:0 0 0 8px rgba(91,79,224,0)} }

    .tl-content { flex: 1; display: flex; align-items: center; gap: 10px; flex-wrap: wrap; padding-top: 4px; }
    .tl-label { font-size: var(--text-sm); font-weight: 600; }
    .tl-content--termine .tl-label { color: var(--ink-900); }
    .tl-content--en_cours .tl-label { color: var(--agentic-500); }
    .tl-content--echec .tl-label { color: var(--alert-500); }
    .tl-content--en_attente .tl-label { opacity: 0.45; }
    .tl-status { font-size: var(--text-xs); font-weight: 500; text-transform: uppercase; letter-spacing: 0.03em; }
    .tl-content--termine .tl-status { color: var(--verify-500); }
    .tl-content--en_cours .tl-status { color: var(--agentic-500); }
    .tl-content--echec .tl-status { color: var(--alert-500); }
    .tl-content--en_attente .tl-status { color: var(--ink-700); opacity: 0.45; }
    .tl-link { font-size: var(--text-xs); font-weight: 500; color: var(--honey-500); text-decoration: none; margin-left: auto; }
    .tl-link:hover { text-decoration: underline; }

    .runner-actions { margin-top: 24px; padding-top: 20px; border-top: 1px solid var(--line-200); display: flex; flex-direction: column; gap: 12px; }
    .progress-form { display: flex; align-items: center; gap: 8px; }
    .progress-form svg { color: var(--agentic-500); flex-shrink: 0; }
    .progress-input { flex: 1; padding: 8px 12px; border: 1px solid var(--line-200); border-radius: var(--radius-sm); font-family: var(--font-body); font-size: var(--text-sm); outline: none; background: var(--color-surface); color: var(--ink-900); transition: border-color var(--transition); }
    .progress-input:focus { border-color: var(--agentic-500); }

    .btn { display: inline-flex; align-items: center; gap: 6px; padding: 10px 20px; border: none; border-radius: var(--radius-md); font-family: var(--font-body); font-size: var(--text-sm); font-weight: 600; cursor: pointer; transition: all var(--transition); }
    .btn-primary { background: var(--agentic-500); color: var(--paper-50); }
    .btn-primary:hover { background: var(--agentic-500); }
    .btn-outline { background: var(--color-surface); border: 1px solid var(--line-200); color: var(--ink-900); }
    .btn-outline:hover { border-color: var(--agentic-500); }
    .btn-sm { padding: 6px 14px; font-size: var(--text-xs); }
  `]
})
export class AtelierRunnerComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);
  private router = inject(Router);
  private toast = inject(ToastService);

  atelier?: any;
  progressMsg = '';
  error = signal<string | null>(null);
  private sub?: Subscription;
  private id = '';

  iconFor = iconFor;

  ngOnInit() {
    this.id = this.route.snapshot.paramMap.get('id')!;
    this.sub = timer(0, 3000).pipe(
      switchMap(() => this.http.get<any>('/api/smart-tools/ateliers/' + this.id).pipe(
        catchError(() => of(null)),
      )),
    ).subscribe(a => {
      if (a === null) {
        this.error.set('Atelier introuvable ou erreur de chargement.');
        this.sub?.unsubscribe();
        return;
      }
      this.atelier = a;
    });
  }

  ngOnDestroy() { this.sub?.unsubscribe(); }

  reportProgress(id: string) {
    if (!this.progressMsg.trim()) return;
    this.http.post('/api/smart-tools/ateliers/' + id + '/progress', { progression: this.progressMsg }).subscribe({
      next: () => { this.toast.success('Progression signalée.'); this.progressMsg = ''; },
      error: () => this.toast.error('Erreur.'),
    });
  }

  finalize(id: string) {
    this.http.post('/api/smart-tools/ateliers/' + id + '/finalize', {}).subscribe({
      next: () => { this.toast.success('Atelier finalisé.'); this.router.navigate(['/smart-tools']); },
      error: () => this.toast.error('Erreur.'),
    });
  }
}
