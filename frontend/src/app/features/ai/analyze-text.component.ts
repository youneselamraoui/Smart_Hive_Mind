import { Component, inject, signal, computed, OnDestroy } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Subject, takeUntil } from 'rxjs';
import { ToastService } from '../../core/toast.service';

function similarityGauge(pct: number): string {
  const r = 38, cx = 48, cy = 48;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (pct / 100) * circumference;
  const color = pct < 30 ? 'var(--verify-500)' : pct <= 60 ? 'var(--honey-500)' : 'var(--alert-500)';
  const label = pct < 30 ? 'Faible similarité' : pct <= 60 ? 'Similarité modérée' : 'Similarité élevée';
  return `<svg viewBox="0 0 96 56" width="96" height="56" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 48 A 38 38 0 0 1 88 48" fill="none" stroke="var(--line-200)" stroke-width="6" stroke-linecap="round"/>
    <path d="M8 48 A 38 38 0 0 1 88 48" fill="none" stroke="${color}" stroke-width="6" stroke-linecap="round"
      stroke-dasharray="${circumference}" stroke-dashoffset="${offset}" style="transition: stroke-dashoffset 0.8s ease-out"/>
    <text x="48" y="44" text-anchor="middle" font-family="var(--font-mono)" font-size="12" font-weight="700" fill="${color}">${Math.round(pct)}%</text>
  </svg>
  <span class="gauge-label" style="color:${color}">${label}</span>`;
}

@Component({
  selector: 'app-analyze-text',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <div class="page">
      <div class="page-head"><div><h1>Analyser un texte</h1><p>Détection de plagiat et analyse</p></div></div>

      <div class="layout">
        <div class="form-card">
          <form [formGroup]="form" (ngSubmit)="save()">
            <div class="field">
              <label>Texte à analyser</label>
              <textarea formControlName="texte" rows="8" placeholder="Collez le texte à analyser…"></textarea>
            </div>
            <div class="form-actions">
              <a class="btn btn-outline" routerLink="/ai">Annuler</a>
              <button type="submit" class="btn btn-primary" [disabled]="form.invalid || loading()">
                @if (loading()) { <span class="sp"></span> } {{ loading() ? 'Analyse…' : 'Analyser' }}
              </button>
            </div>
          </form>
        </div>

        @if (result(); as r) {
          <div class="result-section">
            <div class="gauge-row" [innerHTML]="gaugeHtml(r.similarite)"></div>

            @if (r.passagesSuspects?.length) {
              <div class="highlight-section">
                <h3>Passages suspects</h3>
                <div class="text-highlighted">{{ highlightedText(r) }}</div>
              </div>
            }

            @if (r.details) {
              <div class="details">
                <h3>Détails de l'analyse</h3>
                <p>{{ r.details }}</p>
              </div>
            }
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .page-head { margin-bottom: 24px; }
    .page-head h1 { font-size: var(--text-2xl); margin: 0 0 2px; }
    .page-head p { margin: 0; font-size: var(--text-sm); color: var(--ink-700); }

    .layout { max-width: 720px; }

    .form-card { background: var(--color-surface); border: 1px solid var(--line-200); border-radius: var(--radius-md); padding: 28px; margin-bottom: 20px; }
    .field { display: flex; flex-direction: column; gap: 6px; }
    .field label { font-size: var(--text-sm); font-weight: 600; }
    .field textarea { padding: 10px 14px; border: 1px solid var(--line-200); border-radius: var(--radius-sm); font-family: var(--font-mono); font-size: var(--text-sm); outline: none; background: var(--color-surface); color: var(--ink-900); transition: border-color var(--transition); resize: vertical; min-height: 160px; }
    .field textarea:focus { border-color: var(--honey-500); }
    .form-actions { display: flex; gap: 12px; margin-top: 20px; justify-content: flex-end; }

    .btn { display: inline-flex; align-items: center; gap: 6px; padding: 10px 24px; border-radius: var(--radius-sm); font-family: var(--font-body); font-size: var(--text-sm); font-weight: 600; cursor: pointer; transition: all var(--transition); text-decoration: none; }
    .btn:disabled { opacity: 0.4; cursor: not-allowed; }
    .btn-primary { background: var(--honey-500); color: var(--ink-900); border: none; }
    .btn-primary:hover:not(:disabled) { background: var(--honey-600); }
    .btn-outline { background: var(--color-surface); border: 1px solid var(--line-200); color: var(--ink-900); }
    .btn-outline:hover { border-color: var(--ink-700); }
    .sp { display: inline-block; width: 12px; height: 12px; border: 2px solid transparent; border-top-color: currentColor; border-radius: 50%; animation: r 0.6s linear infinite; }
    @keyframes r { to{transform:rotate(360deg)} }

    .result-section { border: 1px solid var(--line-200); border-radius: var(--radius-md); padding: 28px; background: var(--color-surface); }
    .gauge-row { display: flex; flex-direction: column; align-items: center; gap: 4px; margin-bottom: 24px; }
    .gauge-row :deep(.gauge-label) { font-family: var(--font-mono); font-size: var(--text-xs); text-align: center; line-height: 1.2; max-width: 120px; }

    .highlight-section { margin-bottom: 20px; }
    .highlight-section h3 { font-size: var(--text-base); margin: 0 0 10px; }
    .text-highlighted { font-family: var(--font-mono); font-size: var(--text-sm); line-height: 1.7; padding: 14px 16px; background: var(--paper-50); border-radius: var(--radius-sm); white-space: pre-wrap; word-break: break-word; }
    .text-highlighted :deep(mark) { background: rgba(196,67,46,0.2); color: inherit; border-radius: 2px; padding: 0 1px; }

    .details { }
    .details h3 { font-size: var(--text-base); margin: 0 0 8px; }
    .details p { font-size: var(--text-sm); color: var(--ink-700); margin: 0; line-height: 1.5; }
  `]
})
export class AnalyzeTextComponent {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private toast = inject(ToastService);
  router = inject(Router);
  loading = signal(false);
  result = signal<any>(null);
  private destroy$ = new Subject<void>();

  ngOnDestroy() { this.destroy$.next(); this.destroy$.complete(); }

  form = this.fb.nonNullable.group({
    texte: ['', Validators.required],
  });

  gaugeHtml = similarityGauge;

  save() {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.result.set(null);
    this.http.post<any>('/api/ai/analyze-text', { texte: this.form.value.texte }).pipe(takeUntil(this.destroy$)).subscribe({
      next: res => { this.result.set(res); this.loading.set(false); this.toast.success('Analyse terminée.'); },
      error: () => { this.loading.set(false); this.toast.error('Erreur.'); },
    });
  }

  highlightedText(r: any): string {
    const txt = r.texteOriginal || r.texte || '';
    const passages: { debut: number; fin: number }[] = r.passagesSuspects || [];
    if (!passages.length) return txt;
    const sorted = [...passages].sort((a, b) => a.debut - b.debut);
    const parts: string[] = [];
    let pos = 0;
    for (const p of sorted) {
      if (p.debut > pos) parts.push(this.esc(txt.slice(pos, p.debut)));
      parts.push('<mark>' + this.esc(txt.slice(Math.max(p.debut, pos), p.fin)) + '</mark>');
      pos = p.fin;
    }
    if (pos < txt.length) parts.push(this.esc(txt.slice(pos)));
    return parts.join('');
  }

  private esc(s: string): string {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
}
