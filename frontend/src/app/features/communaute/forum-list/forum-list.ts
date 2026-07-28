import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { DatePipe } from '@angular/common';

function hashStr(s: string): number {
  let h = 0; for (let i = 0; i < s.length; i++) { h = ((h << 5) - h) + s.charCodeAt(i); h |= 0; } return Math.abs(h);
}

@Component({
  selector: 'app-forum-list',
  standalone: true,
  imports: [RouterLink, DatePipe],
  template: `
    <div class="page">
      <div class="page-head">
        <h1>Forums</h1>
        <p>Espace d'échange par thématique</p>
      </div>

      @if (loading()) {
        <div class="skeleton-grid">
          @for (i of [1,2,3]; track i) { <div class="skeleton-card"><div class="skeleton-line w-70"></div><div class="skeleton-line w-40"></div><div class="skeleton-line w-90"></div></div> }
        </div>
      } @else { @let maxA = maxActivity();
        <div class="etagere">
          @for (forum of forums(); track forum._id) {
            <div class="etagere-card">
              <div class="etagere-top">
                <h2 class="etagere-nom">{{ forum.nom }}</h2>
                <span class="etagere-count">{{ forum.thematiques?.length || 0 }} thématiques</span>
              </div>
              @if (forum.description) {
                <p class="etagere-desc">{{ forum.description }}</p>
              }
              <div class="etagere-activity">
                <span class="activity-label">Activité</span>
                <div class="activity-gauge-track">
                  <div class="activity-gauge-fill" [style.width.%]="maxA > 0 ? ((forum.thematiques?.length || 0) / maxA) * 100 : 0"></div>
                </div>
              </div>
              <div class="etagere-footer">
                <span class="etagere-last">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  {{ forum.derniereActivite ? (forum.derniereActivite | date:'dd MMM') : 'Aucune activité' }}
                </span>
              </div>

              <div class="etagere-thematiques">
                @for (t of (forum.thematiques || []).slice(0, 4); track t._id) {
                  <a class="thema-chip" [routerLink]="['/communaute/sujets', t._id]">{{ t.nom }}</a>
                }
                @if ((forum.thematiques?.length || 0) > 4) {
                  <span class="thema-more">+{{ forum.thematiques.length - 4 }}</span>
                }
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    :host { display: block; }
    .page { position: relative; }
    .page-head { margin-bottom: 28px; }
    .page-head h1 { font-size: var(--text-2xl); margin: 0 0 2px; }
    .page-head p { margin: 0; font-size: var(--text-sm); color: var(--ink-700); }

    .skeleton-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 16px; }
    .skeleton-card { background: var(--color-surface); border: 1px solid var(--line-200); border-radius: var(--radius-md); padding: 20px; }
    .skeleton-line { height: 12px; border-radius: 4px; background: var(--line-200); margin-bottom: 10px; animation: shimmer 1.5s infinite; }
    .w-70 { width: 70%; } .w-40 { width: 40%; } .w-90 { width: 90%; }
    @keyframes shimmer { 0%{opacity:0.5} 50%{opacity:1} 100%{opacity:0.5} }

    .etagere { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 16px; }

    .etagere-card { background: var(--color-surface); border: 1px solid var(--line-200); border-radius: var(--radius-md); padding: 20px; display: flex; flex-direction: column; gap: 12px; transition: border-color var(--transition); }
    .etagere-card:hover { border-color: var(--honey-500); }

    .etagere-top { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; }
    .etagere-nom { font-family: var(--font-heading); font-size: var(--text-lg); margin: 0; }
    .etagere-count { font-size: var(--text-xs); color: var(--ink-700); white-space: nowrap; }

    .etagere-desc { font-size: var(--text-sm); color: var(--ink-700); margin: 0; line-height: 1.5; }

    .etagere-activity { display: flex; align-items: center; gap: 10px; }
    .activity-label { font-size: var(--text-xs); font-weight: 500; color: var(--ink-700); flex-shrink: 0; }
    .activity-gauge-track { flex: 1; height: 6px; background: var(--line-200); border-radius: 999px; overflow: hidden; }
    .activity-gauge-fill { height: 100%; background: var(--honey-500); border-radius: 999px; transition: width 0.6s ease-out; }

    .etagere-footer { display: flex; align-items: center; gap: 6px; }
    .etagere-last { font-size: var(--text-xs); color: var(--ink-700); display: flex; align-items: center; gap: 4px; }
    .etagere-last svg { color: var(--honey-500); }

    .etagere-thematiques { display: flex; flex-wrap: wrap; gap: 6px; padding-top: 8px; border-top: 1px solid var(--line-200); }
    .thema-chip { font-size: var(--text-xs); font-weight: 500; padding: 4px 10px; border-radius: 999px; background: var(--paper-50); color: var(--ink-900); text-decoration: none; transition: background var(--transition); }
    .thema-chip:hover { background: var(--honey-500); color: var(--ink-900); }
    .thema-more { font-size: var(--text-xs); color: var(--ink-700); display: flex; align-items: center; }

    @media (max-width: 768px) { .etagere { grid-template-columns: 1fr; } }
  `]
})
export class ForumListComponent implements OnInit {
  private http = inject(HttpClient);
  loading = signal(true);
  forums = signal<any[]>([]);

  maxActivity = computed(() => {
    const list = this.forums();
    if (list.length === 0) return 0;
    return Math.max(...list.map(f => f.thematiques?.length || 0));
  });

  ngOnInit() {
    this.http.get<any[]>('/api/communaute/forums').subscribe({
      next: list => this.forums.set(list),
      error: () => this.forums.set([]),
      complete: () => this.loading.set(false),
    });
  }
}
