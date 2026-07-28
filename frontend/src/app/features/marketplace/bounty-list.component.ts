import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { DatePipe, SlicePipe } from '@angular/common';

function daysLeft(dateStr: string): string {
  if (!dateStr) return '';
  const now = Date.now();
  const d = new Date(dateStr).getTime();
  const diff = Math.ceil((d - now) / 86400000);
  if (diff < 0) return 'Expiré';
  if (diff === 0) return 'Dernier jour';
  return 'J-' + diff;
}

@Component({
  selector: 'app-bounty-list',
  standalone: true,
  imports: [RouterLink, DatePipe, SlicePipe],
  template: `
    <div class="section">
      <div class="section-head">
        <h2>Bounties</h2>
        <a routerLink="/marketplace/bounties/new" class="btn btn-primary">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Nouveau bounty
        </a>
      </div>

      @if (loading()) {
        <div class="skel-grid">@for (i of [1,2,3]; track i) { <div class="skel-card"><div class="skel-line w-70"></div><div class="skel-line w-40"></div><div class="skel-line w-90"></div></div> }</div>
      } @else { @if (items().length === 0) {
        <div class="empty">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--honey-500)" stroke-width="1" opacity="0.3"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          <h3>Aucune bounty</h3>
          <p>Les bounties apparaîtront ici une fois publiées.</p>
        </div>
      } @else {
        <div class="grid">
          @for (b of items(); track b._id) {
            <a class="bounty-card" [routerLink]="['/marketplace/bounties', b._id]">
              <div class="bounty-top">
                <div class="bounty-reward">
                  <svg width="32" height="32" viewBox="0 0 100 100" fill="none" stroke="var(--honey-500)" stroke-width="3"><polygon points="50 5 90 27.5 90 72.5 50 95 10 72.5 10 27.5"/><polygon points="50 18 78 32 78 60 50 82 22 60 22 32" fill="none" stroke="var(--honey-500)" stroke-width="2"/><circle cx="50" cy="45" r="8" fill="none" stroke="var(--honey-500)" stroke-width="1.5"/></svg>
                  <span class="bounty-amount">{{ b.recompense }}</span>
                </div>
                <span class="bounty-countdown">{{ daysLeft(b.delai) }}</span>
              </div>
              <h3>{{ b.titre }}</h3>
              <p>{{ (b.description || '').length > 100 ? (b.description | slice:0:100) + '…' : b.description }}</p>
              <div class="bounty-footer">
                <span class="bounty-soums">{{ b.soumissions?.length || 0 }} soumission{{ (b.soumissions?.length || 0) > 1 ? 's' : '' }}</span>
                @if (b.gagnantId) { <span class="bounty-tag">Attribuée</span> }
                <span class="bounty-date">{{ b.createdAt | date:'dd MMM' }}</span>
              </div>
            </a>
          }
        </div>
      }}
    </div>
  `,
  styles: [`
    :host { display: block; }
    .section { position: relative; }
    .section-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; flex-wrap: wrap; gap: 10px; }
    .section-head h2 { font-size: var(--text-lg); margin: 0; }

    .btn { display: inline-flex; align-items: center; gap: 8px; padding: 8px 18px; border: none; border-radius: var(--radius-md); font-family: var(--font-body); font-size: var(--text-sm); font-weight: 600; cursor: pointer; text-decoration: none; transition: all var(--transition); }
    .btn-primary { background: var(--honey-500); color: var(--ink-900); }
    .btn-primary:hover { background: var(--honey-600); }

    .empty { display: flex; flex-direction: column; align-items: center; text-align: center; padding: 60px 24px; }
    .empty h3 { font-size: var(--text-lg); margin: 12px 0 4px; }
    .empty p { font-size: var(--text-sm); color: var(--ink-700); margin: 0; }

    .skel-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 16px; }
    .skel-card { background: var(--color-surface); border: 1px solid var(--line-200); border-radius: var(--radius-md); padding: 20px; }
    .skel-line { height: 12px; border-radius: 4px; background: var(--line-200); margin-bottom: 10px; animation: sh 1.5s infinite; }
    .w-70 { width: 70%; } .w-40 { width: 40%; } .w-90 { width: 90%; }
    @keyframes sh { 0%{opacity:0.5} 50%{opacity:1} 100%{opacity:0.5} }

    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 16px; }
    .bounty-card { display: flex; flex-direction: column; gap: 10px; padding: 20px; background: var(--color-surface); border: 1px solid var(--line-200); border-radius: var(--radius-md); text-decoration: none; color: inherit; transition: border-color var(--transition); }
    .bounty-card:hover { border-color: var(--honey-500); }
    .bounty-card h3 { font-size: var(--text-base); margin: 0; }
    .bounty-card p { font-size: var(--text-sm); color: var(--ink-700); margin: 0; line-height: 1.5; }

    .bounty-top { display: flex; align-items: center; justify-content: space-between; }
    .bounty-reward { display: flex; align-items: center; gap: 10px; }
    .bounty-reward svg { flex-shrink: 0; }
    .bounty-amount { font-family: var(--font-heading); font-size: var(--text-xl); font-weight: 700; color: var(--ink-900); }
    .bounty-countdown { font-family: var(--font-mono); font-size: var(--text-xs); font-weight: 600; padding: 4px 10px; border-radius: 999px; background: rgba(217,160,43,0.1); color: var(--honey-600); }

    .bounty-footer { display: flex; align-items: center; gap: 10px; padding-top: 8px; border-top: 1px solid var(--line-200); font-size: var(--text-xs); }
    .bounty-soums { color: var(--ink-700); }
    .bounty-tag { font-weight: 600; padding: 2px 8px; border-radius: 999px; background: rgba(31,158,109,0.1); color: var(--verify-500); }
    .bounty-date { margin-left: auto; color: var(--ink-700); font-family: var(--font-mono); }

    @media (max-width: 768px) { .grid { grid-template-columns: 1fr; } }
  `]
})
export class BountyListComponent implements OnInit {
  private http = inject(HttpClient);
  loading = signal(true);
  items = signal<any[]>([]);
  daysLeft = daysLeft;

  ngOnInit() {
    this.http.get<any[]>('/api/bounties').subscribe({
      next: list => this.items.set(list),
      error: () => this.items.set([]),
      complete: () => this.loading.set(false),
    });
  }
}
