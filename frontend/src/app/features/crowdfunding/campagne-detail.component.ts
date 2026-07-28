import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../core/toast.service';

interface Campagne {
  _id: string;
  projetId: { _id: string; titre: string };
  objectifFinancier: number;
  contreparties: string[];
  dureeJours: number;
  fondsCollectes: number;
  createdAt: string;
}

@Component({
  selector: 'app-campagne-detail',
  standalone: true,
  imports: [RouterLink, DecimalPipe, FormsModule],
  template: `
    <div class="section">
      <div class="page-header">
        <h1>Campagne</h1>
        <a class="btn-outline-sm" routerLink="/crowdfunding">Retour</a>
      </div>

      @if (loading()) {
        <div class="skeleton-card">
          <div class="skeleton-line w-60"></div>
          <div class="skeleton-line w-90"></div>
          <div class="skeleton-line w-40"></div>
        </div>
      } @else if (c(); as c) {
        <div class="campagne-card">
          <h2>{{ c.projetId?.titre || 'Campagne' }}</h2>
          <p class="target">Objectif: <strong>{{ c.objectifFinancier | number }} F</strong> &middot; Collectés: <strong>{{ c.fondsCollectes | number }} F</strong></p>
          <div class="progress-bar">
            <div class="progress-fill" [style.width.%]="progression(c)"></div>
            <span class="progress-label">{{ progression(c) }}%</span>
          </div>
          @if (c.contreparties?.length) {
            <div class="contreparties">
              <strong>Contreparties:</strong>
              <ul>@for (cp of c.contreparties; track cp) { <li>{{ cp }}</li> }</ul>
            </div>
          }
          <div class="contrib-form">
            <label for="montant">Montant</label>
            <div class="input-group">
              <span class="input-currency">F</span>
              <input id="montant" type="number" [(ngModel)]="montant" placeholder="Montant" min="1" />
            </div>
            <button class="btn-contrib" (click)="contribuer()" [disabled]="!montant || montant <= 0">
              Contribuer
            </button>
          </div>
          @if (error()) { <div class="msg msg-error">{{ error() }}</div> }
          @if (success()) { <div class="msg msg-success">{{ success() }}</div> }
        </div>
      }
    </div>
  `,
  styles: [`
    :host { display: block; }
    .page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 28px; }
    .page-header h1 { font-size: 1.5rem; margin: 0; }
    .btn-outline-sm { padding: 6px 14px; border: 1.5px solid var(--color-border); border-radius: var(--radius-sm); font-size: 0.78rem; color: var(--color-text-secondary); text-decoration: none; }
    .skeleton-card { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 24px; }
    .skeleton-line { height: 14px; border-radius: 4px; background: linear-gradient(90deg,var(--color-border) 25%,var(--color-surface) 50%,var(--color-border) 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; margin-bottom: 12px; }
    .skeleton-line:last-child { margin-bottom: 0; }
    .w-40 { width: 40%; } .w-60 { width: 60%; } .w-90 { width: 90%; }
    @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
    .campagne-card { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 24px; box-shadow: var(--shadow-card); }
    .campagne-card h2 { font-size: 1.2rem; margin-bottom: 8px; }
    .target { font-size: 0.9rem; color: var(--color-text-secondary); margin-bottom: 14px; }
    .progress-bar { position: relative; height: 24px; background: var(--color-cream-light); border-radius: 999px; overflow: hidden; margin-bottom: 16px; }
    .progress-fill { height: 100%; background: linear-gradient(90deg, var(--color-primary-blue), var(--color-sky-blue)); border-radius: 999px; transition: width 0.5s ease; }
    .progress-label { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: 600; }
    .contreparties { font-size: 0.88rem; margin-bottom: 16px; padding: 12px; background: var(--color-cream-light); border-radius: var(--radius-sm); }
    .contreparties ul { margin: 4px 0 0 18px; }
    .contreparties li { margin-bottom: 2px; }
    .contrib-form { display: flex; align-items: flex-end; gap: 10px; flex-wrap: wrap; margin-bottom: 10px; }
    .contrib-form label { font-weight: 600; font-size: 0.85rem; display: none; }
    .input-group { display: flex; align-items: center; background: var(--color-cream-light); border: 1.5px solid var(--color-border); border-radius: var(--radius-sm); overflow: hidden; }
    .input-group:focus-within { border-color: var(--color-primary-blue); box-shadow: 0 0 0 3px rgba(37,99,235,0.1); background: #fff; }
    .input-currency { padding: 0 0 0 12px; font-weight: 600; color: var(--color-text-secondary); }
    .input-group input { border: none; background: none; padding: 10px 12px; font-size: 0.95rem; font-family: var(--font-sans); width: 120px; outline: none; }
    .btn-contrib { padding: 10px 20px; background: linear-gradient(135deg, var(--honey-500), var(--honey-600)); color: var(--ink-900); border: none; border-radius: var(--radius-sm); font-size: 0.88rem; font-weight: 600; cursor: pointer; }
    .btn-contrib:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 5px 16px rgba(225,29,72,0.35); }
    .btn-contrib:disabled { opacity: 0.5; cursor: not-allowed; }
    .msg { padding: 8px 14px; border-radius: var(--radius-sm); font-size: 0.85rem; font-weight: 500; margin-top: 8px; }
    .msg-error { background: rgba(196,67,46,0.08); border: 1px solid rgba(196,67,46,0.25); color: var(--alert-500); }
    .msg-success { background: rgba(31,158,109,0.08); border: 1px solid rgba(31,158,109,0.25); color: var(--verify-500); }
  `]
})
export class CampagneDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);
  private toast = inject(ToastService);

  c = signal<Campagne | null>(null);
  loading = signal(true);
  montant = 0;
  error = signal('');
  success = signal('');

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.http.get<Campagne[]>('/api/entrepreneuriat/campagnes').subscribe({
        next: list => {
          const found = list.find(x => x._id === id);
          this.c.set(found || null);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
    }
  }

  progression(c: Campagne) {
    if (!c.objectifFinancier) return 0;
    return Math.round((c.fondsCollectes / c.objectifFinancier) * 100);
  }

  contribuer() {
    const campagne = this.c();
    if (!campagne || !this.montant || this.montant <= 0) return;
    this.error.set('');
    this.success.set('');
    this.http.post<any>('/api/entrepreneuriat/campagnes/contribute', {
      campagneId: campagne._id,
      montant: this.montant,
    }).subscribe({
      next: (res) => {
        campagne.fondsCollectes = res.campagne?.fondsCollectes ?? campagne.fondsCollectes;
        this.c.set({ ...campagne });
        this.success.set('Contribution enregistrée.');
        this.toast.success('Contribution enregistrée.');
        this.montant = 0;
      },
      error: (err) => {
        const msg = err.error?.error || 'Erreur lors de la contribution.';
        this.error.set(msg);
        this.toast.error(msg);
      },
    });
  }
}
