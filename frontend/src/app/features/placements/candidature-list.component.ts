import { Component, OnInit, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DatePipe } from '@angular/common';
import { ToastService } from '../../core/toast.service';

interface Candidature {
  _id: string;
  offreId: { _id: string; titre: string };
  statut: string;
  createdAt: string;
}

@Component({
  selector: 'app-candidature-list',
  standalone: true,
  imports: [DatePipe],
  template: `
    <div class="section">
      <div class="page-header">
        <h1>Mes candidatures</h1>
      </div>

      @if (loading()) {
        <div class="skeleton-list">
          @for (s of [1,2,3]; track s) {
            <div class="skeleton-card">
              <div class="skeleton-line w-60"></div>
              <div class="skeleton-line w-90"></div>
              <div class="skeleton-line w-40"></div>
            </div>
          }
        </div>
      } @else if (candidatures().length === 0) {
        <div class="empty-state">
          <h3>Aucune candidature</h3>
          <p>Vous n'avez pas encore postulé à une offre.</p>
        </div>
      } @else {
        <div class="candidatures-list">
          @for (c of candidatures(); track c._id) {
            <div class="candidature-card">
              <div class="card-top">
                <h3>{{ c.offreId?.titre || 'Offre' }}</h3>
                <span class="statut-badge" [class]="'statut-' + c.statut">{{ statutLabel(c.statut) }}</span>
              </div>
              <p class="date">Postulé le {{ c.createdAt | date:'dd/MM/yyyy' }}</p>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    :host { display: block; }
    .page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 28px; }
    .page-header h1 { font-size: 1.5rem; margin: 0; }
    .skeleton-list { display: flex; flex-direction: column; gap: 16px; }
    .skeleton-card { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 20px; }
    .skeleton-line { height: 14px; border-radius: 4px; background: linear-gradient(90deg,var(--color-border) 25%,var(--color-surface) 50%,var(--color-border) 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; margin-bottom: 10px; }
    .skeleton-line:last-child { margin-bottom: 0; }
    .w-40 { width: 40%; } .w-60 { width: 60%; } .w-90 { width: 90%; }
    @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
    .empty-state { text-align: center; padding: 60px 20px; }
    .empty-state h3 { color: var(--color-text-secondary); margin-bottom: 4px; }
    .empty-state p { margin: 0; font-size: 0.85rem; }
    .candidatures-list { display: flex; flex-direction: column; gap: 12px; }
    .candidature-card { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 20px; box-shadow: var(--shadow-card); }
    .card-top { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 8px; }
    .card-top h3 { font-size: 1.05rem; margin: 0; }
    .date { font-size: 0.85rem; color: var(--color-text-secondary); margin: 0; }
    .statut-badge { display: inline-block; padding: 2px 10px; border-radius: 999px; font-size: 0.72rem; font-weight: 600; text-transform: capitalize; }
    .statut-en_attente { background: rgba(217,160,43,0.1); color: var(--honey-600); }
    .statut-acceptee { background: rgba(31,158,109,0.1); color: var(--verify-500); }
    .statut-refusee { background: rgba(196,67,46,0.1); color: var(--alert-500); }
  `]
})
export class CandidatureListComponent implements OnInit {
  private http = inject(HttpClient);
  private toast = inject(ToastService);

  candidatures = signal<Candidature[]>([]);
  loading = signal(true);

  ngOnInit() {
    const membreId = localStorage.getItem('membreId');
    this.http.get<Candidature[]>('/api/placements/candidatures?membreId=' + (membreId || '')).subscribe({
      next: list => this.candidatures.set(list),
      error: () => this.toast.error('Impossible de charger les candidatures.'),
      complete: () => this.loading.set(false),
    });
  }

  statutLabel(statut: string): string {
    const map: Record<string, string> = {
      en_attente: 'En attente',
      acceptee: 'Acceptée',
      refusee: 'Refusée',
    };
    return map[statut] || statut;
  }
}
