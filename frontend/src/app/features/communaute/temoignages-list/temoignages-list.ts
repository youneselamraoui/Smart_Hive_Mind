import { Component, OnInit, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';

function hashStr(s: string): number {
  let h = 0; for (let i = 0; i < s.length; i++) { h = ((h << 5) - h) + s.charCodeAt(i); h |= 0; } return Math.abs(h);
}

@Component({
  selector: 'app-temoignages-list',
  standalone: true,
  imports: [DatePipe, RouterLink],
  template: `
    <div class="page">
      <div class="page-head">
        <div>
          <h1>Témoignages</h1>
          <p>Retours d'expérience de la communauté</p>
        </div>
        <a routerLink="/communaute/temoignages/new" class="btn btn-primary">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><line x1="12" y1="8" x2="12" y2="14"/><line x1="9" y1="11" x2="15" y2="11"/></svg>
          Ajouter un témoignage
        </a>
      </div>

      @if (loading()) {
        <div class="skeleton-carnet">@for (i of [1,2,3]; track i) { <div class="skel-card"><div class="skel-line w-50"></div><div class="skel-line w-90"></div><div class="skel-line w-70"></div></div> }</div>
      } @else { @if (temoignages().length === 0) {
        <div class="empty">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--honey-500)" stroke-width="1" opacity="0.3"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          <h3>Aucun témoignage</h3>
          <p>Soyez le premier à partager votre expérience.</p>
        </div>
      } @else {
        <div class="carnet">
          @for (t of temoignages(); track t._id) {
            <div class="carnet-card">
              <div class="carnet-quote">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" opacity="0.12"><path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10H14.017zM0 21v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151C7.563 6.068 6 8.789 6 11h4v10H0z"/></svg>
              </div>
              <div class="carnet-body">
                <h3>{{ t.titre }}</h3>
                <p>{{ t.contenu }}</p>
              </div>
              <div class="carnet-meta">
                <span class="carnet-author">{{ t.auteurId?.prenom }} {{ t.auteurId?.nom }}</span>
                <span class="carnet-date">{{ t.createdAt | date:'dd MMM yyyy' }}</span>
              </div>
              <div class="carnet-tags">
                @for (tag of t.tags; track tag) {
                  <span class="carnet-tag">{{ tag }}</span>
                }
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
    .page-head { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 28px; flex-wrap: wrap; }
    .page-head h1 { font-size: var(--text-2xl); margin: 0 0 2px; }
    .page-head p { margin: 0; font-size: var(--text-sm); color: var(--ink-700); }

    .btn { display: inline-flex; align-items: center; gap: 8px; padding: 10px 20px; border: none; border-radius: var(--radius-md); font-family: var(--font-body); font-size: var(--text-sm); font-weight: 600; cursor: pointer; text-decoration: none; transition: all var(--transition); }
    .btn-primary { background: var(--honey-500); color: var(--ink-900); }
    .btn-primary:hover { background: var(--honey-600); }

    .skeleton-carnet { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; }
    .skel-card { background: var(--color-surface); border: 1px solid var(--line-200); border-radius: var(--radius-md); padding: 20px; }
    .skel-line { height: 12px; border-radius: 4px; background: var(--line-200); margin-bottom: 10px; animation: sh 1.5s infinite; }
    .w-50 { width: 50%; } .w-70 { width: 70%; } .w-90 { width: 90%; }
    @keyframes sh { 0%{opacity:0.5} 50%{opacity:1} 100%{opacity:0.5} }

    .empty { display: flex; flex-direction: column; align-items: center; text-align: center; padding: 60px 24px; }
    .empty h3 { font-size: var(--text-lg); margin: 12px 0 4px; }
    .empty p { font-size: var(--text-sm); color: var(--ink-700); margin: 0; }

    .carnet { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 16px; }

    .carnet-card { background: var(--color-surface); border: 1px solid var(--line-200); border-radius: var(--radius-md); padding: 20px; display: flex; flex-direction: column; gap: 12px; transition: border-color var(--transition); }
    .carnet-card:hover { border-color: var(--honey-500); }

    .carnet-quote { line-height: 0; }
    .carnet-quote svg { color: var(--honey-500); }

    .carnet-body { flex: 1; }
    .carnet-body h3 { font-family: var(--font-heading); font-style: italic; font-size: var(--text-base); margin: 0 0 6px; line-height: 1.4; }
    .carnet-body p { font-size: var(--text-sm); line-height: 1.6; color: var(--ink-700); margin: 0; display: -webkit-box; -webkit-line-clamp: 4; -webkit-box-orient: vertical; overflow: hidden; }

    .carnet-meta { display: flex; justify-content: space-between; align-items: center; font-size: var(--text-xs); padding-top: 8px; border-top: 1px solid var(--line-200); }
    .carnet-author { font-weight: 600; color: var(--ink-900); }
    .carnet-date { color: var(--ink-700); font-family: var(--font-mono); }

    .carnet-tags { display: flex; flex-wrap: wrap; gap: 6px; }
    .carnet-tag { font-size: 0.65rem; font-weight: 500; padding: 3px 10px; border-radius: 999px; background: var(--paper-100); color: var(--ink-700); }

    @media (max-width: 768px) { .carnet { grid-template-columns: 1fr; } }
  `]
})
export class TemoignagesListComponent implements OnInit {
  private http = inject(HttpClient);
  loading = signal(true);
  temoignages = signal<any[]>([]);

  ngOnInit() {
    this.http.get<any>('/api/communaute/temoignages', { params: { limit: '50' } }).subscribe({
      next: r => this.temoignages.set(r.temoignages || r),
      error: () => this.temoignages.set([]),
      complete: () => this.loading.set(false),
    });
  }
}
