import { Component, OnInit, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HexSealComponent } from '../../core/hex-seal.component';
import { ToastService } from '../../core/toast.service';
import { IdeeService } from './idee.service';

@Component({
  selector: 'app-boite-idees',
  standalone: true,
  imports: [DatePipe, FormsModule, HexSealComponent],
  template: `
    <div class="page">
      <div class="page-head">
        <div>
          <h1>Boîte à Idées</h1>
          <p>Soumettez et votez pour les idées innovantes</p>
        </div>
        <button class="btn btn-primary" (click)="showForm.set(!showForm())">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          {{ showForm() ? 'Annuler' : 'Nouvelle idée' }}
        </button>
      </div>

      @if (showForm()) {
        <div class="idee-form">
          <input class="input" [(ngModel)]="newTitre" placeholder="Titre de l'idée" maxlength="200" />
          <textarea class="input input--ta" [(ngModel)]="newDescription" rows="4" placeholder="Description détaillée…"></textarea>
          <div class="form-actions">
            <button class="btn btn-outline" (click)="showForm.set(false); newTitre=''; newDescription=''">Annuler</button>
            <button class="btn btn-primary" [disabled]="!newTitre.trim() || newTitre.trim().length < 3 || !newDescription.trim() || newDescription.trim().length < 10 || submitting()" (click)="createIdee()">
              {{ submitting() ? 'Envoi…' : "Soumettre l'idée" }}
            </button>
          </div>
        </div>
      }

      <div class="search-bar">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input [value]="searchTerm()" (input)="searchTerm.set($any($event.target).value)" placeholder="Rechercher une idée…" />
      </div>

      @if (loading()) {
        <div class="skel-grid">@for (i of [1,2,3,4]; track i) { <div class="skel-card"><div class="skel-line w-70"></div><div class="skel-line w-40"></div></div> }</div>
      } @else { @if (filteredIdees.length === 0) {
        <div class="empty"><h3>Aucune idée</h3><p>Les idées apparaîtront ici une fois soumises.</p></div>
      } @else {
        <div class="mur">
          @for (i of filteredIdees; track i._id) {
            <div class="postit">
              <div class="postit-header">
                <button class="hex-vote" [class.voted]="voted(i)" (click)="vote(i)">
                  <svg viewBox="0 0 60 70" width="44" height="52">
                    <polygon points="30 2 56 18 56 52 30 68 4 52 4 18" fill="none" stroke="var(--line-200)" stroke-width="1.5"/>
                    <polygon points="30 10 48 21 48 49 30 60 12 49 12 21" fill="none" stroke="currentColor" stroke-width="1"
                      [attr.fill]="'var(--honey-500)'" [style.clip-path]="voteClip(i.votes.length)"/>
                    <text x="30" y="38" text-anchor="middle" font-size="14" font-weight="700" fill="var(--ink-900)">{{ i.votes.length }}</text>
                  </svg>
                </button>
                <div class="postit-info">
                  <h3>{{ i.titre }}</h3>
                  <span class="postit-meta">{{ i.auteurId?.prenom }} {{ i.auteurId?.nom }} · {{ i.createdAt | date:'dd MMM' }}</span>
                </div>
                <span class="statut-tag" [class]="'statut--' + i.statut">{{ i.statut === 'promue' ? 'Promue' : 'Soumise' }}</span>
              </div>
              <p>{{ i.description }}</p>
              @if (i.statut !== 'promue') {
                <button class="promote-btn" (click)="promote(i._id)">Promouvoir en projet</button>
              }
              @if ((i.auteurId?._id || i.auteurId) === membreId || currentRole() === 'admin') {
                <div class="idee-proof">
                  <div class="idee-proof-head">
                    <app-hex-seal [status]="sealStatus(i)" [hash]="i.preuve?.txHash" [size]="26"></app-hex-seal>
                    <div>
                      <span class="idee-proof-title">Preuve blockchain</span>
                      <span class="idee-proof-statut" [class]="'statut--' + sealStatus(i)">{{ sealLabel(i) }}</span>
                    </div>
                  </div>
                  @if (isAnchored(i)) {
                    <div class="idee-proof-meta">
                      <span class="idee-proof-hash">{{ i.preuve?.txHash }}</span>
                      <a class="idee-proof-sepolia" [href]="etherscanUrl(i)" target="_blank" rel="noopener noreferrer">Vérifier sur Sepolia</a>
                    </div>
                  }
                  @if (!isAnchored(i)) {
                    <button class="idee-proof-anchor" [disabled]="anchoringId() === i._id" (click)="ancrer(i)">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>
                      {{ anchoringId() === i._id ? 'Ancrage…' : 'Ancrer sur la blockchain' }}
                    </button>
                  }
                  @if (anchorError() && anchoringId() !== i._id) {
                    <div class="idee-proof-error">{{ anchorError() }}</div>
                  }
                </div>
              }
            </div>
          }
        </div>
      }}
    </div>
  `,
  styles: [`
    :host { display: block; }
    .page { position: relative; }
    .page-head { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 20px; flex-wrap: wrap; }
    .page-head h1 { font-size: var(--text-2xl); margin: 0 0 2px; }
    .page-head p { margin: 0; font-size: var(--text-sm); color: var(--ink-700); }

    .btn { display: inline-flex; align-items: center; gap: 8px; padding: 10px 20px; border: none; border-radius: var(--radius-md); font-family: var(--font-body); font-size: var(--text-sm); font-weight: 600; cursor: pointer; transition: all var(--transition); }
    .btn:disabled { opacity: 0.4; cursor: not-allowed; }
    .btn-primary { background: var(--honey-500); color: var(--ink-900); }
    .btn-primary:hover:not(:disabled) { background: var(--honey-600); }
    .btn-outline { background: var(--color-surface); border: 1px solid var(--line-200); color: var(--ink-900); }
    .btn-outline:hover { border-color: var(--ink-700); }

    .idee-form { background: var(--color-surface); border: 1px solid var(--honey-500); border-radius: var(--radius-md); padding: 20px; margin-bottom: 20px; display: flex; flex-direction: column; gap: 12px; }
    .input { padding: 10px 14px; border: 1px solid var(--line-200); border-radius: var(--radius-sm); font-family: var(--font-body); font-size: var(--text-sm); outline: none; background: var(--color-surface); color: var(--ink-900); transition: border-color var(--transition); }
    .input:focus { border-color: var(--honey-500); }
    .input--ta { resize: vertical; min-height: 80px; }
    .form-actions { display: flex; gap: 10px; justify-content: flex-end; }

    .search-bar { display: flex; align-items: center; gap: 8px; margin-bottom: 20px; padding: 8px 14px; background: var(--color-surface); border: 1px solid var(--line-200); border-radius: var(--radius-md); transition: border-color var(--transition); }
    .search-bar:focus-within { border-color: var(--honey-500); }
    .search-bar svg { flex-shrink: 0; color: var(--ink-700); }
    .search-bar input { flex: 1; border: none; background: none; font-size: var(--text-sm); font-family: var(--font-body); outline: none; color: var(--ink-900); }

    .skel-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 16px; }
    .skel-card { background: var(--color-surface); border: 1px solid var(--line-200); border-radius: var(--radius-md); padding: 20px; }
    .skel-line { height: 12px; border-radius: 4px; background: var(--line-200); margin-bottom: 10px; animation: sh 1.5s infinite; }
    .w-70 { width: 70%; } .w-40 { width: 40%; }
    @keyframes sh { 0%{opacity:0.5} 50%{opacity:1} 100%{opacity:0.5} }

    .empty { display: flex; flex-direction: column; align-items: center; padding: 60px 24px; }
    .empty h3 { font-size: var(--text-lg); margin: 0 0 4px; }
    .empty p { font-size: var(--text-sm); color: var(--ink-700); margin: 0; }

    .mur { display: grid; grid-template-columns: repeat(auto-fill, minmax(360px, 1fr)); gap: 16px; }

    .postit { background: var(--color-surface); border: 1px solid var(--line-200); border-radius: var(--radius-md); padding: 20px; display: flex; flex-direction: column; gap: 10px; transition: border-color var(--transition); }
    .postit:hover { border-color: var(--honey-500); }
    .postit h3 { font-size: var(--text-base); margin: 0; }
    .postit p { font-size: var(--text-sm); color: var(--ink-700); margin: 0; line-height: 1.5; }
    .postit-header { display: flex; gap: 12px; align-items: flex-start; }

    .hex-vote { flex-shrink: 0; background: none; border: none; cursor: pointer; padding: 0; line-height: 0; color: var(--ink-700); transition: color var(--transition); }
    .hex-vote:hover { color: var(--honey-500); }
    .hex-vote.voted { color: var(--honey-500); }
    .hex-vote svg { display: block; }

    .postit-info { flex: 1; min-width: 0; }
    .postit-meta { font-size: var(--text-xs); color: var(--ink-700); }

    .statut-tag { font-size: var(--text-xs); font-weight: 600; text-transform: uppercase; padding: 2px 10px; border-radius: 999px; white-space: nowrap; flex-shrink: 0; }
    .statut--promue { background: rgba(31,158,109,0.1); color: var(--verify-500); }
    .statut--soumise { background: rgba(217,160,43,0.1); color: var(--honey-600); }

    .promote-btn { padding: 6px 14px; border: 1px solid var(--line-200); border-radius: var(--radius-sm); background: none; color: var(--ink-900); font-size: var(--text-xs); font-weight: 500; cursor: pointer; width: fit-content; transition: all var(--transition); }
    .promote-btn:hover { border-color: var(--honey-500); color: var(--honey-500); }

    .idee-proof { background: var(--ink-900); color: var(--paper-50); border-radius: var(--radius-md); padding: 12px 14px; display: flex; flex-direction: column; gap: 8px; }
    .idee-proof-head { display: flex; align-items: center; gap: 10px; }
    .idee-proof-title { display: block; font-size: var(--text-xs); font-weight: 600; }
    .idee-proof-statut { display: block; font-size: 0.65rem; font-weight: 500; font-family: var(--font-mono); }
    .statut--valide { color: var(--verify-500); }
    .statut--en_attente { color: var(--honey-500); }
    .statut--echec { color: var(--alert-500); }
    .idee-proof-meta { display: flex; align-items: center; gap: 8px; justify-content: space-between; }
    .idee-proof-hash { font-family: var(--font-mono); font-size: 0.65rem; word-break: break-all; opacity: 0.8; }
    .idee-proof-sepolia { color: var(--honey-500); font-size: var(--text-xs); font-weight: 500; text-decoration: none; white-space: nowrap; transition: opacity var(--transition); }
    .idee-proof-sepolia:hover { opacity: 0.8; text-decoration: underline; }
    .idee-proof-anchor { display: inline-flex; align-items: center; justify-content: center; gap: 6px; background: rgba(246,245,242,0.08); border: 1px solid rgba(246,245,242,0.2); color: var(--paper-50); padding: 6px 12px; border-radius: var(--radius-sm); font-family: var(--font-body); font-size: var(--text-xs); font-weight: 500; cursor: pointer; transition: all var(--transition); }
    .idee-proof-anchor:hover:not(:disabled) { background: rgba(246,245,242,0.15); }
    .idee-proof-anchor:disabled { opacity: 0.45; cursor: not-allowed; }
    .idee-proof-error { font-size: var(--text-xs); color: var(--alert-500); background: rgba(196,67,46,0.08); padding: 6px 10px; border-radius: var(--radius-sm); }

    @media (max-width: 768px) { .mur { grid-template-columns: 1fr; } }
  `]
})
export class BoiteIdeesComponent implements OnInit {
  private http = inject(HttpClient);
  private toast = inject(ToastService);
  private router = inject(Router);
  private ideeService = inject(IdeeService);
  idees: any[] = [];
  membreId = localStorage.getItem('membreId') || '';
  loading = signal(true);
  searchTerm = signal('');
  showForm = signal(false);
  submitting = signal(false);
  currentRole = signal<string | null>(null);
  anchoringId = signal<string | null>(null);
  anchorError = signal<string | null>(null);
  newTitre = '';
  newDescription = '';

