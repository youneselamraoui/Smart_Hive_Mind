import { Component, OnInit, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DatePipe } from '@angular/common';

const BADGE_ICONS: Record<string, string> = {
  innovateur: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M9 18h6"/><path d="M10 22h4"/><path d="M15.09 14c.58-.68.91-1.55.91-2.5a4 4 0 0 0-8 0c0 .95.33 1.82.91 2.5"/><path d="M12 2v1"/><path d="M4.93 4.93l.71.71"/><path d="M2 12h1"/></svg>`,
  collaborateur: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  expert: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg>`,
  mentor: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>`,
  contributeur: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><line x1="6" y1="3" x2="6" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/></svg>`,
  leader: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M2 20h20"/><path d="M4 20V8l4 4 4-8 4 8 4-4v12"/></svg>`,
};

const BADGE_COLORS: Record<string, { bg: string; fg: string }> = {
  innovateur: { bg: 'rgba(91,79,224,0.1)', fg: 'var(--agentic-500)' },
  collaborateur: { bg: 'rgba(31,158,109,0.1)', fg: 'var(--verify-500)' },
  expert: { bg: 'rgba(217,160,43,0.1)', fg: 'var(--honey-600)' },
  mentor: { bg: 'rgba(91,79,224,0.1)', fg: 'var(--agentic-500)' },
  contributeur: { bg: 'rgba(31,158,109,0.1)', fg: 'var(--verify-500)' },
  leader: { bg: 'rgba(196,67,46,0.1)', fg: 'var(--alert-500)' },
};

@Component({
  selector: 'app-badge-list',
  standalone: true,
  imports: [DatePipe],
  template: `
    <div class="page">
      <div class="page-head"><div><h1>Badges attribués</h1></div></div>

      @if (loading()) {
        <div class="skel-grid">@for (i of [1,2,3]; track i) { <div class="skel-card"><div class="skel-line w-60"></div><div class="skel-line w-40"></div></div> }</div>
      } @else { @if (badges().length === 0) {
        <div class="empty"><h3>Aucun badge attribué</h3></div>
      } @else {
        <div class="grid">
          @for (b of badges(); track b._id) {
            <div class="card">
              <div class="card-icon" [style.background]="color(b.type).bg" [style.color]="color(b.type).fg" [innerHTML]="icon(b.type)"></div>
              <div class="card-info">
                <h3>{{ badgeLabel(b.type) }}</h3>
                @if (b.justification) { <p>{{ b.justification }}</p> }
                <div class="meta"><span>Par</span> {{ attrName(b) }}</div>
                <div class="meta"><span>Le</span> {{ b.createdAt | date:'dd MMM yyyy' }}</div>
              </div>
            </div>
          }
        </div>
      }}
    </div>
  `,
  styles: [`
    :host { display: block; }
    .page-head { margin-bottom: 24px; }
    .page-head h1 { font-size: var(--text-2xl); margin: 0; }

    .empty { display: flex; flex-direction: column; align-items: center; padding: 60px 24px; }
    .empty h3 { font-size: var(--text-lg); margin: 0; }

    .skel-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 16px; }
    .skel-card { background: var(--color-surface); border: 1px solid var(--line-200); border-radius: var(--radius-md); padding: 20px; }
    .skel-line { height: 12px; border-radius: 4px; background: var(--line-200); margin-bottom: 10px; animation: sh 1.5s infinite; }
    .w-60 { width: 60%; } .w-40 { width: 40%; }
    @keyframes sh { 0%{opacity:0.5} 50%{opacity:1} 100%{opacity:0.5} }

    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(360px, 1fr)); gap: 16px; }
    .card { display: flex; gap: 16px; background: var(--color-surface); border: 1px solid var(--line-200); border-radius: var(--radius-md); padding: 20px; transition: border-color var(--transition); }
    .card:hover { border-color: var(--honey-500); }
    .card-icon { width: 44px; height: 44px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .card-icon :deep(svg) { width: 22px; height: 22px; }
    .card-info { flex: 1; min-width: 0; }
    .card-info h3 { font-size: var(--text-base); margin: 0 0 4px; text-transform: capitalize; }
    .card-info p { font-size: var(--text-sm); color: var(--ink-700); margin: 0 0 8px; line-height: 1.4; }
    .meta { font-size: var(--text-xs); color: var(--ink-700); margin-bottom: 2px; }
    .meta span { color: var(--ink-700); font-weight: 600; }

    @media (max-width: 768px) { .grid { grid-template-columns: 1fr; } }
  `]
})
export class BadgeListComponent implements OnInit {
  private http = inject(HttpClient);
  badges = signal<any[]>([]);
  loading = signal(true);

  icon(t: string) { return BADGE_ICONS[t] || BADGE_ICONS['innovateur']; }
  color(t: string) { return BADGE_COLORS[t] || BADGE_COLORS['innovateur']; }

  badgeLabel(t: string): string {
    return { innovateur: 'Innovateur', collaborateur: 'Collaborateur', expert: 'Expert', mentor: 'Mentor', contributeur: 'Contributeur', leader: 'Leader' }[t] || t;
  }

  ngOnInit() {
    this.http.get<any[]>('/api/badges').subscribe({
      next: list => this.badges.set(list),
      error: () => this.loading.set(false),
      complete: () => this.loading.set(false),
    });
  }

  attrName(b: any): string {
    if (typeof b.attribuePar === 'object' && b.attribuePar) return b.attribuePar.prenom + ' ' + b.attribuePar.nom;
    return b.attribuePar || 'Admin';
  }
}
