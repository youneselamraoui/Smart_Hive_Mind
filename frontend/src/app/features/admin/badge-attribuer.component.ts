import { Component, inject, signal, computed, OnDestroy } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Subject, takeUntil } from 'rxjs';
import { ToastService } from '../../core/toast.service';
import { SafeHtmlPipe } from '../../core/safe-html.pipe';

const BADGE_ICONS: Record<string, string> = {
  innovateur: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M9 18h6"/><path d="M10 22h4"/><path d="M15.09 14c.58-.68.91-1.55.91-2.5a4 4 0 0 0-8 0c0 .95.33 1.82.91 2.5"/><path d="M12 2v1"/><path d="M4.93 4.93l.71.71"/><path d="M2 12h1"/></svg>`,
  collaborateur: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  expert: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg>`,
  mentor: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>`,
  contributeur: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><line x1="6" y1="3" x2="6" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/></svg>`,
  leader: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M2 20h20"/><path d="M4 20V8l4 4 4-8 4 8 4-4v12"/></svg>`,
};

const BADGE_COLORS: Record<string, { bg: string; fg: string }> = {
  innovateur: { bg: 'rgba(91,79,224,0.1)', fg: 'var(--agentic-500)' },
  collaborateur: { bg: 'rgba(31,158,109,0.1)', fg: 'var(--verify-500)' },
  expert: { bg: 'rgba(217,160,43,0.1)', fg: 'var(--honey-600)' },
  mentor: { bg: 'rgba(91,79,224,0.1)', fg: 'var(--agentic-500)' },
  contributeur: { bg: 'rgba(31,158,109,0.1)', fg: 'var(--verify-500)' },
  leader: { bg: 'rgba(196,67,46,0.1)', fg: 'var(--alert-500)' },
};

