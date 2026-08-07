import { Component, OnInit, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { RatingModule } from 'primeng/rating';
import { SkeletonModule } from 'primeng/skeleton';
import { RouterLink } from '@angular/router';
import { ToastService } from '../../core/toast.service';
import { ContentCardComponent } from '../../core/content-card.component';
import { EmptyStateComponent } from '../../core/empty-state.component';

const FORMAT_ICONS: Record<string, string> = {
  video: 'pi pi-video',
  texte: 'pi pi-file',
  hybride: 'pi pi-circle',
};

const FORMAT_LABELS: Record<string, string> = {
  video: 'Vidéo',
  texte: 'Texte',
  hybride: 'Hybride',
};

@Component({
  selector: 'app-formation-list',
  standalone: true,
  imports: [FormsModule, ContentCardComponent, EmptyStateComponent, RatingModule, SkeletonModule, RouterLink],
  template: `
    <div class="page">
      <div class="page-head"><div><h1>Formations</h1><p>Développez vos compétences</p></div><a class="new-btn" routerLink="/app/skills/formations/creer">Créer une formation</a></div>

      <div class="search-bar">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input [value]="searchTerm()" (input)="searchTerm.set($any($event.target).value)" placeholder="Rechercher une formation…" />
      </div>

      @if (loading()) {
        <div class="skel-grid">
          @for (i of [1,2,3,4]; track i) {
            <div class="skel-card">
              <p-skeleton width="100%" height="120px" borderRadius="var(--radius-sm)" />
              <div class="skel-body">
                <p-skeleton width="70%" height="1rem" />
                <p-skeleton width="40%" height="0.8rem" />
                <p-skeleton width="50%" height="0.8rem" />
              </div>
            </div>
          }
        </div>
      } @else { @if (filtered.length === 0) {
        <app-empty-state
          icon="pi pi-book"
          title="Aucune formation"
          [description]="searchTerm() ? 'Aucune formation ne correspond à votre recherche.' : 'Les formations apparaîtront ici une fois publiées.'"
        />
      } @else {
        <div class="grid">
          @for (f of filtered; track f._id) {
            <div class="card-wrap">
              <app-content-card
                [title]="f.titre"
                [category]="formatLabel(f.format)"
                [categoryIcon]="formatIcon(f.format)"
                [authorName]="(f.auteurId?.prenom ?? '') + ' ' + (f.auteurId?.nom ?? '')"
                [metadata]="formationMeta(f)"
                [rating]="f.certificationCommunautaire"
                [showRatingValue]="true"
                actionLabel="Noter"
                actionIcon="pi pi-star"
                (actionClick)="toggleNoter(f._id)"
              />
              @if (noterOpen() === f._id) {
                <div class="noter-form">
                  <div class="noter-stars">
                    <p-rating [(ngModel)]="noterNote" [stars]="5" />
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
    .page-head { margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; }
    .page-head h1 { font-size: var(--text-2xl); margin: 0 0 2px; }
    .page-head p { margin: 0; font-size: var(--text-sm); color: var(--ink-700); }
    .new-btn { padding: 8px 16px; border-radius: var(--radius-sm); background: var(--honey-500); color: var(--ink-900); font-size: var(--text-sm); font-weight: 600; text-decoration: none; white-space: nowrap; transition: filter var(--transition); }
    .new-btn:hover { filter: brightness(1.08); }

    .search-bar { display: flex; align-items: center; gap: 8px; margin-bottom: 20px; padding: 8px 14px; background: var(--color-surface); border: 1px solid var(--line-200); border-radius: var(--radius-md); transition: border-color var(--transition); }
    .search-bar:focus-within { border-color: var(--honey-500); }
    .search-bar svg { flex-shrink: 0; color: var(--ink-700); }
    .search-bar input { flex: 1; border: none; background: none; font-size: var(--text-sm); font-family: var(--font-body); outline: none; color: var(--ink-900); }

    .skel-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; }
    .skel-card { background: var(--color-surface); border: 1px solid var(--line-200); border-radius: var(--radius-md); overflow: hidden; }
    .skel-body { padding: 16px 18px; display: flex; flex-direction: column; gap: 10px; }

    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; }
    .card-wrap { display: flex; flex-direction: column; gap: 0; }
    .card-wrap app-content-card { display: flex; }

    .noter-form { margin-top: 0; padding: 14px 18px; border: 1px solid var(--line-200); border-top: none; border-radius: 0 0 var(--radius-md) var(--radius-md); background: var(--color-surface); display: flex; flex-direction: column; gap: 10px; }
    .noter-stars { display: flex; gap: 4px; }
    .noter-stars :host ::ng-deep .p-rating-icon-active { color: var(--honey-500); }
    .noter-stars :host ::ng-deep .p-rating-item { cursor: pointer; }
    .input { padding: 8px 12px; border: 1px solid var(--line-200); border-radius: var(--radius-sm); font-family: var(--font-body); font-size: var(--text-sm); outline: none; background: var(--color-surface); color: var(--ink-900); transition: border-color var(--transition); }
    .input:focus { border-color: var(--honey-500); }
    .input--ta { resize: vertical; min-height: 50px; }
    .noter-actions { display: flex; gap: 8px; justify-content: flex-end; }
    .btn { display: inline-flex; align-items: center; gap: 6px; border-radius: var(--radius-sm); font-family: var(--font-body); font-size: var(--text-sm); font-weight: 600; cursor: pointer; transition: all var(--transition); }
    .btn-xs { padding: 4px 12px; font-size: var(--text-xs); }
    .btn-primary { background: var(--honey-500); color: var(--ink-900); border: none; }
    .btn-primary:hover:not(:disabled) { background: var(--honey-600); }
    .btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }
    .btn-outline { background: var(--color-surface); border: 1px solid var(--line-200); color: var(--ink-900); text-decoration: none; }
    .btn-outline:hover { border-color: var(--honey-500); }

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
  formatLabel(t: string) { return FORMAT_LABELS[t] || t; }

  formationMeta(f: any) {
    const meta: { icon?: string; label: string; value: string }[] = [];
    if (f.duree) meta.push({ icon: 'pi pi-clock', label: 'Durée', value: f.duree });
    return meta;
  }

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
