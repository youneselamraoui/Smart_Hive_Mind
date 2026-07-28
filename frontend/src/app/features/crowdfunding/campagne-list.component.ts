import { Component, OnInit, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { PaginatorComponent } from '../../core/paginator.component';

interface Campagne {
  _id: string;
  titre: string;
  description: string;
  objectif: number;
  collecte: number;
  dateFin: string;
  statut: string;
}

@Component({
  selector: 'app-campagne-list',
  standalone: true,
  imports: [CommonModule, RouterLink, PaginatorComponent],
  template: `
    <div class="section">
      <div class="page-header">
        <h1>Crowdfunding</h1>
        <a class="btn-outline-sm" routerLink="/crowdfunding/new">Nouvelle campagne</a>
      </div>

      @if (loading()) {
        <div class="skeleton-list">
          @for (i of [1,2,3]; track i) {
            <div class="skeleton-card"><div class="skeleton-line w-60"></div><div class="skeleton-line w-80"></div><div class="skeleton-line w-40"></div></div>
          }
        </div>
      } @else if (error()) {
        <div class="error-state">
          <p>{{ error() }}</p>
          <button class="btn-retry" (click)="load()">Réessayer</button>
        </div>
      } @else if (items.length === 0) {
        <div class="empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.3"><circle cx="12" cy="12" r="10"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 18V6"/></svg>
          <h3>Aucune campagne</h3>
          <p>Les campagnes de financement apparaîtront ici.</p>
        </div>
      } @else {
        <div class="campagne-grid">
          @for (c of paginatedItems; track c._id) {
            <a class="campagne-card" [routerLink]="'/crowdfunding/' + c._id">
              <h3>{{ c.titre }}</h3>
              <p class="desc">{{ c.description }}</p>
              <div class="progress-bar">
                <div class="progress-fill" [style.width.%]="c.objectif > 0 ? (c.collecte / c.objectif * 100) : 0"></div>
              </div>
              <div class="stats">
                <span>{{ c.collecte | number }} / {{ c.objectif | number }} FCFA</span>
                <span class="statut-badge" [class]="'statut-' + c.statut">{{ c.statut }}</span>
              </div>
            </a>
          }
        </div>
        <app-paginator [currentPage]="currentPage()" [totalPages]="totalPages" (pageChange)="currentPage.set($event)" />
      }
    </div>
  `,
  styles: [`
    :host { display: block; }
    .page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 28px; }
    .page-header h1 { font-size: 1.5rem; margin: 0; }
    .btn-outline-sm { padding: 6px 14px; border: 1.5px solid var(--color-border); border-radius: var(--radius-sm); font-size: 0.78rem; color: var(--color-text-secondary); text-decoration: none; }

    .campagne-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; }
    .campagne-card { display: block; background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 20px; text-decoration: none; color: inherit; transition: box-shadow .2s; }
    .campagne-card:hover { box-shadow: var(--shadow-card); }
    .campagne-card h3 { margin: 0 0 8px; font-size: 1.05rem; }
    .campagne-card .desc { font-size: 0.85rem; color: var(--color-text-secondary); margin: 0 0 16px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    .progress-bar { height: 8px; background: var(--color-border); border-radius: 999px; overflow: hidden; margin-bottom: 10px; }
    .progress-fill { height: 100%; background: var(--verify-500); border-radius: 999px; transition: width .4s; }
    .stats { display: flex; align-items: center; justify-content: space-between; font-size: 0.82rem; }
    .statut-badge { font-size: 0.7rem; font-weight: 700; text-transform: uppercase; padding: 2px 10px; border-radius: 999px; }
    .statut-active { background: rgba(217,160,43,0.1); color: var(--honey-600); }
    .statut-termine { background: rgba(31,158,109,0.1); color: var(--verify-500); }
    .statut-annule { background: rgba(196,67,46,0.1); color: var(--alert-500); }

    .skeleton-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; }
    .skeleton-card { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 20px; display: flex; flex-direction: column; gap: 10px; }
    .skeleton-line { height: 14px; background: var(--color-border); border-radius: 4px; }
    .skeleton-line.w-60 { width: 60%; }
    .skeleton-line.w-80 { width: 80%; }
    .skeleton-line.w-40 { width: 40%; }

    .empty-state { text-align: center; padding: 60px 20px; color: var(--color-text-secondary); }
    .empty-state h3 { margin: 12px 0 4px; }
    .empty-state p { margin: 0; font-size: 0.88rem; }

    .error-state { text-align: center; padding: 40px; color: var(--alert-500); }
    .btn-retry { padding: 8px 20px; border: 1.5px solid var(--color-border); border-radius: var(--radius-sm); background: none; cursor: pointer; margin-top: 12px; }

    @media (max-width: 640px) { .campagne-grid { grid-template-columns: 1fr; } }
  `]
})
export class CampagneListComponent implements OnInit {
  private http = inject(HttpClient);

  items: Campagne[] = [];
  loading = signal(true);
  error = signal('');

  pageSize = 10;
  currentPage = signal(1);

  get paginatedItems() {
    const start = (this.currentPage() - 1) * this.pageSize;
    return this.items.slice(start, start + this.pageSize);
  }

  get totalPages() {
    return Math.ceil(this.items.length / this.pageSize) || 1;
  }

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.error.set('');
    this.http.get<Campagne[]>('/api/entrepreneuriat/campagnes').subscribe({
      next: list => { this.items = list; this.loading.set(false); },
      error: () => { this.error.set('Erreur de chargement.'); this.loading.set(false); },
    });
  }
}
