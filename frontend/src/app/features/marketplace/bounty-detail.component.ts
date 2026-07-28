import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../core/toast.service';

function daysLeft(dateStr: string): string {
  if (!dateStr) return '';
  const diff = Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
  if (diff < 0) return 'Expiré';
  if (diff === 0) return 'Dernier jour';
  return 'J-' + diff;
}

@Component({
  selector: 'app-bounty-detail',
  standalone: true,
  imports: [DatePipe, FormsModule, RouterLink],
  template: `
    <div class="page">
      <a routerLink="/marketplace" class="back-link">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="15 18 9 12 15 6"/></svg>
        Marketplace
      </a>

      @if (!bounty) {
        <div class="loading-center"><div class="spin"></div><span>Chargement…</span></div>
      } @else { @let b = bounty;
        <div class="detail-card">
          <!-- Hero reward block -->
          <div class="bounty-hero">
            <svg width="64" height="64" viewBox="0 0 100 100" fill="none" stroke="var(--honey-500)" stroke-width="2.5"><polygon points="50 5 90 27.5 90 72.5 50 95 10 72.5 10 27.5"/><polygon points="50 18 78 32 78 60 50 82 22 60 22 32" fill="none" stroke="var(--honey-500)" stroke-width="1.5"/><circle cx="50" cy="45" r="8" fill="none" stroke="var(--honey-500)" stroke-width="1.5"/></svg>
            <div class="bounty-hero-text">
              <h1>{{ b.titre }}</h1>
              <div class="bounty-hero-meta">
                <span class="bounty-reward">{{ b.recompense }}</span>
                <span class="bounty-countdown">{{ daysLeft(b.delai) }}</span>
              </div>
            </div>
          </div>

          <p class="bounty-desc">{{ b.description }}</p>

          <div class="bounty-info">
            <div class="bi-row"><span class="bi-label">Délai</span><span class="bi-value">{{ b.delai | date:'dd MMM yyyy' }}</span></div>
            <div class="bi-row"><span class="bi-label">Soumissions</span><span class="bi-value">{{ b.soumissions?.length || 0 }}</span></div>
            @if (b.gagnantId) { <div class="bi-row"><span class="bi-label">Statut</span><span class="bi-value text--verify">Attribuée</span></div> }
          </div>

          <button class="btn btn-honey" (click)="showSoumettreForm.set(!showSoumettreForm())">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
            Soumettre une solution
          </button>

          @if (showSoumettreForm()) {
            <div class="submit-section">
              <h3>Soumettre une solution</h3>
              <textarea class="input input--ta" [(ngModel)]="solution" rows="4" placeholder="Décrivez votre solution…"></textarea>
              <button class="btn btn-primary" [disabled]="!solution.trim()" (click)="submit()">Envoyer</button>
              @if (error) { <div class="msg msg--error">{{ error }}</div> }
              @if (success) { <div class="msg msg--success">{{ success }}</div> }
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    :host { display: block; }
    .page { max-width: 700px; }
    .back-link { display: inline-flex; align-items: center; gap: 6px; color: var(--ink-700); text-decoration: none; font-size: var(--text-sm); margin-bottom: 16px; }
    .back-link:hover { color: var(--honey-500); }
    .loading-center { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 60px; color: var(--ink-700); }
    .spin { width: 24px; height: 24px; border: 2px solid var(--line-200); border-top-color: var(--honey-500); border-radius: 50%; animation: sp 0.7s linear infinite; }
    @keyframes sp { to { transform: rotate(360deg); } }

    .detail-card { background: var(--color-surface); border: 1px solid var(--line-200); border-radius: var(--radius-md); padding: 24px; display: flex; flex-direction: column; gap: 16px; }

    .bounty-hero { display: flex; align-items: center; gap: 16px; }
    .bounty-hero svg { flex-shrink: 0; }
    .bounty-hero-text { flex: 1; }
    .bounty-hero-text h1 { font-size: var(--text-xl); margin: 0 0 6px; }
    .bounty-hero-meta { display: flex; align-items: center; gap: 14px; }
    .bounty-reward { font-family: var(--font-heading); font-size: var(--text-2xl); font-weight: 700; color: var(--ink-900); }
    .bounty-countdown { font-family: var(--font-mono); font-size: var(--text-sm); font-weight: 600; padding: 4px 12px; border-radius: 999px; background: rgba(217,160,43,0.1); color: var(--honey-600); }

    .bounty-desc { font-size: var(--text-sm); line-height: 1.6; color: var(--ink-700); margin: 0; }

    .bounty-info { background: var(--paper-50); border: 1px solid var(--line-200); border-radius: var(--radius-sm); padding: 12px 16px; display: flex; flex-direction: column; gap: 6px; }
    .bi-row { display: flex; justify-content: space-between; font-size: var(--text-sm); }
    .bi-label { color: var(--ink-700); }
    .bi-value { font-weight: 500; }
    .text--verify { color: var(--verify-500); }

    .btn { display: inline-flex; align-items: center; gap: 8px; padding: 10px 22px; border: none; border-radius: var(--radius-md); font-family: var(--font-body); font-size: var(--text-sm); font-weight: 600; cursor: pointer; transition: all var(--transition); }
    .btn:disabled { opacity: 0.4; cursor: not-allowed; }
    .btn-honey { background: var(--honey-500); color: var(--ink-900); width: fit-content; }
    .btn-honey:hover { background: var(--honey-600); }
    .btn-primary { background: var(--honey-500); color: var(--ink-900); }
    .btn-primary:hover:not(:disabled) { background: var(--honey-600); }

    .submit-section { border-top: 1px solid var(--line-200); padding-top: 16px; display: flex; flex-direction: column; gap: 10px; }
    .submit-section h3 { font-size: var(--text-sm); font-weight: 600; margin: 0; }
    .input { padding: 10px 14px; border: 1px solid var(--line-200); border-radius: var(--radius-sm); font-family: var(--font-body); font-size: var(--text-sm); outline: none; background: var(--color-surface); color: var(--ink-900); transition: border-color var(--transition); }
    .input:focus { border-color: var(--honey-500); }
    .input--ta { resize: vertical; min-height: 80px; }

    .msg { font-size: var(--text-sm); padding: 10px 14px; border-radius: var(--radius-md); }
    .msg--error { color: var(--alert-500); background: rgba(196,67,46,0.06); }
    .msg--success { color: var(--verify-500); background: rgba(31,158,109,0.06); }
  `]
})
export class BountyDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);
  private toast = inject(ToastService);
  bounty?: any;
  solution = '';
  showSoumettreForm = signal(false);
  error = '';
  success = '';
  daysLeft = daysLeft;

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.http.get<any>('/api/bounties/' + id).subscribe(b => this.bounty = b);
  }

  submit() {
    if (!this.solution.trim()) { this.error = 'Veuillez décrire votre solution.'; return; }
    this.http.post<any>('/api/bounties/' + this.route.snapshot.paramMap.get('id') + '/soumettre', { solution: this.solution }).subscribe({
      next: () => { this.success = 'Solution soumise avec succès.'; this.error = ''; this.toast.success('Solution soumise.'); this.solution = ''; this.showSoumettreForm.set(false); },
      error: err => { this.error = err.error?.error || 'Erreur lors de la soumission.'; this.toast.error(this.error); },
    });
  }
}
