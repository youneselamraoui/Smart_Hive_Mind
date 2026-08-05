import { Component, OnInit, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';

const CATEGORY_LABELS: Record<string, string> = {
  ai: 'IA',
  devsecops: 'DevSecOps',
  it: 'IT',
};

@Component({
  selector: 'app-outil-list',
  standalone: true,
  template: `
    <div class="page">
      <div class="page-head">
        <div>
          <h1>Outils</h1>
          <p>Outils disponibles dans les ateliers Smart Tools</p>
        </div>
      </div>

      <div class="search-bar">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input [value]="searchTerm()" (input)="searchTerm.set($any($event.target).value)" placeholder="Rechercher un outil…" />
        @if (searchTerm()) {
          <button class="search-clear" (click)="searchTerm.set('')"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
        }
      </div>

      @if (loading()) {
        <div class="skel-grid">@for (i of [1,2,3]; track i) { <div class="skel-card"><div class="skel-line w-70"></div><div class="skel-line w-50"></div><div class="skel-line w-90"></div></div> }</div>
      } @else { @if (filteredItems.length === 0) {
        <div class="empty">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--honey-500)" stroke-width="1" opacity="0.3"><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M3 9h18M9 21V9"/></svg>
          <h3>{{ searchTerm() ? 'Aucun résultat' : 'Aucun outil disponible' }}</h3>
          <p>{{ searchTerm() ? 'Essayez un autre terme.' : 'Les outils seront ajoutés par les administrateurs.' }}</p>
        </div>
      } @else {
        <div class="grid">
          @for (o of filteredItems; track o._id) {
            <div class="tool-card">
              <div class="tool-top">
                <h3>{{ o.nom }}</h3>
                <span class="tool-cat" [class]="'cat-' + o.categorie">{{ categoryLabel(o.categorie) }}</span>
              </div>
              <p class="tool-fonction">{{ o.fonction || 'Aucune description de fonction.' }}</p>
              <div class="tool-footer">
                <span class="tool-cost">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v10M9.5 9.5c0-.83 1.12-1.5 2.5-1.5s2.5.67 2.5 1.5S14.38 11 12 11s-2.5.67-2.5 1.5S10.62 14 12 14s2.5-.67 2.5-1.5"/></svg>
                  {{ o.coutUsage ?? 0 }} MAD
                </span>
              </div>
            </div>
          }
        </div>
      }}
    </div>
  `,
  styles: [`
    :host { display: block; }
    .page { position: relative; }
    .page-head { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 24px; flex-wrap: wrap; }
    .page-head h1 { font-size: var(--text-2xl); margin: 0 0 2px; }
    .page-head p { margin: 0; font-size: var(--text-sm); color: var(--ink-700); }

    .search-bar { display: flex; align-items: center; gap: 8px; margin-bottom: 20px; padding: 8px 14px; background: var(--color-surface); border: 1px solid var(--line-200); border-radius: var(--radius-md); transition: border-color var(--transition); }
    .search-bar:focus-within { border-color: var(--honey-500); }
    .search-bar svg { flex-shrink: 0; color: var(--ink-700); }
    .search-bar input { flex: 1; border: none; background: none; font-size: var(--text-sm); font-family: var(--font-body); outline: none; color: var(--ink-900); }
    .search-clear { background: none; border: none; cursor: pointer; color: var(--ink-700); padding: 2px; border-radius: 50%; display: flex; }
    .search-clear:hover { background: var(--line-200); }

    .skel-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; }
    .skel-card { background: var(--color-surface); border: 1px solid var(--line-200); border-radius: var(--radius-md); padding: 20px; }
    .skel-line { height: 12px; border-radius: 4px; background: var(--line-200); margin-bottom: 10px; animation: sh 1.5s infinite; }
    .w-70 { width: 70%; } .w-50 { width: 50%; } .w-90 { width: 90%; }
    @keyframes sh { 0%{opacity:0.5} 50%{opacity:1} 100%{opacity:0.5} }

    .empty { display: flex; flex-direction: column; align-items: center; text-align: center; padding: 60px 24px; }
    .empty h3 { font-size: var(--text-lg); margin: 12px 0 4px; }
    .empty p { font-size: var(--text-sm); color: var(--ink-700); margin: 0; }

    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; }

    .tool-card { background: var(--color-surface); border: 1px solid var(--line-200); border-radius: var(--radius-md); padding: 20px; display: flex; flex-direction: column; gap: 10px; transition: border-color var(--transition); }
    .tool-card:hover { border-color: var(--honey-500); }

    .tool-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; }
    .tool-top h3 { font-size: var(--text-base); margin: 0; }
    .tool-cat { font-size: var(--text-xs); font-weight: 500; padding: 2px 8px; border-radius: 999px; white-space: nowrap; }
    .cat-ai { background: rgba(91,79,224,0.08); color: var(--agentic-500); }
    .cat-devsecops { background: rgba(220,38,38,0.08); color: #dc2626; }
    .cat-it { background: rgba(5,150,105,0.08); color: #059669; }

    .tool-fonction { margin: 0; font-size: var(--text-sm); color: var(--ink-700); flex: 1; }

    .tool-footer { display: flex; justify-content: space-between; align-items: center; font-size: var(--text-xs); padding-top: 8px; border-top: 1px solid var(--line-200); }
    .tool-cost { display: inline-flex; align-items: center; gap: 5px; color: var(--ink-700); font-family: var(--font-mono); }

    @media (max-width: 768px) { .grid { grid-template-columns: 1fr; } }
  `]
})
export class OutilListComponent implements OnInit {
  private http = inject(HttpClient);
  outils: any[] = [];
  loading = signal(true);
  searchTerm = signal('');

  get filteredItems() {
    const q = this.searchTerm().toLowerCase();
    if (!q) return this.outils;
    return this.outils.filter(o =>
      o.nom?.toLowerCase().includes(q) ||
      o.fonction?.toLowerCase().includes(q) ||
      this.categoryLabel(o.categorie).toLowerCase().includes(q),
    );
  }

  categoryLabel(categorie: string): string {
    return CATEGORY_LABELS[categorie] || categorie;
  }

  ngOnInit() {
    this.http.get<any[]>('/api/outils').subscribe({
      next: list => this.outils = list,
      error: () => this.outils = [],
      complete: () => this.loading.set(false),
    });
  }
}
