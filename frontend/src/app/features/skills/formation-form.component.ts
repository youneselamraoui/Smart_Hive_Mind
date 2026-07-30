import { Component, OnDestroy, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Subject, takeUntil } from 'rxjs';
import { ToastService } from '../../core/toast.service';

@Component({
  selector: 'app-formation-form',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <div class="page">
      <div class="page-head"><div><h1>Nouvelle formation</h1></div></div>
      <div class="form-card">
        <form [formGroup]="form" (ngSubmit)="save()">
          <div class="field">
            <label>Titre</label>
            <input type="text" formControlName="titre" placeholder="Ex: Introduction à l'IA" />
          </div>
          <div class="field">
            <label>Description</label>
            <textarea formControlName="description" rows="4" placeholder="Décrivez la formation…"></textarea>
          </div>
          <div class="field">
            <label>Format</label>
            <select formControlName="format">
              <option value="">Sélectionner</option>
              <option value="video">Vidéo</option>
              <option value="texte">Texte</option>
              <option value="hybride">Hybride</option>
            </select>
          </div>
          <div class="field">
            <label>Durée</label>
            <input type="text" formControlName="duree" placeholder="Ex: 2 semaines" />
          </div>
          <div class="form-actions">
            <a class="btn btn-outline" routerLink="/skills/formations">Annuler</a>
            <button type="submit" class="btn btn-primary" [disabled]="form.invalid || loading()">
              {{ loading() ? 'Enregistrement…' : 'Créer la formation' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .page-head { margin-bottom: 24px; }
    .page-head h1 { font-size: var(--text-2xl); margin: 0; }
    .form-card { max-width: 640px; margin: 0 auto; background: var(--color-surface); border: 1px solid var(--line-200); border-radius: var(--radius-md); padding: 28px; }
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
  `]
})
export class FormationFormComponent implements OnDestroy {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private toast = inject(ToastService);
  router = inject(Router);
  private destroy$ = new Subject<void>();
  loading = signal(false);

  form = this.fb.nonNullable.group({
    titre: ['', Validators.required],
    description: ['', Validators.required],
    format: ['', Validators.required],
    duree: [''],
  });

  ngOnDestroy() { this.destroy$.next(); this.destroy$.complete(); }

  save() {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.http.post('/api/skills/formations', this.form.value).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => { this.toast.success('Formation créée.'); this.router.navigate(['/skills/formations']); },
      error: () => { this.loading.set(false); this.toast.error('Erreur.'); },
    });
  }
}
