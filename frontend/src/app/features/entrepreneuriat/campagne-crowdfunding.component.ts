import { Component, OnInit, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../core/toast.service';

@Component({
  selector: 'app-campagne-crowdfunding',
  standalone: true,
  imports: [DatePipe, DecimalPipe, FormsModule],
  template: `
    <div class="page">
      <div class="page-head"><div><h1>Campagne de Crowdfunding</h1></div></div>

      @if (loading()) {
        <div class="skel-k"><div class="skel-line w-50"></div><div class="skel-line w-70"></div><div class="skel-line w-40"></div></div>
      } @else { @if (campagne(); as c) {
        <div class="hero">
          <h2 class="hero-title">{{ c.titre }}</h2>
          <p class="hero-desc">{{ c.description }}</p>
        </div>

        <div class="progress-section">
          <div class="progress-bar">
            <div class="progress-fill" [style.width.%]="pct(c)"></div>
          </div>
          <div class="progress-meta">
            <span class="amount-collected">{{ c.montantCollecte | number:'1.0-0' }} <span>FCFA collectés</span></span>
            <span class="amount-goal">sur {{ c.objectif | number:'1.0-0' }} FCFA</span>
          </div>
        </div>

        @if (c.contributions?.length) {
          <div class="contrib-section">
            <h3>Contributions récentes</h3>
            <div class="contrib-list">
              @for (ct of c.contributions.slice(-5).reverse(); track ct._id) {
                <div class="contrib-row">
                  <span class="contrib-name">{{ ct.membre?.prenom || ct.membre?.nom || 'Anonyme' }}</span>
                  <span class="contrib-amount">{{ ct.montant | number:'1.0-0' }} FCFA</span>
                  <span class="contrib-date">{{ ct.date | date:'dd MMM' }}</span>
                </div>
              }
            </div>
          </div>
        }

        <div class="contribute-section">
          <h3>Participer</h3>
          <div class="contrib-form">
            <div class="form-row">
              <input class="input" type="number" [(ngModel)]="montant" placeholder="Montant (FCFA)" min="1" />
              <button class="btn btn-primary" [disabled]="!montant || montant <= 0 || submitting()" (click)="contribuer()">
                {{ submitting() ? 'Envoi…' : 'Contribuer' }}
              </button>
            </div>
          </div>
        </div>
      } @else {
        <div class="empty"><h3>Aucune campagne active</h3><p>Revenez plus tard.</p></div>
      }}
    </div>
  `,
  styles: [`
    .page { position: relative; }
    .page-head { margin-bottom: 20px; }
    .page-head h1 { font-size: var(--text-2xl); margin: 0; }

    .skel-k { display: flex; flex-direction: column; gap: 14px; padding: 40px 0; }
    .skel-line { height: 14px; border-radius: 6px; background: var(--line-200); animation: sh 1.5s infinite; }
    .w-50 { width: 50%; } .w-70 { width: 70%; } .w-40 { width: 40%; }
    @keyframes sh { 0%{opacity:0.5} 50%{opacity:1} 100%{opacity:0.5} }

    .empty { display: flex; flex-direction: column; align-items: center; padding: 60px 24px; }
    .empty h3 { font-size: var(--text-lg); margin: 0 0 4px; }
    .empty p { font-size: var(--text-sm); color: var(--ink-700); margin: 0; }

    .hero { margin-bottom: 28px; }
    .hero-title { font-size: var(--text-2xl); margin: 0 0 6px; }
    .hero-desc { font-size: var(--text-sm); color: var(--ink-700); margin: 0; }

    .progress-section { margin-bottom: 32px; }
    .progress-bar { height: 28px; background: var(--paper-100); border-radius: 999px; overflow: hidden; }
    .progress-fill { height: 100%; background: var(--honey-500); border-radius: 999px; transition: width 0.8s ease; }
    .progress-meta { display: flex; justify-content: space-between; align-items: baseline; margin-top: 10px; gap: 12px; }
    .amount-collected { font-family: var(--font-display); font-size: var(--text-xl); font-weight: 700; color: var(--ink-900); }
    .amount-collected span { font-family: var(--font-body); font-size: var(--text-sm); font-weight: 400; color: var(--ink-700); }
    .amount-goal { font-family: var(--font-body); font-size: var(--text-sm); color: var(--ink-700); }

    .contrib-section { margin-bottom: 28px; }
    .contrib-section h3 { font-size: var(--text-base); margin: 0 0 12px; }
    .contrib-list { display: flex; flex-direction: column; }
    .contrib-row { display: flex; align-items: center; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid var(--line-200); font-family: var(--font-mono); font-size: var(--text-sm); }
    .contrib-row:last-child { border-bottom: none; }
    .contrib-name { font-weight: 500; }
    .contrib-amount { color: var(--honey-600); font-weight: 600; }
    .contrib-date { color: var(--ink-700); }

    .contribute-section { }
    .contribute-section h3 { font-size: var(--text-base); margin: 0 0 10px; }
    .contrib-form { background: var(--color-surface); border: 1px solid var(--line-200); border-radius: var(--radius-md); padding: 16px; }
    .form-row { display: flex; gap: 10px; align-items: center; }
    .input { flex: 1; padding: 10px 14px; border: 1px solid var(--line-200); border-radius: var(--radius-sm); font-family: var(--font-body); font-size: var(--text-sm); outline: none; background: var(--color-surface); color: var(--ink-900); transition: border-color var(--transition); }
    .input:focus { border-color: var(--honey-500); }
    .btn { display: inline-flex; align-items: center; gap: 6px; padding: 10px 24px; border: none; border-radius: var(--radius-sm); font-family: var(--font-body); font-size: var(--text-sm); font-weight: 600; cursor: pointer; transition: all var(--transition); white-space: nowrap; }
    .btn:disabled { opacity: 0.4; cursor: not-allowed; }
    .btn-primary { background: var(--honey-500); color: var(--ink-900); }
    .btn-primary:hover:not(:disabled) { background: var(--honey-600); }
  `]
})
export class CampagneCrowdfundingComponent implements OnInit {
  private http = inject(HttpClient);
  private toast = inject(ToastService);
  campagne = signal<any>(null);
  loading = signal(true);
  submitting = signal(false);
  montant: number | null = null;

  ngOnInit() {
    this.http.get<any>('/api/entrepreneuriat/crowdfunding/campagne-active').subscribe({
      next: c => this.campagne.set(c),
      error: () => this.loading.set(false),
      complete: () => this.loading.set(false),
    });
  }

  pct(c: any): number {
    if (!c.objectif || c.objectif <= 0) return 0;
    return Math.min(100, Math.round((c.montantCollecte || 0) / c.objectif * 100));
  }

  contribuer() {
    const m = this.montant;
    if (!m || m <= 0) return;
    this.submitting.set(true);
    this.http.post<any>('/api/entrepreneuriat/crowdfunding/contribuer', { montant: m }).subscribe({
      next: res => {
        this.campagne.set(res.campagne);
        this.montant = null;
        this.submitting.set(false);
        this.toast.success('Merci pour votre contribution !');
      },
      error: err => { this.submitting.set(false); this.toast.error(err.error?.error || 'Erreur.'); },
    });
  }
}
