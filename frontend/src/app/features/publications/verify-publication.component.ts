import { Component, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { HexSealComponent } from '../../core/hex-seal.component';

@Component({
  selector: 'app-verify-publication',
  standalone: true,
  imports: [HexSealComponent],
  template: `
    <div class="verify-page">
      <div class="verify-card">
        <h1>Vérifier une preuve</h1>
        <p>Recherchez une publication par son hash d'ancrage blockchain.</p>

        <div class="verify-input-group">
          <input
            class="verify-input"
            [class.input--filled]="hashValue().length > 0"
            placeholder="0x…"
            (input)="onInput($event)"
            [value]="hashValue()"
            spellcheck="false"
          />
          <button class="verify-submit" [disabled]="!canVerify() || loading()" (click)="verify()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            {{ loading() ? 'Recherche…' : 'Rechercher' }}
          </button>
        </div>

        @if (error()) {
          <div class="verify-error">{{ error() }}</div>
        }

        @if (result(); as r) {
          <div class="certificate">
            <!-- Ornamental corners -->
            <svg class="cert-corner tl" width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M0 16V0h16" stroke="var(--honey-500)" stroke-width="1.5"/></svg>
            <svg class="cert-corner tr" width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M16 16V0H0" stroke="var(--honey-500)" stroke-width="1.5"/></svg>
            <svg class="cert-corner bl" width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M0 0v16h16" stroke="var(--honey-500)" stroke-width="1.5"/></svg>
            <svg class="cert-corner br" width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M16 0v16H0" stroke="var(--honey-500)" stroke-width="1.5"/></svg>

            <div class="cert-seal">
              <app-hex-seal status="valide" [size]="72"></app-hex-seal>
            </div>

            <h2 class="cert-title">Certificat d'ancrage</h2>
            <p class="cert-sub">Cette preuve est enregistrée sur Ethereum Sepolia</p>

            <div class="cert-field">
              <span class="cert-label">Titre</span>
              <span class="cert-value">{{ r.titre }}</span>
            </div>
            <div class="cert-field">
              <span class="cert-label">Auteur</span>
              <span class="cert-value">{{ r.auteur?.prenom || '' }} {{ r.auteur?.nom || '' }}</span>
            </div>
            <div class="cert-field">
              <span class="cert-label">Hash</span>
              <span class="cert-value cert-hash">{{ r.hashContenu }}</span>
            </div>
            <div class="cert-field">
              <span class="cert-label">Block</span>
              <span class="cert-value cert-hash">{{ r.preuve?.blockNumber }}</span>
            </div>
            <div class="cert-field">
              <span class="cert-label">Transaction</span>
              <span class="cert-value cert-hash">{{ r.preuve?.txHash }}</span>
            </div>

            <a class="cert-sepolia" [href]="'https://sepolia.etherscan.io/tx/' + (r.preuve?.txHash || '')" target="_blank" rel="noopener noreferrer">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
              Voir sur Etherscan
            </a>

            <button class="cert-copy" (click)="copyLink(r)">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
              Copier le lien de vérification
            </button>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .verify-page { max-width: 560px; margin: 40px auto; }

    .verify-card { background: var(--color-surface); border: 1px solid var(--line-200); border-radius: var(--radius-md); padding: 32px; display: flex; flex-direction: column; gap: 16px; }
    .verify-card h1 { margin: 0; font-size: var(--text-xl); text-align: center; }
    .verify-card p { margin: 0; font-size: var(--text-sm); color: var(--ink-700); text-align: center; }

    .verify-input-group { display: flex; gap: 8px; }
    .verify-input { flex: 1; padding: 12px 16px; font-family: var(--font-mono); font-size: var(--text-sm); border: 1px solid var(--line-200); border-radius: var(--radius-md); background: var(--color-surface); color: var(--ink-900); outline: none; transition: border-color var(--transition); }
    .verify-input:focus { border-color: var(--honey-500); box-shadow: 0 0 0 3px rgba(217,160,43,0.10); }
    .input--filled { border-color: var(--honey-500); }
    .verify-input::placeholder { color: var(--ink-700); opacity: 0.4; }

    .verify-submit { display: flex; align-items: center; gap: 8px; padding: 12px 20px; background: var(--honey-500); color: var(--ink-900); border: none; border-radius: var(--radius-md); font-family: var(--font-body); font-size: var(--text-sm); font-weight: 600; cursor: pointer; white-space: nowrap; transition: all var(--transition); }
    .verify-submit:hover:not(:disabled) { background: var(--honey-600); }
    .verify-submit:disabled { opacity: 0.4; cursor: not-allowed; }

    .verify-error { font-size: var(--text-sm); color: var(--alert-500); background: rgba(196,67,46,0.06); padding: 10px 14px; border-radius: var(--radius-md); }

    .certificate { position: relative; border: 1px solid var(--line-200); border-radius: var(--radius-md); padding: 36px 24px 24px; margin-top: 8px; display: flex; flex-direction: column; align-items: center; gap: 12px; }
    .cert-corner { position: absolute; }
    .tl { top: -1px; left: -1px; }
    .tr { top: -1px; right: -1px; transform: scaleX(-1); }
    .bl { bottom: -1px; left: -1px; transform: scaleY(-1); }
    .br { bottom: -1px; right: -1px; transform: scale(-1); }

    .cert-seal { margin-bottom: 4px; }
    .cert-title { font-family: var(--font-heading); font-size: var(--text-xl); margin: 0; }
    .cert-sub { font-size: var(--text-sm); color: var(--ink-700); margin: 0 0 12px; text-align: center; }

    .cert-field { width: 100%; display: flex; justify-content: space-between; align-items: center; gap: 12px; padding: 8px 0; border-bottom: 1px solid var(--line-200); font-size: var(--text-sm); }
    .cert-field:last-of-type { border-bottom: none; }
    .cert-label { font-weight: 500; color: var(--ink-700); flex-shrink: 0; }
    .cert-value { text-align: right; color: var(--ink-900); }
    .cert-hash { font-family: var(--font-mono); font-size: 0.75rem; word-break: break-all; }

    .cert-sepolia { display: inline-flex; align-items: center; gap: 6px; color: var(--honey-500); font-size: var(--text-sm); margin-top: 4px; text-decoration: none; }
    .cert-sepolia:hover { text-decoration: underline; }

    .cert-copy { display: inline-flex; align-items: center; gap: 6px; background: none; border: 1px solid var(--line-200); padding: 8px 16px; border-radius: var(--radius-md); font-family: var(--font-body); font-size: var(--text-sm); cursor: pointer; transition: all var(--transition); }
    .cert-copy:hover { border-color: var(--honey-500); color: var(--honey-500); }
  `]
})
export class VerifyPublicationComponent {
  private http = inject(HttpClient);
  hashValue = signal('');
  loading = signal(false);
  error = signal<string | null>(null);
  result = signal<any>(null);

  canVerify(): boolean {
    return this.hashValue().trim().length > 4;
  }

  onInput(event: Event) {
    const val = (event.target as HTMLInputElement).value;
    this.hashValue.set(val);
    this.error.set(null);
    this.result.set(null);
  }

  verify() {
    const hash = this.hashValue().trim();
    if (!hash) return;
    this.loading.set(true);
    this.error.set(null);
    this.result.set(null);
    this.http.get<any>('/api/publications/verify/' + encodeURIComponent(hash)).subscribe({
      next: r => { this.result.set(r); this.loading.set(false); },
      error: e => { this.error.set(e.error?.error || 'Aucune publication trouvée pour ce hash.'); this.loading.set(false); },
    });
  }

  copyLink(r: any) {
    const url = window.location.origin + '/publications/' + r._id;
    navigator.clipboard.writeText(url);
  }
}
