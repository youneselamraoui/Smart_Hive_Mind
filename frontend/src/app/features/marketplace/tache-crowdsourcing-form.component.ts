import { Component, OnDestroy, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Subject, takeUntil } from 'rxjs';
import { ToastService } from '../../core/toast.service';

@Component({
  selector: 'app-tache-crowdsourcing-form',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <div class="section">
      <div class="page-header">
        <h1>Nouvelle tâche de crowdsourcing</h1>
        <a class="btn-outline-sm" routerLink="/marketplace">Retour</a>
      </div>

      <div class="form-card">
        <form [formGroup]="form" (ngSubmit)="save()">
          <div class="field">
            <label for="titre">Titre</label>
            <input id="titre" type="text" formControlName="titre" placeholder="Titre de la tâche" />
          </div>

          <div class="field">
            <label for="description">Description</label>
            <textarea id="description" formControlName="description" rows="4" placeholder="Décrivez la tâche…"></textarea>
          </div>

          <div class="field">
            <label for="competencesRequises">Compétences requises (séparées par des virgules)</label>
            <input id="competencesRequises" type="text" formControlName="competencesRequises" placeholder="Ex: JavaScript, Python, Design" />
          </div>

          <div class="field-row">
            <div class="field half">
              <label for="recompense">Récompense (FCFA)</label>
              <input id="recompense" type="number" formControlName="recompense" placeholder="Ex: 50000" />
            </div>
            <div class="field half">
              <label for="dateLimite">Date limite</label>
              <input id="dateLimite" type="date" formControlName="dateLimite" />
            </div>
          </div>

          <div class="form-actions">
            <button type="button" class="btn-outline" (click)="router.navigate(['/marketplace'])">Annuler</button>
            <button type="submit" class="btn-primary" [disabled]="form.invalid || loading()">
              {{ loading() ? 'Enregistrement…' : 'Publier la tâche' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 28px; }
    .page-header h1 { font-size: 1.5rem; margin: 0; }
    .form-card { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 28px; max-width: 640px; margin: 0 auto; box-shadow: var(--shadow-card); }
    .field { display: flex; flex-direction: column; gap: 6px; margin-bottom: 20px; }
    .field label { font-size: 0.82rem; font-weight: 600; }
    .field input, .field textarea { padding: 10px 14px; border: 1.5px solid var(--color-border); border-radius: var(--radius-sm); font-size: 0.88rem; font-family: var(--font-sans); outline: none; }
    .field input:focus, .field textarea:focus { border-color: var(--color-primary-blue); box-shadow: 0 0 0 3px rgba(217,160,43,0.15); }
    .field textarea { resize: vertical; }
    .field-row { display: flex; gap: 16px; }
    .field.half { flex: 1; }
    .form-actions { display: flex; gap: 12px; margin-top: 24px; }
    .btn-primary { flex: 1; padding: 12px; background: var(--color-primary-blue); color: var(--ink-900); border: none; border-radius: var(--radius-sm); font-size: 0.88rem; font-weight: 600; cursor: pointer; }
    .btn-primary:hover:not(:disabled) { background: var(--honey-600); }
    .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-outline { padding: 12px 24px; border: 1.5px solid var(--color-border); border-radius: var(--radius-sm); background: none; color: var(--color-text-secondary); font-size: 0.88rem; font-weight: 600; cursor: pointer; }
    .btn-outline:hover { border-color: var(--color-primary-blue); color: var(--color-primary-blue); }
    .btn-outline-sm { padding: 6px 14px; border: 1.5px solid var(--color-border); border-radius: var(--radius-sm); font-size: 0.78rem; color: var(--color-text-secondary); text-decoration: none; }
  `]
})
export class TacheCrowdsourcingFormComponent implements OnDestroy {
  private fb = inject(FormBuilder);
  public router = inject(Router);
  private http = inject(HttpClient);
  private toast = inject(ToastService);
  private destroy$ = new Subject<void>();

  loading = signal(false);

  form = this.fb.nonNullable.group({
    titre: ['', Validators.required],
    description: ['', Validators.required],
    competencesRequises: [''],
    recompense: [0],
    dateLimite: [''],
  });

  ngOnDestroy() { this.destroy$.next(); this.destroy$.complete(); }

  save() {
    if (this.form.invalid) return;
    this.loading.set(true);

    this.http.post('/api/taches-crowdsourcing', this.form.value).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => { this.toast.success('Tâche publiée avec succès'); this.router.navigate(['/marketplace']); },
      error: () => { this.loading.set(false); this.toast.error('Erreur lors de l\'enregistrement'); },
    });
  }
}
