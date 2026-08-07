import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { JournalService, Journal } from './journal.service';
import { ToastService } from '../../core/toast.service';

@Component({
  selector: 'app-journal-detail',
  standalone: true,
  imports: [RouterLink, DatePipe],
  template: `
    <div class="page">
      <a routerLink="/journaux" class="back-link">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="15 18 9 12 15 6"/></svg>
        Tous les journaux
      </a>

      @if (loading()) {
        <div class="loading-center"><div class="spin"></div><span>Chargement…</span></div>
      } @else { @let j = journal();
        <div class="detail-card">
          <div class="journal-hero">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--honey-500)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
            <div class="journal-hero-text">
              <h1>{{ j?.nom }}</h1>
              <span class="journal-statut" [class]="'statut--' + j?.statut">{{ j?.statut }}</span>
            </div>
          </div>

          @if (j?.domaines?.length) {
            <div class="journal-domaines">
              @for (d of j?.domaines; track d) {
                <span class="journal-domaine">{{ d }}</span>
              }
            </div>
          }

          <p class="journal-desc">{{ j?.description || 'Aucune description.' }}</p>

          <div class="journal-info">
            <div class="ji-row"><span class="ji-label">Créé le</span><span class="ji-value">{{ j?.createdAt | date:'dd MMM yyyy' }}</span></div>
            <div class="ji-row"><span class="ji-label">Administrateurs</span><span class="ji-value">{{ j?.administrateurs?.length || 0 }}</span></div>
          </div>

          @if (j?.comite?.length) {
            <div class="section">
              <h3>Comité de lecture</h3>
              <div class="comite-list">
                @for (c of j?.comite; track c) {
                  <div class="comite-row">
                    <span class="comite-membre">{{ c.membreId?.nom || c.membreId?.prenom || 'Membre #' + c.membreId }}</span>
                    <span class="comite-role">{{ c.role }}</span>
                  </div>
                }
              </div>
            </div>
          }

          <div class="section">
            <h3>Publications rattachées</h3>
            <p class="placeholder">Les publications soumises à ce journal apparaîtront ici dans une prochaine version.</p>
          </div>

          <div class="detail-actions">
            <button class="btn btn-outline" (click)="edit()">Modifier</button>
            <button class="btn btn-danger" [disabled]="deleting()" (click)="remove()">{{ deleting() ? 'Suppression…' : 'Supprimer' }}</button>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    :host { display: block; }
    .page { max-width: 720px; }
    .back-link { display: inline-flex; align-items: center; gap: 6px; color: var(--ink-700); text-decoration: none; font-size: var(--text-sm); margin-bottom: 16px; transition: color var(--transition); }
    .back-link:hover { color: var(--honey-500); }

    .loading-center { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 60px; color: var(--ink-700); }
    .spin { width: 24px; height: 24px; border: 2px solid var(--line-200); border-top-color: var(--honey-500); border-radius: 50%; animation: sp 0.7s linear infinite; }
    @keyframes sp { to { transform: rotate(360deg); } }

    .detail-card { background: var(--color-surface); border: 1px solid var(--line-200); border-radius: var(--radius-md); padding: 24px; display: flex; flex-direction: column; gap: 16px; }

    .journal-hero { display: flex; align-items: center; gap: 16px; }
    .journal-hero svg { flex-shrink: 0; }
    .journal-hero-text { flex: 1; }
    .journal-hero-text h1 { font-size: var(--text-xl); margin: 0 0 6px; }
    .journal-statut { font-size: var(--text-xs); font-weight: 600; padding: 3px 10px; border-radius: 999px; text-transform: capitalize; }
    .statut--actif { background: rgba(31,158,109,0.1); color: var(--verify-500); }
    .statut--inactif { background: rgba(196,67,46,0.08); color: var(--alert-500); }

    .journal-domaines { display: flex; flex-wrap: wrap; gap: 6px; }
    .journal-domaine { font-size: var(--text-xs); font-weight: 500; padding: 2px 10px; border-radius: 999px; background: rgba(91,79,224,0.08); color: var(--agentic-500); }

    .journal-desc { font-size: var(--text-sm); line-height: 1.6; color: var(--ink-700); margin: 0; }

    .journal-info { background: var(--paper-50); border: 1px solid var(--line-200); border-radius: var(--radius-sm); padding: 12px 16px; display: flex; flex-direction: column; gap: 6px; }
    .ji-row { display: flex; justify-content: space-between; font-size: var(--text-sm); }
    .ji-label { color: var(--ink-700); }
    .ji-value { font-weight: 500; }

    .section h3 { font-size: var(--text-sm); font-weight: 600; margin: 0 0 10px; }
    .comite-list { display: flex; flex-direction: column; gap: 6px; }
    .comite-row { display: flex; justify-content: space-between; font-size: var(--text-sm); padding: 8px 12px; border: 1px solid var(--line-200); border-radius: var(--radius-sm); }
    .comite-membre { font-weight: 500; }
    .comite-role { color: var(--ink-700); }
    .placeholder { font-size: var(--text-sm); color: var(--ink-700); margin: 0; }

    .detail-actions { display: flex; gap: 10px; border-top: 1px solid var(--line-200); padding-top: 16px; }
    .btn { display: inline-flex; align-items: center; gap: 8px; padding: 10px 22px; border-radius: var(--radius-md); font-family: var(--font-body); font-size: var(--text-sm); font-weight: 600; cursor: pointer; transition: all var(--transition); }
    .btn:disabled { opacity: 0.4; cursor: not-allowed; }
    .btn-outline { background: var(--color-surface); border: 1px solid var(--line-200); color: var(--ink-900); }
    .btn-outline:hover:not(:disabled) { border-color: var(--honey-500); color: var(--honey-500); }
    .btn-danger { background: none; border: 1px solid rgba(196,67,46,0.3); color: var(--alert-500); }
    .btn-danger:hover:not(:disabled) { background: rgba(196,67,46,0.06); }
  `]
})
export class JournalDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private service = inject(JournalService);
  private toast = inject(ToastService);

  loading = signal(true);
  journal = signal<Journal | null>(null);
  deleting = signal(false);

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;
    this.service.getById(id).subscribe({
      next: j => { this.journal.set(j); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  edit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.router.navigate(['/journaux', id, 'edit']);
  }

  remove() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;
    this.deleting.set(true);
    this.service.delete(id).subscribe({
      next: () => { this.toast.success('Journal supprimé.'); this.router.navigate(['/journaux']); },
      error: () => { this.deleting.set(false); this.toast.error('Erreur lors de la suppression.'); },
    });
  }
}
