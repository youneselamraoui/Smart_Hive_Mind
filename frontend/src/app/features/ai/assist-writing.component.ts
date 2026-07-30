import { Component, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../core/toast.service';

@Component({
  selector: 'app-assist-writing',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="page">
      <div class="page-head"><div><h1>Assistant rédaction</h1><p>Améliorez vos brouillons avec l'IA</p></div></div>

      <div class="layout">
        <div class="form-card">
          <div class="field">
            <label>Type</label>
            <select class="input" [(ngModel)]="type">
              <option value="publication">Publication</option>
              <option value="description">Description</option>
              <option value="mail">Mail</option>
              <option value="autre">Autre</option>
            </select>
          </div>
          <div class="field">
            <label>Votre brouillon</label>
            <textarea class="input input--ta" [(ngModel)]="brouillon" rows="8" placeholder="Collez ou écrivez votre brouillon ici…"></textarea>
          </div>
          <div class="form-actions">
            <button class="btn btn-primary" [disabled]="!brouillon.trim() || loading()" (click)="envoyer()">
              {{ loading() ? 'Amélioration…' : "Améliorer avec l'IA" }}
            </button>
          </div>

          @if (resultat()) {
            <div class="result">
              <label>Résultat</label>
              <textarea class="result-box" readonly [value]="resultat()" rows="12"></textarea>
              <button class="btn btn-outline btn-sm" (click)="copier()">Copier</button>
            </div>
          }
          @if (error()) {
            <div class="err">{{ error() }}</div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .page-head { margin-bottom: 24px; }
    .page-head h1 { font-size: var(--text-2xl); margin: 0 0 2px; }
    .page-head p { margin: 0; font-size: var(--text-sm); color: var(--ink-700); }

    .layout { max-width: 680px; }
    .form-card { background: var(--color-surface); border: 1px solid var(--line-200); border-radius: var(--radius-md); padding: 28px; }
    .field { display: flex; flex-direction: column; gap: 6px; margin-bottom: 20px; }
    .field label { font-size: var(--text-sm); font-weight: 600; }
    .input { padding: 10px 14px; border: 1px solid var(--line-200); border-radius: var(--radius-sm); font-family: var(--font-body); font-size: var(--text-sm); outline: none; background: var(--color-surface); color: var(--ink-900); transition: border-color var(--transition); }
    .input:focus { border-color: var(--indigo-500); }
    .input--ta { resize: vertical; min-height: 120px; }
    .form-actions { display: flex; gap: 12px; margin-top: 24px; }

    .btn { display: inline-flex; align-items: center; gap: 6px; padding: 10px 24px; border-radius: var(--radius-sm); font-family: var(--font-body); font-size: var(--text-sm); font-weight: 600; cursor: pointer; transition: all var(--transition); text-decoration: none; }
    .btn:disabled { opacity: 0.4; cursor: not-allowed; }
    .btn-primary { background: var(--indigo-500); color: #fff; border: none; }
    .btn-primary:hover:not(:disabled) { background: var(--indigo-600); }
    .btn-outline { background: var(--color-surface); border: 1px solid var(--line-200); color: var(--ink-900); }
    .btn-outline:hover { border-color: var(--ink-700); }
    .btn-sm { padding: 6px 14px; font-size: var(--text-xs); }

    .result { margin-top: 24px; border-top: 1px solid var(--line-200); padding-top: 20px; display: flex; flex-direction: column; gap: 8px; }
    .result label { font-size: var(--text-sm); font-weight: 600; display: block; }
    .result-box { width: 100%; padding: 12px 14px; border: 1px solid var(--line-200); border-radius: var(--radius-sm); font-family: var(--font-mono); font-size: var(--text-sm); background: var(--paper-50); resize: vertical; color: var(--ink-900); box-sizing: border-box; }

    .err { padding: 10px 14px; background: rgba(196,67,46,0.08); border: 1px solid rgba(196,67,46,0.15); border-radius: var(--radius-sm); font-size: var(--text-sm); color: var(--error-500); }
  `]
})
export class AssistWritingComponent {
  private http = inject(HttpClient);
  private toast = inject(ToastService);

  brouillon = '';
  type = 'publication';
  loading = signal(false);
  resultat = signal<string | null>(null);
  error = signal<string | null>(null);

  envoyer() {
    if (!this.brouillon.trim() || this.loading()) return;
    this.loading.set(true);
    this.error.set(null);
    this.resultat.set(null);
    this.http.post<{ reponse: string }>('/api/ai/assist-writing', {
      brouillon: this.brouillon,
      type: this.type,
    }).subscribe({
      next: r => { this.resultat.set(r.reponse); this.loading.set(false); },
      error: e => { this.loading.set(false); this.error.set(e.error?.error || 'Erreur IA.'); },
    });
  }

  copier() {
    const r = this.resultat();
    if (!r) return;
    navigator.clipboard.writeText(r).then(() => this.toast.success('Copié !'));
  }
}
