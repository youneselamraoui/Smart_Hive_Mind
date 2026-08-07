import { Component, OnInit, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';

interface Sondage {
  _id: string;
  question: string;
  options: string[];
  votes?: Record<string, string[]>;
  auteurId?: { _id: string; nom: string; prenom: string };
  dateFin?: string;
  createdAt?: string;
}

@Component({
  selector: 'app-sondage-list',
  standalone: true,
  imports: [DatePipe, RouterLink],
  template: `
    <div class="page">
      <div class="page-head"><div><h1>Sondages</h1><p>Exprimez-vous sur la vie de la communauté</p></div><a class="new-btn" routerLink="/app/communaute/sondages/new">Créer un sondage</a></div>

      @if (loading()) {
        <div class="skel-grid">@for (i of [1,2,3]; track i) { <div class="skel-card"><div class="skel-line w-70"></div><div class="skel-line w-40"></div></div> }</div>
      } @else { @if (list().length === 0) {
        <div class="empty"><h3>Aucun sondage</h3><p>Les sondages apparaîtront ici une fois créés.</p></div>
      } @else {
        <div class="grid">
          @for (s of list(); track s._id) {
            <a class="card" [routerLink]="['/app', 'communaute', 'sondages', s._id]">
              <div class="card-head">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>
                <span class="votes">{{ totalVotes(s) }} vote(s)</span>
              </div>
              <h3>{{ s.question }}</h3>
              <div class="card-foot">
                <span class="author">{{ s.auteurId?.prenom }} {{ s.auteurId?.nom }}</span>
                @if (s.dateFin) { <span class="deadline">Clôture le {{ s.dateFin | date:'dd MMM yyyy' }}</span> }
              </div>
            </a>
          }
        </div>
      }}
    </div>
  `,
  styles: [`
    :host { display: block; }
    .page-head { margin-bottom: 24px; display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; }
    .page-head h1 { font-size: var(--text-2xl); margin: 0 0 2px; }
    .page-head p { margin: 0; font-size: var(--text-sm); color: var(--ink-700); }
    .new-btn { padding: 8px 16px; border-radius: var(--radius-sm); background: var(--honey-500); color: var(--ink-900); font-size: var(--text-sm); font-weight: 600; text-decoration: none; white-space: nowrap; transition: filter var(--transition); }
    .new-btn:hover { filter: brightness(1.08); }

    .skel-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 16px; }
    .skel-card { background: var(--color-surface); border: 1px solid var(--line-200); border-radius: var(--radius-md); padding: 20px; }
    .skel-line { height: 12px; border-radius: 4px; background: var(--line-200); margin-bottom: 10px; animation: sh 1.5s infinite; }
    .w-70 { width: 70%; } .w-40 { width: 40%; }
    @keyframes sh { 0%{opacity:0.5} 50%{opacity:1} 100%{opacity:0.5} }

    .empty { display: flex; flex-direction: column; align-items: center; padding: 60px 24px; }
    .empty h3 { font-size: var(--text-lg); margin: 0 0 4px; }
    .empty p { font-size: var(--text-sm); color: var(--ink-700); margin: 0; }

    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 16px; }
    .card { display: flex; flex-direction: column; gap: 12px; background: var(--color-surface); border: 1px solid var(--line-200); border-radius: var(--radius-md); padding: 24px; text-decoration: none; color: inherit; transition: border-color var(--transition); }
    .card:hover { border-color: var(--honey-500); }
    .card-head { display: flex; justify-content: space-between; align-items: center; }
    .card-head svg { color: var(--honey-500); }
    .votes { font-size: var(--text-xs); color: var(--ink-700); }
    .card h3 { font-size: var(--text-base); margin: 0; }
    .card-foot { display: flex; justify-content: space-between; align-items: center; gap: 10px; border-top: 1px solid var(--line-200); padding-top: 12px; font-size: var(--text-xs); color: var(--ink-700); }
    .deadline { white-space: nowrap; }

    @media (max-width: 768px) { .grid { grid-template-columns: 1fr; } }
  `]
})
export class SondageListComponent implements OnInit {
  private http = inject(HttpClient);
  list = signal<Sondage[]>([]);
  loading = signal(true);

  ngOnInit() {
    this.http.get<Sondage[]>('/api/communaute/sondages').subscribe({
      next: l => this.list.set(l),
      error: () => this.loading.set(false),
      complete: () => this.loading.set(false),
    });
  }

  totalVotes(s: Sondage): number {
    const votes = s.votes || {};
    return Object.values(votes).reduce((sum: number, v) => sum + (v || []).length, 0);
  }
}