@Component({
  selector: 'app-badge-attribuer',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, SafeHtmlPipe],
  template: `
    <div class="page">
      <div class="page-head"><div><h1>Attribuer un badge</h1></div></div>

      <div class="layout">
        <div class="form-col">
          <div class="form-card">
            <form [formGroup]="form" (ngSubmit)="save()">
              <div class="field">
                <label>ID Utilisateur</label>
                <input type="text" formControlName="utilisateurId" placeholder="ID du membre (24 caractères hex)" />
                @if (form.get('utilisateurId')?.invalid && form.get('utilisateurId')?.touched) {
                  <small class="field-error">L'ID doit être un ObjectId valide (24 caractères hexadécimaux).</small>
                }
              </div>
              <div class="field">
                <label>Type de badge</label>
                <select formControlName="badgeType">
                  <option value="">Sélectionner</option>
                  <option value="innovateur">Innovateur</option>
                  <option value="collaborateur">Collaborateur</option>
                  <option value="expert">Expert</option>
                  <option value="mentor">Mentor</option>
                  <option value="contributeur">Contributeur</option>
                  <option value="leader">Leader</option>
                </select>
              </div>
              <div class="field">
                <label>Justification</label>
                <textarea formControlName="justification" rows="4" placeholder="Pourquoi ce badge ?"></textarea>
              </div>
              <div class="form-actions">
                <a class="btn btn-outline" routerLink="/admin/badges">Annuler</a>
                <button type="submit" class="btn btn-primary" [disabled]="form.invalid || loading()">
                  {{ loading() ? 'Attribution…' : 'Attribuer le badge' }}
                </button>
              </div>
            </form>
          </div>
        </div>

        <div class="preview-col">
          <h3>Aperçu sur le profil</h3>
          <div class="preview-card">
            <div class="preview-header">
              <div class="preview-avatar"></div>
              <div class="preview-name"><span class="preview-name-text">Membre</span><span class="preview-label">Profil</span></div>
            </div>
            <div class="preview-section">
              <span class="preview-section-title">Badges</span>
              <div class="preview-badge" [class.hidden]="!selectedType()" [style.background]="previewColor().bg" [style.color]="previewColor().fg">
                <span class="preview-badge-icon" [innerHTML]="previewIcon() | safeHtml"></span>
                <span class="preview-badge-label">{{ badgeLabel() }}</span>
              </div>
              @if (!selectedType()) {
                <span class="preview-hint">Sélectionnez un type de badge pour voir l'aperçu</span>
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .page-head { margin-bottom: 24px; }
    .page-head h1 { font-size: var(--text-2xl); margin: 0; }

    .layout { display: grid; grid-template-columns: 1fr 300px; gap: 28px; align-items: start; }

    .form-card { background: var(--color-surface); border: 1px solid var(--line-200); border-radius: var(--radius-md); padding: 28px; }
    .field { display: flex; flex-direction: column; gap: 6px; margin-bottom: 20px; }
    .field label { font-size: var(--text-sm); font-weight: 600; }
    .field input, .field select, .field textarea { padding: 10px 14px; border: 1px solid var(--line-200); border-radius: var(--radius-sm); font-family: var(--font-body); font-size: var(--text-sm); outline: none; background: var(--color-surface); color: var(--ink-900); transition: border-color var(--transition); }
    .field input:focus, .field select:focus, .field textarea:focus { border-color: var(--honey-500); }
    .field textarea { resize: vertical; min-height: 80px; }
    .form-actions { display: flex; gap: 12px; margin-top: 24px; justify-content: flex-end; }

    .btn { display: inline-flex; align-items: center; gap: 6px; padding: 10px 24px; border-radius: var(--radius-sm); font-family: var(--font-body); font-size: var(--text-sm); font-weight: 600; cursor: pointer; transition: all var(--transition); text-decoration: none; }
    .btn:disabled { opacity: 0.4; cursor: not-allowed; }
    .btn-primary { background: var(--honey-500); color: var(--ink-900); border: none; }
    .btn-primary:hover:not(:disabled) { background: var(--honey-600); }
    .btn-outline { background: var(--color-surface); border: 1px solid var(--line-200); color: var(--ink-900); }
    .btn-outline:hover { border-color: var(--ink-700); }

    .preview-col { position: sticky; top: 20px; }
    .preview-col h3 { font-size: var(--text-sm); font-weight: 600; margin: 0 0 12px; }
    .preview-card { background: var(--color-surface); border: 1px solid var(--line-200); border-radius: var(--radius-md); padding: 20px; display: flex; flex-direction: column; gap: 16px; }
    .preview-header { display: flex; align-items: center; gap: 12px; }
    .preview-avatar { width: 40px; height: 40px; border-radius: 50%; background: var(--line-200); }
    .preview-name-text { display: block; font-size: var(--text-sm); font-weight: 600; }
    .preview-label { font-size: var(--text-xs); color: var(--ink-700); }
    .preview-section-title { display: block; font-size: var(--text-xs); font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: var(--ink-700); margin-bottom: 8px; }
    .preview-badge { display: inline-flex; align-items: center; gap: 6px; padding: 6px 14px 6px 10px; border-radius: 999px; font-size: var(--text-sm); font-weight: 500; transition: all 0.3s ease; }
    .preview-badge.hidden { opacity: 0; transform: translateY(4px); pointer-events: none; }
    .preview-badge-icon { display: flex; }
    .preview-badge-icon :deep(svg) { width: 16px; height: 16px; }
    .preview-hint { font-size: var(--text-xs); color: var(--ink-700); font-style: italic; }

    @media (max-width: 900px) { .layout { grid-template-columns: 1fr; } .preview-col { position: static; } }
  `]
})
export class BadgeAttribuerComponent {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private toast = inject(ToastService);
  router = inject(Router);
  loading = signal(false);
  private destroy$ = new Subject<void>();

  ngOnDestroy() { this.destroy$.next(); this.destroy$.complete(); }

  form = this.fb.nonNullable.group({
    utilisateurId: ['', [Validators.required, Validators.pattern(/^[0-9a-fA-F]{24}$/)]],
    badgeType: ['', Validators.required],
    justification: [''],
  });

  selectedType = computed(() => this.form.value.badgeType || '');
  previewIcon = computed(() => BADGE_ICONS[this.selectedType()] || '');
  previewColor = computed(() => BADGE_COLORS[this.selectedType()] || { bg: 'transparent', fg: 'var(--ink-900)' });
  badgeLabel = computed(() => {
    const t = this.selectedType();
    return { innovateur: 'Innovateur', collaborateur: 'Collaborateur', expert: 'Expert', mentor: 'Mentor', contributeur: 'Contributeur', leader: 'Leader' }[t] || t;
  });

  save() {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.http.post('/api/badges/attribuer', this.form.value).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => { this.toast.success('Badge attribué.'); this.router.navigate(['/admin/badges']); },
      error: err => { this.loading.set(false); this.toast.error(err.error?.error || 'Erreur lors de l\'attribution.'); },
    });
  }
}
