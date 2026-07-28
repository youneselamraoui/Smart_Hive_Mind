import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="page">
      @if (query) { <h1>Résultats pour "{{ query }}"</h1> }
      @else { <h1>Recherche</h1> }

      @if (loading()) {
        <div class="center-state"><div class="sp"></div><p>Recherche en cours…</p></div>
      } @else { @if (!query) {
        <div class="center-state"><p>Effectuez une recherche depuis la barre de navigation.</p></div>
      } @else { @if (total() === 0) {
        <div class="center-state empty">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--honey-500)" stroke-width="1" opacity="0.3" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <p>Aucun résultat pour "{{ query }}"</p>
        </div>
      } @else {
        @if (filteredPublications.length) {
          <section class="group">
            <h2 class="group-title">Publications ({{ filteredPublications.length }})</h2>
            <div class="group-list">
              @for (pub of filteredPublications; track pub._id) {
                <a class="item" [routerLink]="['/publications', pub._id]">
                  <span class="item-title">{{ pub.titre }}</span>
                  @if (pub.description) { <span class="item-desc">{{ pub.description.slice(0,140) }}{{ pub.description.length > 140 ? '…' : '' }}</span> }
                </a>
              }
            </div>
          </section>
        }
        @if (filteredEvenements.length) {
          <section class="group">
            <h2 class="group-title">Événements ({{ filteredEvenements.length }})</h2>
            <div class="group-list">
              @for (evt of filteredEvenements; track evt._id) {
                <a class="item" [routerLink]="['/evenements', evt._id]">
                  <span class="item-title">{{ evt.titre }}</span>
                  @if (evt.description) { <span class="item-desc">{{ evt.description.slice(0,140) }}{{ evt.description.length > 140 ? '…' : '' }}</span> }
                </a>
              }
            </div>
          </section>
        }
        @if (filteredSujets.length) {
          <section class="group">
            <h2 class="group-title">Sujets ({{ filteredSujets.length }})</h2>
            <div class="group-list">
              @for (s of filteredSujets; track s._id) {
                <a class="item" [routerLink]="['/communaute/sujets', s._id]">
                  <span class="item-title">{{ s.titre || s.nom }}</span>
                  @if (s.description) { <span class="item-desc">{{ s.description.slice(0,140) }}{{ s.description.length > 140 ? '…' : '' }}</span> }
                </a>
              }
            </div>
          </section>
        }
      }}}
    </div>
  `,
  styles: [`
    :host { display: block; }
    .page { max-width: 760px; margin: 0 auto; }
    h1 { font-size: var(--text-xl); font-weight: 600; margin: 0 0 24px; }
    .center-state { display: flex; flex-direction: column; align-items: center; padding: 60px 20px; gap: 12px; color: var(--ink-700); }
    .center-state p { font-size: var(--text-sm); margin: 0; }
    .sp { width: 28px; height: 28px; border: 2px solid var(--line-200); border-top-color: var(--honey-500); border-radius: 50%; animation: r 0.7s linear infinite; }
    @keyframes r { to{transform:rotate(360deg)} }
    .group { margin-bottom: 28px; }
    .group-title { font-family: var(--font-mono); font-size: var(--text-xs); font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: var(--ink-700); margin: 0 0 10px; padding-bottom: 6px; border-bottom: 1px solid var(--line-200); }
    .group-list { display: flex; flex-direction: column; gap: 6px; }
    .item { display: flex; flex-direction: column; gap: 2px; padding: 12px 16px; background: var(--color-surface); border: 1px solid var(--line-200); border-radius: var(--radius-sm); text-decoration: none; transition: border-color var(--transition); }
    .item:hover { border-color: var(--honey-500); }
    .item-title { font-size: var(--text-sm); font-weight: 500; color: var(--ink-900); }
    .item-desc { font-size: var(--text-xs); color: var(--ink-700); line-height: 1.4; }
  `]
})
export class SearchComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);
  query = '';
  loading = signal(false);
  publications: any[] = [];
  evenements: any[] = [];
  sujets: any[] = [];

  get filteredPublications() { return this.filter(this.publications, ['titre', 'description']); }
  get filteredEvenements() { return this.filter(this.evenements, ['titre', 'description']); }
  get filteredSujets() { return this.filter(this.sujets, ['titre', 'description', 'nom']); }
  total() { return this.filteredPublications.length + this.filteredEvenements.length + this.filteredSujets.length; }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.query = params['q'] || '';
      if (this.query) this.fetchAll();
    });
  }

  private fetchAll() {
    this.loading.set(true);
    this.http.get<any[]>('/api/publications').subscribe({ next: d => { this.publications = d; this.loading.set(false); } });
    this.http.get<any[]>('/api/evenements').subscribe({ next: d => { this.evenements = d; } });
    this.http.get<any[]>('/api/communaute/sujets').subscribe({ next: d => { this.sujets = d; } });
  }

  private filter(items: any[], fields: string[]): any[] {
    if (!this.query) return [];
    const q = this.query.toLowerCase();
    return items.filter(i => fields.some(f => i[f]?.toLowerCase().includes(q))).slice(0, 20);
  }
}
