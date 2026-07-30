import { Component, inject, signal, OnDestroy } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Subject, takeUntil } from 'rxjs';
import { ToastService } from '../../core/toast.service';

@Component({
  selector: 'app-generate-content',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <div class="page">
      <div class="page-head"><div><h1>Générer du contenu</h1><p>Générez articles, descriptions et rapports via l'IA</p></div></div>

      <div class="layout">
        <div class="form-card">
          <form [formGroup]="form" (ngSubmit)="save()">
            <div class="field">
              <label>Type</label>
              <select formControlName="type">
                <option value="">Sélectionner</option>
                <option value="article">Article</option>
                <option value="rapport">Rapport</option>
                <option value="description">Description</option>
                <option value="mail">Mail</option>
                <option value="autre">Autre</option>
              </select>
            </div>
            <div class="field">
              <label>Ton</label>
              <select formControlName="tone">
                <option value="">Sélectionner</option>
                <option value="professionnel">Professionnel</option>
                <option value="creatif">Créatif</option>
                <option value="technique">Technique</option>
                <option value="simple">Simple</option>
              </select>
            </div>
            <div class="field">
              <label>Prompt</label>
              <textarea formControlName="prompt" rows="6" placeholder="Décrivez ce que vous voulez générer…"></textarea>
            </div>
            <div class="form-actions">
              <a class="btn btn-outline" routerLink="/ai">Annuler</a>
              <button type="submit" class="btn btn-primary" [disabled]="form.invalid || loading()">
                @if (loading()) { <span class="sp"></span> } {{ loading() ? 'Génération…' : 'Générer' }}
              </button>
            </div>
          </form>

          @if (result()) {
            <div class="result">
              <label>Résultat</label>
              <textarea class="result-box" readonly [value]="result()" rows="10"></textarea>
            </div>
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
    .field input, .field select, .field textarea { padding: 10px 14px; border: 1px solid var(--line-200); border-radius: var(--radius-sm); font-family: var(--font-body); font-size: var(--text-sm); outline: none; background: var(--color-surface); color: var(--ink-900); transition: border-color var(--transition); }
    .field input:focus, .field select:focus, .field textarea:focus { border-color: var(--honey-500); }
    .field textarea { resize: vertical; min-height: 100px; }
    .form-actions { display: flex; gap: 12px; margin-top: 24px; justify-content: flex-end; }

    .btn { display: inline-flex; align-items: center; gap: 6px; padding: 10px 24px; border-radius: var(--radius-sm); font-family: var(--font-body); font-size: var(--text-sm); font-weight: 600; cursor: pointer; transition: all var(--transition); text-decoration: none; }
    .btn:disabled { opacity: 0.4; cursor: not-allowed; }
    .btn-primary { background: var(--honey-500); color: var(--ink-900); border: none; }
    .btn-primary:hover:not(:disabled) { background: var(--honey-600); }
    .btn-outline { background: var(--color-surface); border: 1px solid var(--line-200); color: var(--ink-900); }
    .btn-outline:hover { border-color: var(--ink-700); }
    .sp { display: inline-block; width: 12px; height: 12px; border: 2px solid transparent; border-top-color: currentColor; border-radius: 50%; animation: r 0.6s linear infinite; }
    @keyframes r { to{transform:rotate(360deg)} }

    .result { margin-top: 24px; border-top: 1px solid var(--line-200); padding-top: 20px; }
    .result label { font-size: var(--text-sm); font-weight: 600; display: block; margin-bottom: 6px; }
    .result-box { width: 100%; padding: 12px 14px; border: 1px solid var(--line-200); border-radius: var(--radius-sm); font-family: var(--font-mono); font-size: var(--text-sm); background: var(--paper-50); resize: vertical; color: var(--ink-900); box-sizing: border-box; }
  `]
})
export class GenerateContentComponent {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private toast = inject(ToastService);
  router = inject(Router);
  loading = signal(false);
  result = signal<string | null>(null);
  private destroy$ = new Subject<void>();

  ngOnDestroy() { this.destroy$.next(); this.destroy$.complete(); }

  form = this.fb.nonNullable.group({
    prompt: ['', Validators.required],
    type: ['', Validators.required],
    tone: [''],
  });

  save() {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.result.set(null);
    this.http.post<{ contenu: string }>('/api/ai/generate-content', this.form.value).pipe(takeUntil(this.destroy$)).subscribe({
      next: res => { this.result.set(res.contenu); this.loading.set(false); this.toast.success('Contenu généré.'); },
      error: () => { this.loading.set(false); this.toast.error('Erreur.'); },
    });
  }
}
