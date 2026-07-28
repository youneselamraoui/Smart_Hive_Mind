import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-sujet-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page">
      <div class="page-head">
        <div>
          <h1>Sujets de discussion</h1>
          <p>Parcourez les fils par thématique</p>
        </div>
        <a routerLink="/communaute/sujets/new" class="btn btn-primary">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Nouveau sujet
        </a>
      </div>

      <div class="filter">
        <select class="filter-select" [value]="selectedThematique()" (change)="onFilter($event)">
          <option value="">Toutes les thématiques</option>
          @for (t of thematiques; track t._id) {
            <option [value]="t._id">{{ t.nom }}</option>
          }
        </select>
      </div>

      @if (loading()) {
        <div class="skeleton-list">@for (i of [1,2,3,4]; track i) { <div class="skel-card"><div class="skel-line w-70"></div><div class="skel-line w-90"></div><div class="skel-line w-40"></div></div> }</div>
      } @else {
        @if (sujets().length === 0) {
          <div class="empty">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--honey-500)" stroke-width="1" opacity="0.3"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            <h3>Aucun sujet</h3>
            <p>{{ selectedThematique() ? 'Aucun résultat pour cette thématique.' : 'Soyez le premier à lancer une discussion.' }}</p>
          </div>
        } @else {
          <div class="sujet-list">
            @for (s of sujets(); track s._id) {
              <a class="sujet-card" [routerLink]="['/communaute/sujets', s._id]">
                <h3>{{ s.titre }}</h3>
                <p>{{ truncate(s.contenu, 120) }}</p>
                <div class="sujet-meta">
                  <span class="sujet-badge">{{ getThematiqueNom(s.thematique) }}</span>
                  <span class="sujet-date">{{ s.createdAt | date:'dd MMM yyyy' }}</span>
                </div>
              </a>
            }
          </div>
        }
      }
    </div>
  `,
  styles: [`
    :host { display: block; }
    .page { position: relative; }
    .page-head { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 20px; flex-wrap: wrap; }
    .page-head h1 { font-size: var(--text-2xl); margin: 0 0 2px; }
    .page-head p { margin: 0; font-size: var(--text-sm); color: var(--ink-700); }

    .btn { display: inline-flex; align-items: center; gap: 8px; padding: 10px 20px; border: none; border-radius: var(--radius-md); font-family: var(--font-body); font-size: var(--text-sm); font-weight: 600; cursor: pointer; text-decoration: none; transition: all var(--transition); }
    .btn-primary { background: var(--honey-500); color: var(--ink-900); }
    .btn-primary:hover { background: var(--honey-600); }

    .filter { margin-bottom: 20px; }
    .filter-select { padding: 8px 14px; border: 1px solid var(--line-200); border-radius: var(--radius-md); font-family: var(--font-body); font-size: var(--text-sm); background: var(--color-surface); color: var(--ink-900); outline: none; min-width: 240px; cursor: pointer; }
    .filter-select:focus { border-color: var(--honey-500); }

    .skeleton-list { display: flex; flex-direction: column; gap: 12px; }
    .skel-card { background: var(--color-surface); border: 1px solid var(--line-200); border-radius: var(--radius-md); padding: 20px; }
    .skel-line { height: 12px; border-radius: 4px; background: var(--line-200); margin-bottom: 10px; animation: sh 1.5s infinite; }
    .w-70 { width: 70%; } .w-90 { width: 90%; } .w-40 { width: 40%; }
    @keyframes sh { 0%{opacity:0.5} 50%{opacity:1} 100%{opacity:0.5} }

    .empty { display: flex; flex-direction: column; align-items: center; text-align: center; padding: 60px 24px; }
    .empty h3 { font-size: var(--text-lg); margin: 12px 0 4px; }
    .empty p { font-size: var(--text-sm); color: var(--ink-700); margin: 0; }

    .sujet-list { display: flex; flex-direction: column; gap: 10px; }
    .sujet-card { display: flex; flex-direction: column; gap: 8px; padding: 18px 20px; background: var(--color-surface); border: 1px solid var(--line-200); border-radius: var(--radius-md); text-decoration: none; color: inherit; transition: border-color var(--transition); }
    .sujet-card:hover { border-color: var(--honey-500); }
    .sujet-card h3 { font-size: var(--text-base); margin: 0; }
    .sujet-card p { font-size: var(--text-sm); color: var(--ink-700); margin: 0; line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    .sujet-meta { display: flex; align-items: center; gap: 12px; padding-top: 4px; }
    .sujet-badge { font-size: var(--text-xs); font-weight: 500; padding: 2px 10px; border-radius: 999px; background: var(--paper-50); color: var(--ink-700); }
    .sujet-date { font-size: var(--text-xs); color: var(--ink-700); font-family: var(--font-mono); }
  `]
})
export class SujetListComponent implements OnInit {
  private http = inject(HttpClient);
  loading = signal(true);
  sujets = signal<any[]>([]);
  thematiques: any[] = [];
  selectedThematique = signal('');

  ngOnInit() {
    this.http.get<any[]>('/api/communaute/thematiques').subscribe(list => this.thematiques = list);
    this.loadSujets();
  }

  private loadSujets() {
    this.loading.set(true);
    const params: any = {};
    if (this.selectedThematique()) params.thematique = this.selectedThematique();
    this.http.get<any[]>('/api/communaute/sujets', { params }).subscribe({
      next: list => this.sujets.set(list),
      error: () => this.sujets.set([]),
      complete: () => this.loading.set(false),
    });
  }

  onFilter(e: Event) {
    this.selectedThematique.set((e.target as HTMLSelectElement).value);
    this.loadSujets();
  }

  getThematiqueNom(t: any): string {
    if (!t) return '—';
    if (typeof t === 'object') return t.nom;
    const found = this.thematiques.find(th => th._id === t);
    return found ? found.nom : t;
  }

  truncate(text: string, max: number): string {
    return text && text.length > max ? text.substring(0, max) + '…' : text;
  }
}
