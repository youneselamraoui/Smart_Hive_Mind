import { Component, OnDestroy, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Subject, takeUntil } from 'rxjs';
import { ToastService } from '../../core/toast.service';

@Component({
  selector: 'app-evenement-form',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <div class="page">
      <div class="page-head"><div><h1>Nouvel événement</h1></div></div>
      <div class="form-card">
        <form [formGroup]="form" (ngSubmit)="save()">
          <div class="field">
            <label>Type</label>
            <select formControlName="type">
              <option value="">Sélectionner</option>
              <option value="hackathon">Hackathon</option>
              <option value="congres">Congrès</option>
              <option value="salon">Salon</option>
              <option value="concours">Concours</option>
            </select>
          </div>
          <div class="field">
            <label>Titre</label>
            <input type="text" formControlName="titre" placeholder="Ex: Hackathon SHM 2025" />
          </div>
          <div class="field-row">
            <div class="field">
              <label>Date de début</label>
              <input type="date" formControlName="debut" />
            </div>
            <div class="field">
              <label>Date de fin</label>
              <input type="date" formControlName="fin" />
            </div>
          </div>
          <div class="field">
            <label>Capacité max</label>
            <input type="number" formControlName="capaciteMax" min="0" placeholder="Ex: 200" />
          </div>
          <div class="field">
            <label class="checkbox">
              <input type="checkbox" formControlName="espacePrive" />
              <span>Espace privé</span>
            </label>
          </div>
          <div class="form-actions">
            <a class="btn btn-outline" routerLink="/evenements">Annuler</a>
            <button type="submit" class="btn btn-primary" [disabled]="form.invalid || loading()">
              {{ loading() ? 'Enregistrement…' : "Créer l'événement" }}
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
    .field input, .field select { padding: 10px 14px; border: 1px solid var(--line-200); border-radius: var(--radius-sm); font-family: var(--font-body); font-size: var(--text-sm); outline: none; background: var(--color-surface); color: var(--ink-900); transition: border-color var(--transition); }
    .field input:focus, .field select:focus { border-color: var(--honey-500); }
    .field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .checkbox { display: flex; align-items: center; gap: 8px; cursor: pointer; }
    .checkbox input { width: auto; }
    .form-actions { display: flex; gap: 12px; margin-top: 24px; justify-content: flex-end; }
    .btn { display: inline-flex; align-items: center; gap: 6px; padding: 10px 24px; border-radius: var(--radius-sm); font-family: var(--font-body); font-size: var(--text-sm); font-weight: 600; cursor: pointer; transition: all var(--transition); text-decoration: none; }
    .btn:disabled { opacity: 0.4; cursor: not-allowed; }
    .btn-primary { background: var(--honey-500); color: var(--ink-900); border: none; }
    .btn-primary:hover:not(:disabled) { background: var(--honey-600); }
    .btn-outline { background: var(--color-surface); border: 1px solid var(--line-200); color: var(--ink-900); }
    .btn-outline:hover { border-color: var(--ink-700); }

    @media (max-width: 600px) { .field-row { grid-template-columns: 1fr; } }
  `]
})
export class EvenementFormComponent implements OnDestroy {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private toast = inject(ToastService);
  router = inject(Router);
  private destroy$ = new Subject<void>();
  loading = signal(false);

  form = this.fb.nonNullable.group({
    type: ['', Validators.required],
    titre: ['', Validators.required],
    debut: ['', Validators.required],
    fin: ['', Validators.required],
    capaciteMax: [0],
    espacePrive: [false],
  });

  ngOnDestroy() { this.destroy$.next(); this.destroy$.complete(); }

  save() {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.http.post('/api/evenements', {
      type: this.form.value.type,
      titre: this.form.value.titre,
      dates: { debut: this.form.value.debut, fin: this.form.value.fin },
      capaciteMax: this.form.value.capaciteMax || undefined,
      espacePrive: this.form.value.espacePrive,
    }).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => { this.toast.success('Événement créé.'); this.router.navigate(['/evenements']); },
      error: () => { this.loading.set(false); this.toast.error('Erreur.'); },
    });
  }
}
