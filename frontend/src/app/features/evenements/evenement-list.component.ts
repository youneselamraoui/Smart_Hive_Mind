import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { interval, Subscription } from 'rxjs';
import { SafeHtmlPipe } from '../../core/safe-html.pipe';

const TYPE_ICONS: Record<string, string> = {
  hackathon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/><line x1="14" y1="4" x2="10" y2="20"/></svg>`,
  congres: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>`,
  salon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>`,
  concours: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5C7 4 6 9 6 9z"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5C17 4 18 9 18 9z"/><path d="M4 22h16"/><path d="M10 22V2h4v20"/></svg>`,
};

function fmtDateRange(debut: string, fin: string): string {
  const d = new Date(debut), f = new Date(fin);
  const months = ['JAN','FEV','MAR','AVR','MAI','JUN','JUL','AOU','SEP','OCT','NOV','DEC'];
  const dStr = d.getDate() + (d.getMonth() !== f.getMonth() || d.getDate() !== f.getDate() ? '' : '');
  const fStr = f.getDate();
  return dStr + '–' + fStr + ' ' + months[f.getMonth()];
}

@Component({
  selector: 'app-evenement-list',
  standalone: true,
  imports: [RouterLink, SafeHtmlPipe],
  template: `
    <div class="page">
      <div class="page-head"><div><h1>Événements</h1><p>Hackathons, congrès, salons et concours</p></div><a class="new-btn" routerLink="/app/evenements/new">Créer un événement</a></div>

      <div class="search-bar">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input [value]="searchTerm()" (input)="searchTerm.set($any($event.target).value)" placeholder="Rechercher un événement…" />
      </div>

      @if (loading()) {
        <div class="skel-grid">@for (i of [1,2,3]; track i) { <div class="skel-card"><div class="skel-line w-70"></div><div class="skel-line w-40"></div></div> }</div>
      } @else { @if (filtered.length === 0) {
        <div class="empty"><h3>Aucun événement</h3><p>Les événements apparaîtront ici une fois programmés.</p></div>
      } @else {
        <div class="grid">
          @for (e of filtered; track e._id) {
            <a class="card" [routerLink]="e._id">
              <div class="card-type-icon" [class]="'type-icon--' + e.type" [innerHTML]="typeIcon(e.type) | safeHtml"></div>
              <h3>{{ e.titre }}</h3>
              <div class="card-dates">{{ fmtDate(e.dates.debut, e.dates.fin) }}</div>
              <div class="card-meta">
                <span class="inscrits">{{ e.inscrits?.length || 0 }} inscrit(e)(s)@if (e.capaciteMax) { /{{ e.capaciteMax }} }</span>
                <span class="countdown" [class.urgent]="jours(e) >= 0 && jours(e) <= 7" [class.passe]="jours(e) < 0">
                  @if (jours(e); as j) { @if (j > 0) { J-{{ j }} } @else if (j === 0) { Aujourd'hui } @else { Terminé } }
                </span>
              </div>
            </a>
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

    .empty { display: flex; flex-direction: column; align-items: center; padding: 60px 24px; }
    .empty h3 { font-size: var(--text-lg); margin: 0 0 4px; }
    .empty p { font-size: var(--text-sm); color: var(--ink-700); margin: 0; }

    .skel-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 16px; }
    .skel-card { background: var(--color-surface); border: 1px solid var(--line-200); border-radius: var(--radius-md); padding: 20px; }
    .skel-line { height: 12px; border-radius: 4px; background: var(--line-200); margin-bottom: 10px; animation: sh 1.5s infinite; }
    .w-70 { width: 70%; } .w-40 { width: 40%; }
    @keyframes sh { 0%{opacity:0.5} 50%{opacity:1} 100%{opacity:0.5} }

    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; }
    .card { display: flex; flex-direction: column; gap: 10px; background: var(--color-surface); border: 1px solid var(--line-200); border-radius: var(--radius-md); padding: 24px; text-decoration: none; color: inherit; transition: border-color var(--transition); }
    .card:hover { border-color: var(--honey-500); }
    .card h3 { font-size: var(--text-base); margin: 0; }
    .card-type-icon { width: 36px; height: 36px; border-radius: var(--radius-sm); display: flex; align-items: center; justify-content: center; }
    .card-type-icon :deep(svg) { width: 20px; height: 20px; }
    .type-icon--hackathon { background: rgba(91,79,224,0.1); color: var(--agentic-500); }
    .type-icon--congres { background: rgba(217,160,43,0.1); color: var(--honey-600); }
    .type-icon--salon { background: rgba(31,158,109,0.1); color: var(--verify-500); }
    .type-icon--concours { background: rgba(196,67,46,0.1); color: var(--alert-500); }
    .card-dates { font-family: var(--font-mono); font-size: var(--text-sm); color: var(--ink-700); }
    .card-meta { display: flex; justify-content: space-between; align-items: center; gap: 10px; margin-top: auto; padding-top: 10px; border-top: 1px solid var(--line-200); font-size: var(--text-xs); }
    .inscrits { color: var(--ink-700); }
    .countdown { font-weight: 600; }
    .countdown.urgent { color: var(--honey-600); }
    .countdown.passe { color: var(--ink-700); opacity: 0.5; }

    @media (max-width: 768px) { .grid { grid-template-columns: 1fr; } }
  `]
})
export class EvenementListComponent implements OnInit, OnDestroy {
  private http = inject(HttpClient);
  items: any[] = [];
  loading = signal(true);
  searchTerm = signal('');
  private ticker?: Subscription;

  get filtered() {
    const q = this.searchTerm().toLowerCase();
    if (!q) return this.items;
    return this.items.filter(e => e.titre.toLowerCase().includes(q) || e.type.toLowerCase().includes(q));
  }

  typeIcon(t: string) { return TYPE_ICONS[t] || TYPE_ICONS['hackathon']; }
  fmtDate = fmtDateRange;

  ngOnInit() {
    this.load();
    this.ticker = interval(60000).subscribe(() => this.load());
  }
  ngOnDestroy() { this.ticker?.unsubscribe(); }

  private load() {
    this.http.get<any[]>('/api/evenements').subscribe({
      next: list => this.items = list,
      error: () => this.loading.set(false),
      complete: () => this.loading.set(false),
    });
  }

  jours(e: any): number {
    return Math.ceil((new Date(e.dates.debut).getTime() - Date.now()) / 86400000);
  }
}
