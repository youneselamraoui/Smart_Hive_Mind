import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Subject, takeUntil } from 'rxjs';
import { ToastService } from '../../core/toast.service';

@Component({
  selector: 'app-validation-form',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <div class="section">
      <div class="page-header">
        <h1>Nouvelle validation</h1>
        <a class="btn-outline-sm" routerLink="/marketplace/validations">Retour</a>
      </div>

      <div class="form-card">
        <form [formGroup]="form" (ngSubmit)="save()">
          <div class="field">
            <label for="missionId">ID de la mission</label>
            <input id="missionId" type="text" formControlName="missionId" placeholder="Ex: M-2025-001" />
          </div>

          <div class="field">
            <label for="commentaire">Commentaire</label>
            <textarea id="commentaire" formControlName="commentaire" rows="4" placeholder="Évaluez la mission..."></textarea>
          </div>

          <div class="field">
            <label for="resultat">Résultat</label>
            <select id="resultat" formControlName="resultat">
              <option value="">Sélectionner</option>
              <option value="valide">Valide</option>
              <option value="rejete">Rejeté</option>
              <option value="en_attente">En attente</option>
            </select>
          </div>

          <div class="form-actions">
            <button type="button" class="btn-outline" (click)="router.navigate(['/marketplace/validations'])">Annuler</button>
            <button type="submit" class="btn-primary" [disabled]="form.invalid || loading()">
              {{ loading() ? 'Envoi…' : 'Soumettre la validation' }}
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
    .field input, .field select, .field textarea { padding: 10px 14px; border: 1.5px solid var(--color-border); border-radius: var(--radius-sm); font-size: 0.88rem; font-family: var(--font-sans); outline: none; }
    .field input:focus, .field select:focus, .field textarea:focus { border-color: var(--color-primary-blue); box-shadow: 0 0 0 3px rgba(217,160,43,0.15); }
    .form-actions { display: flex; gap: 12px; margin-top: 24px; }
    .btn-primary { flex: 1; padding: 12px; background: var(--color-primary-blue); color: var(--ink-900); border: none; border-radius: var(--radius-sm); font-size: 0.88rem; font-weight: 600; cursor: pointer; }
    .btn-primary:hover:not(:disabled) { background: var(--honey-600); }
    .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-outline { padding: 12px 24px; border: 1.5px solid var(--color-border); border-radius: var(--radius-sm); background: none; color: var(--color-text-secondary); font-size: 0.88rem; font-weight: 600; cursor: pointer; }
    .btn-outline:hover { border-color: var(--color-primary-blue); color: var(--color-primary-blue); }
    .btn-outline-sm { padding: 6px 14px; border: 1.5px solid var(--color-border); border-radius: var(--radius-sm); font-size: 0.78rem; color: var(--color-text-secondary); text-decoration: none; }
  `]
})
export class ValidationFormComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  public router = inject(Router);
  private http = inject(HttpClient);
  private toast = inject(ToastService);

  loading = signal(false);
  private destroy$ = new Subject<void>();

  ngOnDestroy() { this.destroy$.next(); this.destroy$.complete(); }

  form = this.fb.nonNullable.group({
    missionId: ['', Validators.required],
    commentaire: ['', Validators.required],
    resultat: ['valide', Validators.required],
  });

  ngOnInit() {}

  save() {
    if (this.form.invalid) return;
    this.loading.set(true);

    const payload = {
      missionId: this.form.value.missionId,
      evaluationClient: this.form.value.resultat === 'valide' ? 5 : 1,
      commentaire: this.form.value.commentaire,
      competence: this.form.value.resultat === 'valide' ? 'valide' : 'a_ameliorer',
    };
    this.http.post('/api/placements/cloturer', payload).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => { this.toast.success('Validation soumise avec succès'); this.router.navigate(['/marketplace/validations']); },
      error: () => { this.loading.set(false); this.toast.error('Erreur lors de l\'enregistrement'); },
    });
  }
}