  get filteredIdees() {
    const q = this.searchTerm().toLowerCase();
    if (!q) return this.idees;
    return this.idees.filter(i => i.titre?.toLowerCase().includes(q) || i.description?.toLowerCase().includes(q));
  }

  get voted() {
    return (i: any) => i.votes?.includes(this.membreId);
  }

  voteClip(count: number): string {
    if (count <= 0) return 'inset(100% 0 0 0)';
    if (count >= 10) return 'inset(0 0 0 0)';
    return 'inset(' + ((10 - count) / 10 * 100) + '% 0 0 0)';
  }

  ngOnInit() {
    this.loading.set(true);
    this.http.get<any[]>('/api/entrepreneuriat/idees').subscribe({
      next: list => { this.idees = list.sort((a, b) => (b.votes?.length || 0) - (a.votes?.length || 0)); },
      error: () => this.idees = [],
      complete: () => this.loading.set(false),
    });
    this.http.get<{ role: string }>('/api/auth/me').subscribe({
      next: m => this.currentRole.set(m.role),
      error: () => this.currentRole.set(null),
    });
  }

  sealStatus(i: any): 'valide' | 'en_attente' | 'echec' {
    const s = i?.preuve?.statut;
    if (s === 'ancre') return 'valide';
    if (s === 'en_attente') return 'en_attente';
    if (s === 'echec') return 'echec';
    return 'en_attente';
  }

