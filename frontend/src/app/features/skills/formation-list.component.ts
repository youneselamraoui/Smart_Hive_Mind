import { Component, OnInit, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../core/toast.service';

const FORMAT_ICONS: Record<string, string> = {
  video: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><rect x="2" y="6" width="20" height="12" rx="2"/><polygon points="10 9 16 12 10 15 10 9"/></svg>`,
  texte: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>`,
  hybride: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="5" cy="12" r="3"/><circle cx="19" cy="12" r="3"/><line x1="8" y1="12" x2="16" y2="12"/></svg>`,
};

function starSvg(filled: boolean): string {
  const fill = filled ? 'var(--honey-500)' : 'none';
  return `<svg width="14" height="14" viewBox="0 0 24 24" fill="${fill}" stroke="var(--honey-500)" stroke-width="1.5">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>`;
}

@Component({
  selector: 'app-formation-list',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="page">
      <div class="page-head"><div><h1>Formations</h1><p>Développez vos compétences</p></div></div>

      <div class="search-bar">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input [value]="searchTerm()" (input)="searchTerm.set($any($event.target).value)" placeholder="Rechercher une formation…" />
      </div>

      @if (loading()) {
        <div class="skel-grid">@for (i of [1,2,3,4]; track i) { <div class="skel-card"><div class="skel-line w-70"></div><div class="skel-line w-40"></div></div> }</div>
      } @else { @if (filtered.length === 0) {
        <div class="empty"><h3>Aucune formation</h3><p>Les formations apparaîtront ici une fois publiées.</p></div>
      } @else {
        <div class="grid">
          @for (f of filtered; track f._id) {
            <div class="card">
              <div class="card-type-icon" [class]="'fmt--' + f.format" [innerHTML]="formatIcon(f.format)"></div>
              <h3>{{ f.titre }}</h3>
              <p class="author">Par {{ f.auteurId?.prenom }} {{ f.auteurId?.nom }}</p>
              <div class="stars">
                @for (s of [1,2,3,4,5]; track s) {
                  <span class="star" [innerHTML]="star(s <= f.certificationCommunautaire)"></span>
                }
                <span class="star-val">{{ f.certificationCommunautaire }}</span>
              </div>
              <div class="card-foot">
                <button class="btn btn-outline btn-sm" (click)="toggleNoter(f._id)">
                  Noter
                </button>
              </div>
              @if (noterOpen() === f._id) {
                <div class="noter-form">
                  <div class="noter-stars">
                    @for (s of [1,2,3,4,5]; track s) {
                       <button class="star-btn" [class.filled]="noterNote() >= s" (click)="noterNote.set(s)" [innerHTML]="star(noterNote() >= s)"></button>
                    }
                  </div>
                  <textarea class="input input--ta" [(ngModel)]="noterCommentaire" rows="2" placeholder="Votre commentaire…"></textarea>
                  <div class="noter-actions">
                    <button class="btn btn-outline btn-xs" (click)="noterOpen.set(null)">Annuler</button>
                    <button class="btn btn-primary btn-xs" [disabled]="!noterNote() || noterSending()" (click)="noter(f)">{{ noterSending() ? '…' : 'Envoyer' }}</button>
                  </div>
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
    .page-head { margin-bottom: 20px; }
    .page-head h1 { font-size: var(--text-2xl); margin: 0 0 2px; }
    .page-head p { margin: 0; font-size: var(--text-sm); color: var(--ink-700); }

    .search-bar { display: flex; align-items: center; gap: 8px; margin-bottom: 20px; padding: 8px 14px; background: var(--color-surface); border: 1px solid var(--line-200); border-radius: var(--radius-md); transition: border-color var(--transition); }
    .search-bar:focus-within { border-color: var(--honey-500); }
    .search-bar svg { flex-shrink: 0; color: var(--ink-700); }
    .search-bar input { flex: 1; border: none; background: none; font-size: var(--text-sm); font-family: var(--font-body); outline: none; color: var(--ink-900); }

    .empty { display: flex; flex-direction: column; align-items: center; padding: 60px 24px; }
    .empty h3 { font-size: var(--text-lg); margin: 0 0 4px; }
    .empty p { font-size: var(--text-sm); color: var(--ink-700); margin: 0; }

    .skel-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; }
    .skel-card { background: var(--color-surface); border: 1px solid var(--line-200); border-radius: var(--radius-md); padding: 20px; }
    .skel-line { height: 12px; border-radius: 4px; background: var(--line-200); margin-bottom: 10px; animation: sh 1.5s infinite; }
    .w-70 { width: 70%; } .w-40 { width: 40%; }
    @keyframes sh { 0%{opacity:0.5} 50%{opacity:1} 100%{opacity:0.5} }

    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; }
    .card { display: flex; flex-direction: column; gap: 8px; background: var(--color-surface); border: 1px solid var(--line-200); border-radius: var(--radius-md); padding: 20px; transition: border-color var(--transition); }
    .card:hover { border-color: var(--honey-500); }
    .card h3 { font-size: var(--text-base); margin: 0; }
    .card-type-icon { width: 32px; height: 32px; border-radius: var(--radius-sm); display: flex; align-items: center; justify-content: center; }
    .card-type-icon :deep(svg) { width: 18px; height: 18px; }
    .fmt--video { background: rgba(91,79,224,0.1); color: var(--agentic-500); }
    .fmt--texte { background: rgba(31,158,109,0.1); color: var(--verify-500); }
    .fmt--hybride { background: rgba(217,160,43,0.1); color: var(--honey-600); }
    .author { font-size: var(--text-sm); color: var(--ink-700); margin: 0; }

    .stars { display: flex; align-items: center; gap: 2px; }
    .star { display: flex; }
    .star-val { font-family: var(--font-mono); font-size: var(--text-xs); color: var(--ink-700); margin-left: 6px; }

    .card-foot { margin-top: auto; padding-top: 8px; border-top: 1px solid var(--line-200); }
    .btn { display: inline-flex; align-items: center; gap: 6px; border-radius: var(--radius-sm); font-family: var(--font-body); font-size: var(--text-sm); font-weight: 600; cursor: pointer; transition: all var(--transition); }
    .btn-sm { padding: 6px 14px; }
    .btn-xs { padding: 4px 12px; font-size: var(--text-xs); }
    .btn-primary { background: var(--honey-500); color: var(--ink-900); border: none; }
    .btn-primary:hover:not(:disabled) { background: var(--honey-600); }
    .btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }
    .btn-outline { background: var(--color-surface); border: 1px solid var(--line-200); color: var(--ink-900); text-decoration: none; }
    .btn-outline:hover { border-color: var(--honey-500); }

    .noter-form { margin-top: 8px; padding-top: 10px; border-top: 1px solid var(--line-200); display: flex; flex-direction: column; gap: 8px; }
    .noter-stars { display: flex; gap: 4px; }
    .star-btn { background: none; border: none; cursor: pointer; padding: 2px; color: var(--line-200); transition: color 0.15s; display: flex; }
    .star-btn.filled { color: var(--honey-500); }
    .star-btn:hover { color: var(--honey-500) !important; }
    .input { padding: 8px 12px; border: 1px solid var(--line-200); border-radius: var(--radius-sm); font-family: var(--font-body); font-size: var(--text-sm); outline: none; background: var(--color-surface); color: var(--ink-900); transition: border-color var(--transition); }
    .input:focus { border-color: var(--honey-500); }
    .input--ta { resize: vertical; min-height: 50px; }
    .noter-actions { display: flex; gap: 8px; justify-content: flex-end; }

    @media (max-width: 768px) { .grid, .skel-grid { grid-template-columns: 1fr; } }
  `]
})
export class FormationListComponent implements OnInit {
  private http = inject(HttpClient);
  private toast = inject(ToastService);
  items: any[] = [];
  loading = signal(true);
  searchTerm = signal('');

