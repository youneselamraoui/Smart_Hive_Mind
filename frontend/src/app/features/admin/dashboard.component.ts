import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { SkeletonModule } from 'primeng/skeleton';
import { ToastService } from '../../core/toast.service';
import { EmptyStateComponent } from '../../core/empty-state.component';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [RouterLink, SkeletonModule, EmptyStateComponent],
  template: `
    <div class="page">
      <div class="admin-bar">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        Administration
      </div>

      <div class="body">
        @if (loading()) {
          <div class="metrics-skel">
            @for (i of [1,2,3,4,5,6]; track i) {
              <div class="metric-skel">
                <p-skeleton shape="circle" width="42px" height="42px" />
                <div class="metric-skel-body">
                  <p-skeleton width="50%" height="1.2rem" />
                  <p-skeleton width="30%" height="0.7rem" />
                </div>
              </div>
            }
          </div>
        } @else { @if (error()) {
          <app-empty-state
            icon="pi pi-exclamation-triangle"
            title="Erreur"
            description="Impossible de charger les statistiques."
            actionLabel="Réessayer"
            (action)="load()"
            [compact]="true"
          />
        } @else {
          <div class="metrics">
            <div class="metric"><div class="metric-icon" style="background:rgba(91,79,224,0.1);color:var(--agentic-500)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></div><div><span class="metric-n">{{ summary()?.totalMembres ?? 0 }}</span><span class="metric-l">Membres</span></div></div>
            <div class="metric"><div class="metric-icon" style="background:rgba(31,158,109,0.1);color:var(--verify-500)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg></div><div><span class="metric-n">{{ summary()?.totalPublications ?? 0 }}</span><span class="metric-l">Publications</span></div></div>
            <div class="metric"><div class="metric-icon" style="background:rgba(217,160,43,0.1);color:var(--honey-600)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg></div><div><span class="metric-n">{{ summary()?.totalEvenements ?? 0 }}</span><span class="metric-l">Événements</span></div></div>
            <div class="metric"><div class="metric-icon" style="background:rgba(91,79,224,0.1);color:var(--agentic-500)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg></div><div><span class="metric-n">{{ summary()?.totalOffres ?? 0 }}</span><span class="metric-l">Offres</span></div></div>
            <div class="metric"><div class="metric-icon" style="background:rgba(31,158,109,0.1);color:var(--verify-500)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg></div><div><span class="metric-n">{{ summary()?.totalMissions ?? 0 }}</span><span class="metric-l">Missions</span></div></div>
            <div class="metric"><div class="metric-icon" style="background:rgba(217,160,43,0.1);color:var(--honey-600)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg></div><div><span class="metric-n">{{ summary()?.totalBounties ?? 0 }}</span><span class="metric-l">Bounties</span></div></div>
          </div>
        }}

        <div class="actions">
          <h2>Actions rapides</h2>
          <div class="action-links">
            <a class="action-link" routerLink="/admin/badges/attribuer">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg>
              Attribuer un badge
            </a>
            <a class="action-link" routerLink="/admin/badges">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="9" cy="9" r="7"/><path d="M15 15l6 6"/></svg>
              Liste des badges
            </a>
            <button class="action-link" (click)="indexerPublications()" [disabled]="indexing()">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              {{ indexing() ? 'Indexation…' : 'Indexer les publications' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .page { position: relative; }

    .admin-bar { display: flex; align-items: center; gap: 8px; font-family: var(--font-mono); font-size: var(--text-xs); font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: var(--paper-50); background: var(--ink-900); margin: calc(-1 * var(--page-pad, 24px)) calc(-1 * var(--page-pad, 24px)) 24px; padding: 14px var(--page-pad, 24px); }
    .admin-bar svg { opacity: 0.6; }

    .body { position: relative; }

    .metrics-skel { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 36px; }
    .metric-skel { display: flex; align-items: center; gap: 14px; background: var(--color-surface); border: 1px solid var(--line-200); border-radius: var(--radius-md); padding: 18px 22px; }
    .metric-skel-body { display: flex; flex-direction: column; gap: 8px; flex: 1; }

    .metrics { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 36px; }
    .metric { display: flex; align-items: center; gap: 14px; background: var(--color-surface); border: 1px solid var(--line-200); border-radius: var(--radius-md); padding: 18px 22px; transition: border-color var(--transition); }
    .metric:hover { border-color: var(--ink-700); }
    .metric-icon { width: 42px; height: 42px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .metric-icon :deep(svg) { width: 20px; height: 20px; }
    .metric-n { display: block; font-size: var(--text-xl); font-weight: 700; line-height: 1.2; }
    .metric-l { font-size: var(--text-sm); color: var(--ink-700); }

    .actions h2 { font-size: var(--text-lg); margin: 0 0 14px; }
    .action-links { display: flex; flex-wrap: wrap; gap: 12px; }
    .action-link { display: inline-flex; align-items: center; gap: 8px; padding: 10px 18px; border: 1px solid var(--line-200); border-radius: var(--radius-md); background: var(--color-surface); color: var(--ink-900); font-size: var(--text-sm); font-weight: 500; text-decoration: none; transition: border-color var(--transition); }
    .action-link:hover { border-color: var(--indigo-500); }
    .action-link :deep(svg) { width: 18px; height: 18px; }

    @media (max-width: 640px) { .metrics { grid-template-columns: 1fr; } }
  `]
})
export class DashboardComponent implements OnInit {
  private http = inject(HttpClient);
  private toast = inject(ToastService);
  summary = signal<any>(null);
  loading = signal(true);
  error = signal(false);
  indexing = signal(false);

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true); this.error.set(false);
    this.http.get<any>('/api/dashboard/summary').subscribe({
      next: d => { this.summary.set(d); this.loading.set(false); },
      error: () => { this.error.set(true); this.loading.set(false); },
    });
  }

  indexerPublications() {
    this.indexing.set(true);
    this.http.post<{ indexed: number }>('/api/ai/index-publications', {}).subscribe({
      next: r => { this.indexing.set(false); this.toast.success(r.indexed + ' publication(s) indexée(s).'); },
      error: () => { this.indexing.set(false); this.toast.error('Erreur d\'indexation.'); },
    });
  }
}
