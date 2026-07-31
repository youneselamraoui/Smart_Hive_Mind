import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { StructureRechercheService, StructureRecherche } from './structure-recherche.service';
import { ToastService } from '../../core/toast.service';

@Component({
  selector: 'app-structure-detail',
  standalone: true,
  imports: [RouterLink, DatePipe],
  template: `
    <div class="page">
      <a routerLink="/structures-recherche" class="back-link">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="15 18 9 12 15 6"/></svg>
        Toutes les structures
      </a>

      @if (loading()) {
        <div class="loading-center"><div class="spin"></div><span>Chargement…</span></div>
      } @else { @let s = structure();
        <div class="detail-card">
          <div class="structure-hero">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--honey-500)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18"/><path d="M5 21V7l7-4 7 4v14"/><path d="M9 9h1"/><path d="M14 9h1"/><path d="M9 12h1"/><path d="M14 12h1"/><path d="M9 15h1"/><path d="M14 15h1"/><path d="M9 18h1"/><path d="M14 18h1"/></svg>
            <div class="structure-hero-text">
              <h1>{{ s?.nom }}</h1>
              <span class="structure-type" [class]="'type--' + s?.type">{{ typeLabel(s?.type) }}</span>
            </div>
          </div>

          @if (s?.axes?.length) {
            <div class="structure-axes">
              @for (a of s?.axes; track a) {
                <span class="structure-axe">{{ a }}</span>
              }
            </div>
          }

          <div class="structure-info">
            <div class="si-row"><span class="si-label">Créée le</span><span class="si-value">{{ s?.createdAt | date:'dd MMM yyyy' }}</span></div>
            <div class="si-row"><span class="si-label">Membres</span><span class="si-value">{{ s?.membres?.length || 0 }}</span></div>
            <div class="si-row"><span class="si-label">Productions</span><span class="si-value">{{ s?.productions?.length || 0 }}</span></div>
          </div>

          @if (s?.membres?.length) {
            <div class="section">
              <h3>Membres</h3>
              <div class="member-list">
                @for (m of s?.membres; track m._id || m) {
                  <div class="member-row">
                    <span class="member-name">{{ m.nom || m.prenom || 'Membre #' + m._id }}</span>
                    <span class="member-email">{{ m.email || '' }}</span>
                  </div>
                }
              </div>
            </div>
          }

          @if (s?.productions?.length) {
            <div class="section">
              <h3>Productions</h3>
              <div class="production-list">
                @for (p of s?.productions; track p._id || p) {
                  <div class="production-row">
                    <span class="production-title">{{ p.titre || 'Production #' + p._id }}</span>
                    <span class="production-date">{{ p.createdAt ? (p.createdAt | date:'dd MMM yyyy') : '' }}</span>
                  </div>
                }
              </div>
            </div>
          }

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

    .structure-hero { display: flex; align-items: center; gap: 16px; }
    .structure-hero svg { flex-shrink: 0; }
    .structure-hero-text { flex: 1; }
    .structure-hero-text h1 { font-size: var(--text-xl); margin: 0 0 6px; }
    .structure-type { font-size: var(--text-xs); font-weight: 600; padding: 3px 10px; border-radius: 999px; text-transform: capitalize; }
    .type--centre { background: rgba(91,79,224,0.08); color: var(--agentic-500); }
    .type--laboratoire { background: rgba(31,158,109,0.1); color: var(--verify-500); }
    .type--equipe { background: rgba(217,160,43,0.1); color: var(--honey-600); }

    .structure-axes { display: flex; flex-wrap: wrap; gap: 6px; }
    .structure-axe { font-size: var(--text-xs); font-weight: 500; padding: 2px 10px; border-radius: 999px; background: rgba(91,79,224,0.08); color: var(--agentic-500); }

    .structure-info { background: var(--paper-50); border: 1px solid var(--line-200); border-radius: var(--radius-sm); padding: 12px 16px; display: flex; flex-direction: column; gap: 6px; }
    .si-row { display: flex; justify-content: space-between; font-size: var(--text-sm); }
    .si-label { color: var(--ink-700); }
    .si-value { font-weight: 500; }

    .section h3 { font-size: var(--text-sm); font-weight: 600; margin: 0 0 10px; }
    .member-list, .production-list { display: flex; flex-direction: column; gap: 6px; }
    .member-row, .production-row { display: flex; justify-content: space-between; font-size: var(--text-sm); padding: 8px 12px; border: 1px solid var(--line-200); border-radius: var(--radius-sm); }
    .member-name, .production-title { font-weight: 500; }
    .member-email, .production-date { color: var(--ink-700); }

    .detail-actions { display: flex; gap: 10px; border-top: 1px solid var(--line-200); padding-top: 16px; }
    .btn { display: inline-flex; align-items: center; gap: 8px; padding: 10px 22px; border-radius: var(--radius-md); font-family: var(--font-body); font-size: var(--text-sm); font-weight: 600; cursor: pointer; transition: all var(--transition); }
    .btn:disabled { opacity: 0.4; cursor: not-allowed; }
    .btn-outline { background: var(--color-surface); border: 1px solid var(--line-200); color: var(--ink-900); }
    .btn-outline:hover:not(:disabled) { border-color: var(--honey-500); color: var(--honey-500); }
    .btn-danger { background: none; border: 1px solid rgba(196,67,46,0.3); color: var(--alert-500); }
    .btn-danger:hover:not(:disabled) { background: rgba(196,67,46,0.06); }
  `]
})
export class StructureDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private service = inject(StructureRechercheService);
  private toast = inject(ToastService);

  loading = signal(true);
  structure = signal<StructureRecherche | null>(null);
  deleting = signal(false);

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;
    this.service.getById(id).subscribe({
      next: s => { this.structure.set(s); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  edit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.router.navigate(['/structures-recherche', id, 'edit']);
  }

  remove() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;
    this.deleting.set(true);
    this.service.delete(id).subscribe({
      next: () => { this.toast.success('Structure supprimée.'); this.router.navigate(['/structures-recherche']); },
      error: () => { this.deleting.set(false); this.toast.error('Erreur lors de la suppression.'); },
    });
  }

  typeLabel(type?: string): string {
    const labels: Record<string, string> = { centre: 'Centre', laboratoire: 'Laboratoire', equipe: 'Équipe' };
    return type ? (labels[type] || type) : '—';
  }
}