  noterOpen = signal<string | null>(null);
  noterNote = signal(0);
  noterCommentaire = '';
  noterSending = signal(false);

  get filtered() {
    const q = this.searchTerm().toLowerCase();
    if (!q) return this.items;
    return this.items.filter(f => f.titre.toLowerCase().includes(q) || f.format.toLowerCase().includes(q));
  }

  formatIcon(t: string) { return FORMAT_ICONS[t] || FORMAT_ICONS['texte']; }
  star = starSvg;

  ngOnInit() {
    this.http.get<any[]>('/api/skills/formations').subscribe({
      next: list => this.items = list,
      error: () => this.loading.set(false),
      complete: () => this.loading.set(false),
    });
  }

  toggleNoter(id: string) {
    if (this.noterOpen() === id) { this.noterOpen.set(null); return; }
    this.noterOpen.set(id);
    this.noterNote.set(0);
    this.noterCommentaire = '';
  }

  noter(f: any) {
    if (!this.noterNote()) return;
    this.noterSending.set(true);
    this.http.post('/api/skills/formations/noter', { formationId: f._id, note: this.noterNote(), commentaire: this.noterCommentaire || undefined }).subscribe({
      next: () => { this.toast.success('Note envoyée.'); this.noterOpen.set(null); this.noterSending.set(false); },
      error: () => { this.toast.error('Erreur.'); this.noterSending.set(false); },
    });
  }
}
