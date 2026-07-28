import { Component, OnInit, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-bourse-list',
  standalone: true,
  imports: [DatePipe],
  template: `
    <div class="section">
      <h2>Bourses de Recherche</h2>

      @if (loading()) {
        <div class="skel-grid">@for (i of [1,2,3]; track i) { <div class="skel-card"><div class="skel-line w-70"></div><div class="skel-line w-40"></div></div> }</div>
      } @else { @if (items.length === 0) {
        <div class="empty">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--honey-500)" stroke-width="1" opacity="0.3"><circle cx="12" cy="8" r="5"/><path d="M3 21h18"/><path d="M12 13v8"/></svg>
          <h3>Aucune bourse</h3>
          <p>Les bourses apparaîtront ici une fois publiées.</p>
        </div>
      } @else {
        <div class="grid">
          @for (b of paginatedItems; track b._id) {
            <div class="card">
              <div class="card-head">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="8" r="5"/><path d="M3 21h18"/><path d="M12 13v8"/></svg>
                <div>
                  <h3>{{ b.montant }}</h3>
                  <span class="statut-badge" [class]="'statut--' + b.statut">{{ b.statut }}</span>
                </div>
              </div>
              <div class="meta-row"><span class="ml">Financeur</span><span>{{ b.financeurId?.prenom }} {{ b.financeurId?.nom }}</span></div>
              @if (b.criteres?.length) {
                <div class="criteres">
                  <strong>Critères:</strong>
                  <ul>@for (c of b.criteres; track c) { <li>{{ c }}</li> }</ul>
                </div>
              }
              @if (b.doctorantId) { <div class="meta-row"><span class="ml">Doctorant</span><span>{{ b.doctorantId.prenom }} {{ b.doctorantId.nom }}</span></div> }
              <div class="meta-date">{{ b.createdAt | date:'short' }}</div>
            </div>
          }
        </div>
      }}
    </div>
  `,
  styles: [`
    :host { display: block; }
    .section { position: relative; }
    h2 { font-size: var(--text-lg); margin-bottom: 16px; }

    .skel-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; }
    .skel-card { background: var(--color-surface); border: 1px solid var(--line-200); border-radius: var(--radius-md); padding: 20px; }
    .skel-line { height: 12px; border-radius: 4px; background: var(--line-200); margin-bottom: 10px; animation: sh 1.5s infinite; }
    .w-70 { width: 70%; } .w-40 { width: 40%; }
    @keyframes sh { 0%{opacity:0.5} 50%{opacity:1} 100%{opacity:0.5} }

    .empty { display: flex; flex-direction: column; align-items: center; text-align: center; padding: 60px 24px; }
    .empty h3 { font-size: var(--text-lg); margin: 12px 0 4px; }
    .empty p { font-size: var(--text-sm); color: var(--ink-700); margin: 0; }

    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; }
    .card { background: var(--color-surface); border: 1px solid var(--line-200); border-radius: var(--radius-md); padding: 18px; display: flex; flex-direction: column; gap: 8px; transition: border-color var(--transition); }
    .card:hover { border-color: var(--honey-500); }

    .card-head { display: flex; gap: 12px; align-items: center; margin-bottom: 4px; }
    .card-head svg { flex-shrink: 0; color: var(--honey-500); }
    .card-head h3 { font-family: var(--font-heading); font-size: var(--text-lg); margin: 0; }
    .statut-badge { font-size: var(--text-xs); font-weight: 600; text-transform: uppercase; padding: 2px 10px; border-radius: 999px; }
    .statut--attribuee { background: rgba(31,158,109,0.1); color: var(--verify-500); }
    .statut--cloturee { background: var(--line-200); color: var(--ink-700); }

    .meta-row { display: flex; justify-content: space-between; font-size: var(--text-sm); padding: 3px 0; border-bottom: 1px dashed var(--line-200); }
    .ml { color: var(--ink-700); }
    .criteres { font-size: var(--text-sm); padding: 8px; background: var(--paper-50); border-radius: var(--radius-sm); }
    .criteres ul { margin: 4px 0 0 16px; }
    .meta-date { font-size: var(--text-xs); color: var(--ink-700); }

    @media (max-width: 768px) { .grid { grid-template-columns: 1fr; } }
  `]
})
export class BourseListComponent implements OnInit {
  private http = inject(HttpClient);
  items: any[] = [];
  loading = signal(true);
  pageSize = 10;
  currentPage = signal(1);

  get paginatedItems() {
    const start = (this.currentPage() - 1) * this.pageSize;
    return this.items.slice(start, start + this.pageSize);
  }

  ngOnInit() {
    this.http.get<any[]>('/api/bourses-recherche').subscribe({
      next: list => this.items = list,
      error: () => this.items = [],
      complete: () => this.loading.set(false),
    });
  }
}
