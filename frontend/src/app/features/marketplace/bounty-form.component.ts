import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Subject, takeUntil } from 'rxjs';
import { ToastService } from '../../core/toast.service';

@Component({
  selector: 'app-bounty-form',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <div class="section">
      <div class="page-header">
        <h1>Nouveau bounty</h1>
        <a class="btn-outline-sm" routerLink="/marketplace">Retour</a>
      </div>

      <div class="form-card">
        <form [formGroup]="form" (ngSubmit)="save()">
          <div class="field">
            <label for="titre">Titre</label>
            <input id="titre" type="text" formControlName="titre" placeholder="Ex: Défi IA 2025" />
          </div>

          <div class="field">
            <label for="description">Description</label>
            <textarea id="description" formControlName="description" rows="4" placeholder="Décrivez le défi…"></textarea>
          </div>

          <div class="field">
            <label for="recompense">Récompense (FCFA)</label>
            <input id="recompense" type="number" formControlName="recompense" placeholder="Ex: 100000" />
          </div>

          <div class="field">
            <label for="delai">Date limite</label>
            <input id="delai" type="date" formControlName="delai" />
          </div>

          <div class="form-actions">
            <button type="button" class="btn-outline" (click)="router.navigate(['/marketplace'])">Annuler</button>
            <button type="submit" class="btn-primary" [disabled]="form.invalid || loading()">
              {{ loading() ? 'Création…' : 'Créer le bounty' }}
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
    .form-actions { display: flex; gap: 12px; margin-top: 24px; }
    .btn-primary { flex: 1; padding: 12px; background: var(--color-primary-blue); color: var(--ink-900); border: none; border-radius: var(--radius-sm); font-size: 0.88rem; font-weight: 600; cursor: pointer; }
    .btn-primary:hover:not(:disabled) { background: var(--honey-600); }
    .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-outline { padding: 12px 24px; border: 1.5px solid var(--color-border); border-radius: var(--radius-sm); background: none; color: var(--color-text-secondary); font-size: 0.88rem; font-weight: 600; cursor: pointer; }
    .btn-outline:hover { border-color: var(--color-primary-blue); color: var(--color-primary-blue); }
    .btn-outline-sm { padding: 6px 14px; border: 1.5px solid var(--color-border); border-radius: var(--radius-sm); font-size: 0.78rem; color: var(--color-text-secondary); text-decoration: none; }
  `]
})
export class BountyFormComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  public router = inject(Router);
  private http = inject(HttpClient);
  private toast = inject(ToastService);

  loading = signal(false);
  private destroy$ = new Subject<void>();

  form = this.fb.nonNullable.group({
    titre: ['', Validators.required],
    description: ['', Validators.required],
    recompense: [0],
    delai: [''],
  });

  ngOnInit() {}

  ngOnDestroy() { this.destroy$.next(); this.destroy$.complete(); }

  save() {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.http.post('/api/bounties', this.form.value).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => { this.toast.success('Bounty créé.'); this.router.navigate(['/marketplace']); },
      error: () => { this.loading.set(false); this.toast.error('Erreur lors de la création.'); },
    });
  }
}
