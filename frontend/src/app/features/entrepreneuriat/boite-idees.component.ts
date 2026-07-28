import { Component, OnInit, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../core/toast.service';

@Component({
  selector: 'app-boite-idees',
  standalone: true,
  imports: [DatePipe, FormsModule],
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

    @media (max-width: 768px) { .mur { grid-template-columns: 1fr; } }
  `]
})
export class BoiteIdeesComponent implements OnInit {
  private http = inject(HttpClient);
  private toast = inject(ToastService);
  idees: any[] = [];
  membreId = localStorage.getItem('membreId') || '';
  loading = signal(true);
  searchTerm = signal('');
  showForm = signal(false);
  submitting = signal(false);
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
      next: () => { const i = this.idees.find(x => x._id === ideeId); if (i) i.statut = 'promue'; this.toast.success('Idée promue en projet.'); },
      error: () => this.toast.error('Erreur.'),
    });
  }
}