  sealLabel(i: any): string {
    const s = i?.preuve?.statut;
    if (s === 'ancre') return 'Ancrée';
    if (s === 'en_attente') return 'En attente';
    if (s === 'echec') return 'Échec';
    return 'Non soumise';
  }

  isAnchored(i: any): boolean {
    return i?.preuve?.statut === 'ancre';
  }

  etherscanUrl(i: any): string {
    return 'https://sepolia.etherscan.io/tx/' + (i?.preuve?.txHash || '');
  }

  ancrer(i: any) {
    this.anchoringId.set(i._id);
    this.anchorError.set(null);
    this.ideeService.ancrerIdee(i._id).subscribe({
      next: res => {
        i.preuve = res?.preuve;
        i.hashContenu = res?.hashContenu;
        this.anchoringId.set(null);
        this.toast.success('Idée ancrée sur la blockchain.');
      },
      error: e => {
        this.anchoringId.set(null);
        this.anchorError.set(e.error?.error || e.error?.detail || "Échec de l'ancrage blockchain.");
      },
    });
  }

  createIdee() {
    const titre = this.newTitre.trim(), description = this.newDescription.trim();
    if (titre.length < 3 || description.length < 10) return;
    this.submitting.set(true);
    this.http.post<any>('/api/entrepreneuriat/idees', { titre, description }).subscribe({
      next: idee => { this.idees.unshift(idee); this.showForm.set(false); this.newTitre = ''; this.newDescription = ''; this.submitting.set(false); this.toast.success('Idée soumise.'); },
      error: err => { this.submitting.set(false); this.toast.error(err.error?.error || 'Erreur.'); },
    });
  }

  vote(idee: any) {
    if (this.voted(idee)) return;
    this.http.post<any>('/api/entrepreneuriat/idees/vote', { ideeId: idee._id }).subscribe({
      next: () => {
        if (!idee.votes) idee.votes = [];
        if (!idee.votes.includes(this.membreId)) idee.votes.push(this.membreId);
        this.idees.sort((a, b) => (b.votes?.length || 0) - (a.votes?.length || 0));
      },
    });
  }

  promote(ideeId: string) {
    this.http.post<any>('/api/entrepreneuriat/idees/promote', { ideeId }).subscribe({
      next: (res) => {
        const i = this.idees.find(x => x._id === ideeId);
        if (i) i.statut = 'promue';
        this.toast.success('Idée promue en projet.');
        if (res?.projet?.id) {
          this.router.navigate(['/app', 'entrepreneuriat', 'projets', res.projet.id]);
        }
      },
      error: () => this.toast.error('Erreur.'),
    });
  }
}
