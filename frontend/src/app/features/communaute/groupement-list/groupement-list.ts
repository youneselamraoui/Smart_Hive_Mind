import { Component, OnInit, inject, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../../core/toast.service';

function hashStr(s: string): number {
  let h = 0; for (let i = 0; i < s.length; i++) { h = ((h << 5) - h) + s.charCodeAt(i); h |= 0; } return Math.abs(h);
}

const PATTERNS = [
  `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120"><path d="M60 2l51.96 30v60L60 122 8.04 92V32L60 2z" fill="none" stroke="currentColor" stroke-width="0.5" opacity="0.15"/><path d="M60 12l43.3 25v50L60 112 16.7 87V37L60 12z" fill="none" stroke="currentColor" stroke-width="0.5" opacity="0.1"/></svg>`,
  `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120"><line x1="0" y1="0" x2="120" y2="120" stroke="currentColor" stroke-width="0.5" opacity="0.12"/><line x1="30" y1="0" x2="120" y2="90" stroke="currentColor" stroke-width="0.5" opacity="0.12"/><line x1="0" y1="30" x2="90" y2="120" stroke="currentColor" stroke-width="0.5" opacity="0.12"/><line x1="60" y1="0" x2="120" y2="60" stroke="currentColor" stroke-width="0.5" opacity="0.12"/><line x1="0" y1="60" x2="60" y2="120" stroke="currentColor" stroke-width="0.5" opacity="0.12"/></svg>`,
  `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120"><circle cx="20" cy="20" r="3" fill="currentColor" opacity="0.12"/><circle cx="60" cy="20" r="3" fill="currentColor" opacity="0.12"/><circle cx="100" cy="20" r="3" fill="currentColor" opacity="0.12"/><circle cx="40" cy="60" r="3" fill="currentColor" opacity="0.12"/><circle cx="80" cy="60" r="3" fill="currentColor" opacity="0.12"/><circle cx="120" cy="60" r="3" fill="currentColor" opacity="0.12"/><circle cx="20" cy="100" r="3" fill="currentColor" opacity="0.12"/><circle cx="60" cy="100" r="3" fill="currentColor" opacity="0.12"/><circle cx="100" cy="100" r="3" fill="currentColor" opacity="0.12"/><circle cx="0" cy="60" r="3" fill="currentColor" opacity="0.12"/><circle cx="60" cy="140" r="3" fill="currentColor" opacity="0.12"/><circle cx="60" cy="-20" r="3" fill="currentColor" opacity="0.12"/></svg>`,
  `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120"><circle cx="60" cy="60" r="50" fill="none" stroke="currentColor" stroke-width="0.5" opacity="0.12"/><circle cx="60" cy="60" r="35" fill="none" stroke="currentColor" stroke-width="0.5" opacity="0.1"/><circle cx="60" cy="60" r="20" fill="none" stroke="currentColor" stroke-width="0.5" opacity="0.08"/></svg>`,
  `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120"><path d="M0 40 Q30 0 60 40 Q90 80 120 40" fill="none" stroke="currentColor" stroke-width="0.5" opacity="0.12"/><path d="M0 70 Q30 30 60 70 Q90 110 120 70" fill="none" stroke="currentColor" stroke-width="0.5" opacity="0.1"/><path d="M0 100 Q30 60 60 100 Q90 140 120 100" fill="none" stroke="currentColor" stroke-width="0.5" opacity="0.08"/></svg>`,
];

function patternFor(name: string): string {
  return PATTERNS[hashStr(name) % PATTERNS.length];
}

@Component({
  selector: 'app-groupement-list',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="page">
      <div class="page-head">
        <div>
          <h1>Groupements</h1>
          <p>Groupes thématiques de la communauté</p>
        </div>
        <button class="btn btn-primary" (click)="showForm.set(!showForm())">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          {{ showForm() ? 'Annuler' : 'Nouveau groupement' }}
        </button>
      </div>

      @if (showForm()) {
        <div class="create-card">
          <h3>Créer un groupement</h3>
          <div class="create-grid">
            <div class="field">
              <label>Nom <span class="req">*</span></label>
              <input class="input" [(ngModel)]="newNom" placeholder="Nom du groupement" maxlength="100" />
            </div>
            <div class="field">
              <label>Thème</label>
              <input class="input" [(ngModel)]="newTheme" placeholder="Thème (optionnel)" />
            </div>
            <div class="field full">
              <label>Description</label>
              <textarea class="input input--ta" [(ngModel)]="newDescription" rows="3" placeholder="Description…"></textarea>
            </div>
            <div class="field full">
              <label>Règles d'adhésion</label>
              <textarea class="input input--ta" [(ngModel)]="newRegles" rows="2" placeholder="Règles éventuelles…"></textarea>
            </div>
          </div>
          <div class="create-actions">
            <button class="btn btn-outline" (click)="showForm.set(false); resetForm()">Annuler</button>
            <button class="btn btn-primary" [disabled]="newNom.trim().length < 3 || submitting()" (click)="creer()">{{ submitting() ? 'Création…' : 'Créer le groupement' }}</button>
          </div>
        </div>
      }

      @if (loading()) {
        <div class="skeleton-grid">@for (i of [1,2,3]; track i) { <div class="skel-card"><div class="skel-line w-70"></div><div class="skel-line w-40"></div></div> }</div>
      } @else {
        <div class="group-grid">
          @for (g of groupements(); track g._id) {
            <div class="group-card">
              <div class="group-bg" [innerHTML]="patternFor(g.nom)"></div>
              <div class="group-body">
                <h3>{{ g.nom }}</h3>
                @if (g.theme) { <span class="group-theme">{{ g.theme }}</span> }
                @if (g.description) { <p>{{ g.description }}</p> }
                <div class="group-stats">
                  <span class="group-members">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                    {{ g.nbMembres || 0 }} membre{{ g.nbMembres > 1 ? 's' : '' }}
                  </span>
                </div>
                @if (estMembre(g)) {
                  <button class="btn btn-outline btn-sm" disabled>Déjà membre</button>
                } @else {
                  <button class="btn btn-outline btn-sm" (click)="rejoindre(g)">Rejoindre</button>
                }
              </div>
            </div>
          }
        </div>
        @if (groupements().length === 0) {
          <div class="empty">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--honey-500)" stroke-width="1" opacity="0.3"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            <h3>Aucun groupement</h3>
            <p>Créez le premier groupement thématique.</p>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    :host { display: block; }
    .page { position: relative; }
    .page-head { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 28px; flex-wrap: wrap; }
    .page-head h1 { font-size: var(--text-2xl); margin: 0 0 2px; }
    .page-head p { margin: 0; font-size: var(--text-sm); color: var(--ink-700); }

    .btn { display: inline-flex; align-items: center; gap: 8px; padding: 10px 20px; border: none; border-radius: var(--radius-md); font-family: var(--font-body); font-size: var(--text-sm); font-weight: 600; cursor: pointer; transition: all var(--transition); text-decoration: none; }
    .btn:disabled { opacity: 0.4; cursor: not-allowed; }
    .btn-primary { background: var(--honey-500); color: var(--ink-900); }
    .btn-primary:hover:not(:disabled) { background: var(--honey-600); }
    .btn-outline { background: var(--color-surface); border: 1px solid var(--line-200); color: var(--ink-900); }
    .btn-outline:hover { border-color: var(--honey-500); }
    .btn-sm { padding: 6px 14px; font-size: var(--text-xs); }

    .create-card { background: var(--color-surface); border: 1px solid var(--honey-500); border-radius: var(--radius-md); padding: 20px; margin-bottom: 24px; }
    .create-card h3 { font-size: var(--text-base); margin: 0 0 16px; }
    .create-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 16px; }
    .field { display: flex; flex-direction: column; gap: 4px; }
    .field.full { grid-column: 1 / -1; }
    .field label { font-size: var(--text-xs); font-weight: 600; }
    .req { color: var(--alert-500); }
    .input { padding: 8px 12px; border: 1px solid var(--line-200); border-radius: var(--radius-sm); font-family: var(--font-body); font-size: var(--text-sm); outline: none; background: var(--color-surface); color: var(--ink-900); transition: border-color var(--transition); }
    .input:focus { border-color: var(--honey-500); }
    .input--ta { resize: vertical; }
    .create-actions { display: flex; gap: 10px; justify-content: flex-end; }
    @media (max-width: 600px) { .create-grid { grid-template-columns: 1fr; } }

    .skeleton-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }
    .skel-card { background: var(--color-surface); border: 1px solid var(--line-200); border-radius: var(--radius-md); padding: 20px; }
    .skel-line { height: 12px; border-radius: 4px; background: var(--line-200); margin-bottom: 10px; animation: sh 1.5s infinite; }
    .w-70 { width: 70%; } .w-40 { width: 40%; }
    @keyframes sh { 0%{opacity:0.5} 50%{opacity:1} 100%{opacity:0.5} }

    .empty { display: flex; flex-direction: column; align-items: center; text-align: center; padding: 60px 24px; }
    .empty h3 { font-size: var(--text-lg); margin: 12px 0 4px; }
    .empty p { font-size: var(--text-sm); color: var(--ink-700); margin: 0; }

    .group-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; }

    .group-card { position: relative; background: var(--color-surface); border: 1px solid var(--line-200); border-radius: var(--radius-md); overflow: hidden; transition: border-color var(--transition); }
    .group-card:hover { border-color: var(--honey-500); }
    .group-bg { position: absolute; top: 0; right: 0; width: 120px; height: 120px; color: var(--ink-900); pointer-events: none; }
    .group-body { position: relative; padding: 20px; display: flex; flex-direction: column; gap: 8px; }
    .group-body h3 { font-size: var(--text-base); margin: 0; }
    .group-theme { font-size: var(--text-xs); font-weight: 500; padding: 2px 8px; border-radius: 999px; background: rgba(217,160,43,0.1); color: var(--honey-600); width: fit-content; }
    .group-body p { font-size: var(--text-sm); color: var(--ink-700); margin: 0; line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    .group-stats { padding-top: 6px; }
    .group-members { font-size: var(--text-xs); color: var(--ink-700); display: inline-flex; align-items: center; gap: 4px; }

    @media (max-width: 768px) { .group-grid { grid-template-columns: 1fr; } }
  `]
})
export class GroupementListComponent implements OnInit {
  private http = inject(HttpClient);
  private toast = inject(ToastService);
  loading = signal(true);
  groupements = signal<any[]>([]);
  showForm = signal(false);
  submitting = signal(false);
  newNom = ''; newTheme = ''; newDescription = ''; newRegles = '';
  membreId = localStorage.getItem('membreId') || '';

  patternFor = patternFor;

  ngOnInit() { this.load(); }

  estMembre(g: any): boolean {
    return g.membres?.some((m: any) => (m._id || m) === this.membreId) || false;
  }

  private load() {
    this.loading.set(true);
    this.http.get<any[]>('/api/communaute/groupements').subscribe({
      next: list => this.groupements.set(list),
      error: () => this.toast.error('Erreur chargement'),
      complete: () => this.loading.set(false),
    });
  }

  rejoindre(g: any) {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders(token ? { Authorization: 'Bearer ' + token } : {});
    this.http.post<any>('/api/communaute/groupements/join', { groupementId: g._id }, { headers }).subscribe({
      next: () => { g.nbMembres = (g.nbMembres || 0) + 1; this.toast.success('Vous avez rejoint "' + g.nom + '".'); },
      error: err => this.toast.error(err.error?.error || 'Erreur.'),
    });
  }

  creer() {
    if (this.newNom.trim().length < 3) return;
    this.submitting.set(true);
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders(token ? { Authorization: 'Bearer ' + token } : {});
    this.http.post<any>('/api/communaute/groupements', {
      nom: this.newNom.trim(), theme: this.newTheme.trim(), description: this.newDescription.trim(), reglesAdhesion: this.newRegles.trim(),
    }, { headers }).subscribe({
      next: g => {
        g.nbMembres = 0;
        this.groupements.update(list => [g, ...list]);
        this.showForm.set(false); this.resetForm(); this.submitting.set(false);
        this.toast.success('Groupement créé.');
      },
      error: err => { this.submitting.set(false); this.toast.error(err.error?.error || 'Erreur création.'); },
    });
  }

  resetForm() { this.newNom = ''; this.newTheme = ''; this.newDescription = ''; this.newRegles = ''; }
}
