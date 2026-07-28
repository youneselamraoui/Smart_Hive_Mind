import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { DatePipe } from '@angular/common';
import { HexSealComponent } from '../../core/hex-seal.component';
import { ToastService } from '../../core/toast.service';

@Component({
  selector: 'app-publication-detail',
  standalone: true,
  imports: [RouterLink, DatePipe, HexSealComponent],
  template: `
    <div class="detail-page">
      <a routerLink="/publications" class="back-link">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="15 18 9 12 15 6"/></svg>
        Toutes les publications
      </a>

      @if (loading()) {
        <div class="skeleton-block">
          @for (i of [1,2,3,4]; track i) { <div class="skeleton-line" [style.width.%]="[60,90,80,40][i-1]"></div> }
        </div>
      } @else { @let p = pub();
        <div class="detail-layout">
          <!-- Main column -->
          <div class="detail-main">
            <div class="detail-header">
              <h1>{{ p?.titre }}</h1>
              <div class="detail-meta">
                <span class="pub-type" [class]="'type--' + (p?.type || 'libre')">{{ p?.type }}</span>
                <span class="pub-date">{{ p?.createdAt | date:'dd MMM yyyy · HH:mm' }}</span>
              </div>
            </div>

            <div class="pub-content">{{ p?.contenu }}</div>

            @if (evalResult() || evalError()) {
              <div class="section">
                <h2>Évaluations</h2>
                @if (evalResult()) { @let er = evalResult();
                  <div class="eval-grid">
                    <div class="eval-card eval--pairs">
                      <div class="eval-icon" [innerHTML]="evalIcons.pairs"></div>
                      <span class="eval-label">Pairs</span>
                      <span class="eval-score">{{ ((er?.evaluation?.scoreGlobal ?? 0) * 100).toFixed(0) }}%</span>
                    </div>
                    <div class="eval-card eval--experts">
                      <div class="eval-icon" [innerHTML]="evalIcons.experts"></div>
                      <span class="eval-label">Experts</span>
                      <span class="eval-score">{{ ((er?.evaluation?.scoreGlobal ?? 0) * 100).toFixed(0) }}%</span>
                    </div>
                    <div class="eval-card eval--ia">
                      <div class="eval-icon" [innerHTML]="evalIcons.ia"></div>
                      <span class="eval-label">IA</span>
                      <span class="eval-score">{{ ((er?.evaluation?.scoreGlobal ?? 0) * 100).toFixed(0) }}%</span>
                    </div>
                  </div>
                }
                @if (evalError()) {
                  <div class="msg msg--error">{{ evalError() }}</div>
                }
              </div>
            }
          </div>

          <!-- Sidebar column -->
          <div class="detail-side">
            <!-- Proof block -->
            <div class="proof-block">
              <div class="proof-head">
                <app-hex-seal [status]="sealStatus(p)" [size]="44"></app-hex-seal>
                <div>
                  <span class="proof-title">Preuve blockchain</span>
                  <span class="proof-statut" [class]="'statut--' + sealStatus(p)">{{ sealLabel(p) }}</span>
                </div>
              </div>

              <div class="proof-hash-box">
                <span class="proof-hash-label">Hash du contenu</span>
                <span class="proof-hash-value">{{ (p?.hashContenu || p?.preuve?.txHash) ?? '—' }}</span>
                <button class="proof-copy" (click)="copyHash(p)">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                  Copier le hash
                </button>
              </div>

              @if (p?.preuve?.statut === 'ancre' || p?.preuve?.statut === 'ancree') {
                <a class="proof-sepolia" [href]="etherscanUrl()" target="_blank" rel="noopener noreferrer">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                  Vérifier sur Sepolia
                </a>
              }

              @if (p?.preuve?.blockNumber) {
                <div class="proof-detail">
                  <span class="pd-label">Block</span>
                  <span class="pd-value">{{ p?.preuve?.blockNumber }}</span>
                </div>
              }
            </div>

            <!-- Actions -->
            <div class="side-actions">
              @if ((p?.auteur?._id || p?.auteur) === currentUserId) {
                <button class="btn btn-outline" (click)="edit()">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                  Modifier
                </button>
              }
              <button class="btn btn-outline" [disabled]="verifying()" (click)="verify()">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>
                {{ verifying() ? 'Vérification…' : 'Vérifier la preuve' }}
              </button>
              <button class="btn btn-agentic" [disabled]="evaluating()" (click)="evaluate()">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/></svg>
                {{ evaluating() ? 'Évaluation…' : 'Évaluer par IA' }}
              </button>
            </div>

            <!-- Verify result -->
            @if (verifyResult()) {
              <div class="side-result side-result--success">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                <span>Preuve vérifiée sur la blockchain</span>
              </div>
            }
            @if (verifyError()) {
              <div class="side-result side-result--error">{{ verifyError() }}</div>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    :host { display: block; }
    .detail-page { position: relative; }

    .back-link { display: inline-flex; align-items: center; gap: 6px; color: var(--ink-700); text-decoration: none; font-size: var(--text-sm); margin-bottom: 20px; transition: color var(--transition); }
    .back-link:hover { color: var(--honey-500); }

    .skeleton-block { background: var(--color-surface); border: 1px solid var(--line-200); border-radius: var(--radius-md); padding: 24px; }
    .skeleton-line { height: 14px; border-radius: 4px; background: var(--line-200); margin-bottom: 12px; animation: shimmer 1.5s infinite; }
    @keyframes shimmer { 0%{opacity:0.5} 50%{opacity:1} 100%{opacity:0.5} }

    .detail-layout { display: flex; gap: 32px; align-items: flex-start; }

    .detail-main { flex: 1; max-width: 680px; }
    .detail-side { width: 280px; flex-shrink: 0; position: sticky; top: 88px; display: flex; flex-direction: column; gap: 16px; }
    @media (max-width: 860px) { .detail-layout { flex-direction: column; } .detail-side { width: 100%; position: static; } }

    .detail-header { margin-bottom: 28px; }
    .detail-header h1 { font-size: var(--text-3xl); margin: 0 0 10px; }
    .detail-meta { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }

    .pub-type { font-size: var(--text-xs); font-weight: 600; padding: 2px 10px; border-radius: 999px; text-transform: uppercase; letter-spacing: 0.04em; }
    .type--these { background: rgba(91,79,224,0.1); color: var(--agentic-500); }
    .type--pfe { background: rgba(31,158,109,0.1); color: var(--verify-500); }
    .type--pfa { background: rgba(217,160,43,0.1); color: var(--honey-600); }
    .type--libre { background: rgba(42,47,69,0.08); color: var(--ink-700); }
    .type--scientifique { background: rgba(91,79,224,0.08); color: var(--agentic-500); }
    .pub-date { font-size: var(--text-xs); font-family: var(--font-mono); color: var(--ink-700); opacity: 0.7; }

    .pub-content { font-family: var(--font-body); font-size: var(--text-base); line-height: 1.7; white-space: pre-wrap; color: var(--ink-900); }

    .section { margin-top: 40px; }
    .section h2 { font-size: var(--text-xl); margin-bottom: 16px; }

    .eval-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
    .eval-card { display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 16px; border: 1px solid var(--line-200); border-radius: var(--radius-md); text-align: center; }
    .eval-icon { width: 32px; height: 32px; }
    .eval-icon :deep(svg) { width: 100%; height: 100%; }
    .eval--pairs .eval-icon { color: var(--ink-700); }
    .eval--experts .eval-icon { color: var(--honey-500); }
    .eval--ia .eval-icon { color: var(--agentic-500); }
    .eval-label { font-size: var(--text-xs); font-weight: 500; color: var(--ink-700); text-transform: uppercase; letter-spacing: 0.04em; }
    .eval-score { font-family: var(--font-heading); font-size: var(--text-xl); font-weight: 700; color: var(--ink-900); }
    @media (max-width: 480px) { .eval-grid { grid-template-columns: 1fr; } }

    .msg { font-size: var(--text-sm); padding: 10px 14px; border-radius: var(--radius-md); }
    .msg--error { color: var(--alert-500); background: rgba(196,67,46,0.06); }

    /* Proof block */
    .proof-block { background: var(--ink-900); color: var(--paper-50); border-radius: var(--radius-md); padding: 20px; display: flex; flex-direction: column; gap: 16px; }
    .proof-head { display: flex; align-items: center; gap: 12px; }
    .proof-title { display: block; font-size: var(--text-sm); font-weight: 600; }
    .proof-statut { display: block; font-size: var(--text-xs); font-weight: 500; font-family: var(--font-mono); }
    .statut--valide { color: var(--verify-500); }
    .statut--en_attente { color: var(--honey-500); }
    .statut--echec { color: var(--alert-500); }

    .proof-hash-box { background: rgba(0,0,0,0.3); border-radius: var(--radius-sm); padding: 12px; display: flex; flex-direction: column; gap: 8px; }
    .proof-hash-label { font-size: 0.65rem; text-transform: uppercase; letter-spacing: 0.06em; opacity: 0.5; }
    .proof-hash-value { font-family: var(--font-mono); font-size: 0.75rem; word-break: break-all; line-height: 1.5; }
    .proof-copy { display: inline-flex; align-items: center; gap: 6px; background: none; border: 1px solid rgba(246,245,242,0.2); color: var(--paper-50); padding: 6px 12px; border-radius: var(--radius-sm); font-family: var(--font-body); font-size: var(--text-xs); cursor: pointer; transition: all var(--transition); }
    .proof-copy:hover { background: rgba(246,245,242,0.1); }

    .proof-sepolia { display: inline-flex; align-items: center; gap: 6px; color: var(--honey-500); font-size: var(--text-sm); font-weight: 500; text-decoration: none; transition: opacity var(--transition); }
    .proof-sepolia:hover { opacity: 0.8; text-decoration: underline; }

    .proof-detail { display: flex; justify-content: space-between; font-size: var(--text-xs); }
    .pd-label { opacity: 0.5; }
    .pd-value { font-family: var(--font-mono); }

    .side-actions { display: flex; flex-direction: column; gap: 8px; }
    .btn { display: flex; align-items: center; justify-content: center; gap: 8px; padding: 10px 16px; border-radius: var(--radius-md); font-family: var(--font-body); font-size: var(--text-sm); font-weight: 500; cursor: pointer; transition: all var(--transition); text-decoration: none; }
    .btn:disabled { opacity: 0.45; cursor: not-allowed; }
    .btn-outline { background: var(--color-surface); border: 1px solid var(--line-200); color: var(--ink-900); }
    .btn-outline:hover:not(:disabled) { border-color: var(--honey-500); color: var(--honey-500); }
    .btn-agentic { background: rgba(91,79,224,0.08); border: 1px solid rgba(91,79,224,0.2); color: var(--agentic-500); }
    .btn-agentic:hover:not(:disabled) { background: rgba(91,79,224,0.15); }

    .side-result { font-size: var(--text-sm); padding: 10px 14px; border-radius: var(--radius-md); display: flex; align-items: center; gap: 8px; }
    .side-result--success { color: var(--verify-500); background: rgba(31,158,109,0.06); }
    .side-result--error { color: var(--alert-500); background: rgba(196,67,46,0.06); }
  `]
})
export class PublicationDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);
  private router = inject(Router);
  private toast = inject(ToastService);
  loading = signal(true);
  pub = signal<any>(null);
  verifying = signal(false);
  evaluating = signal(false);
  verifyResult = signal<any>(null);
  verifyError = signal<string | null>(null);
  evalResult = signal<any>(null);
  evalError = signal<string | null>(null);
  currentUserId = localStorage.getItem('membreId') || '';

  evalIcons = {
    pairs: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
    experts: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 1 0-16 0"/><path d="M12 3c.7 0 1.37.1 2 .29"/></svg>`,
    ia: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,
  };

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;
    this.http.get<any>('/api/publications/' + id).subscribe({
      next: p => { this.pub.set(p); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  sealStatus(p: any): 'valide' | 'en_attente' | 'echec' {
    const s = p?.preuve?.statut;
    if (s === 'ancre' || s === 'ancree') return 'valide';
    if (s === 'en_attente') return 'en_attente';
    if (s === 'echec') return 'echec';
    return 'en_attente';
  }

  sealLabel(p: any): string {
    const s = p?.preuve?.statut;
    if (s === 'ancre' || s === 'ancree') return 'Ancrée';
    if (s === 'en_attente') return 'En attente';
    if (s === 'echec') return 'Échec';
    return 'Non soumise';
  }

  etherscanUrl(): string {
    return 'https://sepolia.etherscan.io/tx/' + (this.pub()?.preuve?.txHash || '');
  }

  edit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.router.navigate(['/publications', id, 'edit']);
  }

  copyHash(p: any) {
    const hash = p?.hashContenu || p?.preuve?.txHash;
    if (hash) { navigator.clipboard.writeText(hash); this.toast.success('Hash copié'); }
  }

  verify() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;
    this.verifying.set(true); this.verifyResult.set(null); this.verifyError.set(null);
    this.http.get<any>('/api/publications/' + id + '/verify').subscribe({
      next: r => { this.verifyResult.set(r); this.verifying.set(false); },
      error: e => { this.verifyError.set(e.error?.error || 'Erreur de vérification'); this.verifying.set(false); },
    });
  }

  evaluate() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;
    this.evaluating.set(true); this.evalResult.set(null); this.evalError.set(null);
    this.http.post<any>('/api/publications/' + id + '/evaluate-ia', {}).subscribe({
      next: r => { this.evalResult.set(r); this.evaluating.set(false); },
      error: e => { this.evalError.set(e.error?.error || 'Erreur d\'évaluation'); this.evaluating.set(false); },
    });
  }
}

const evalIcons = {
  pairs: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  experts: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 1 0-16 0"/><path d="M12 3c.7 0 1.37.1 2 .29"/></svg>`,
  ia: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,
};
