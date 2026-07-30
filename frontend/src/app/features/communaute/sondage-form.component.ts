import { Component, OnDestroy, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, FormArray } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Subject, takeUntil } from 'rxjs';
import { ToastService } from '../../core/toast.service';

@Component({
  selector: 'app-sondage-form',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <div class="page">
      <a routerLink="/communaute/sondages" class="back-link">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="15 18 9 12 15 6"/></svg>
        Retour
      </a>
      <h1>Nouveau sondage</h1>

      <div class="form-card">
        <form [formGroup]="form" (ngSubmit)="save()">
          <div class="field">
            <label>Question</label>
            <input class="input" type="text" formControlName="question" placeholder="Votre question…" />
          </div>
          <div class="field">
            <label>Options</label>
            <div formArrayName="options">
              @for (opt of options.controls; track opt; let i = $index) {
                <div class="opt-row">
                  <input class="input" [formControlName]="i" type="text" placeholder="Option {{ i + 1 }}" />
                  <button type="button" class="opt-remove" (click)="removeOption(i)" [disabled]="options.length <= 2">&times;</button>
                </div>
              }
            </div>
            <button type="button" class="opt-add" (click)="addOption()">+ Ajouter une option</button>
          </div>
          <div class="form-actions">
            <button type="button" class="btn btn-outline" (click)="router.navigate(['/communaute/sondages'])">Annuler</button>
            <button type="submit" class="btn btn-primary" [disabled]="form.invalid || loading()">{{ loading() ? 'Enregistrement…' : 'Créer le sondage' }}</button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .page { max-width: 640px; }
    .back-link { display: inline-flex; align-items: center; gap: 6px; color: var(--ink-700); text-decoration: none; font-size: var(--text-sm); margin-bottom: 16px; }
    .back-link:hover { color: var(--honey-500); }
    h1 { font-size: var(--text-xl); margin: 0 0 20px; }
    .form-card { background: var(--color-surface); border: 1px solid var(--line-200); border-radius: var(--radius-md); padding: 24px; }
    .field { display: flex; flex-direction: column; gap: 6px; margin-bottom: 18px; }
    .field label { font-size: var(--text-sm); font-weight: 600; }
    .input { width: 100%; padding: 10px 14px; border: 1px solid var(--line-200); border-radius: var(--radius-sm); font-family: var(--font-body); font-size: var(--text-sm); outline: none; background: var(--color-surface); color: var(--ink-900); transition: border-color var(--transition); box-sizing: border-box; }
    .input:focus { border-color: var(--honey-500); box-shadow: 0 0 0 3px rgba(217,160,43,0.08); }
    .opt-row { display: flex; gap: 8px; margin-bottom: 8px; }
    .opt-row .input { flex: 1; }
    .opt-remove { width: 36px; height: 38px; border: 1px solid var(--line-200); border-radius: var(--radius-sm); background: none; font-size: 1.2rem; cursor: pointer; color: var(--ink-700); display: flex; align-items: center; justify-content: center; transition: all var(--transition); flex-shrink: 0; }
    .opt-remove:hover:not(:disabled) { border-color: var(--alert-500); color: var(--alert-500); }
    .opt-remove:disabled { opacity: 0.3; cursor: not-allowed; }
    .opt-add { background: none; border: 1px dashed var(--line-200); border-radius: var(--radius-sm); padding: 10px; font-size: var(--text-sm); color: var(--honey-500); cursor: pointer; width: 100%; transition: border-color var(--transition); }
    .opt-add:hover { border-color: var(--honey-500); }
    .form-actions { display: flex; gap: 12px; margin-top: 24px; }
    .btn { padding: 10px 22px; border: none; border-radius: var(--radius-md); font-family: var(--font-body); font-size: var(--text-sm); font-weight: 600; cursor: pointer; transition: all var(--transition); }
    .btn:disabled { opacity: 0.4; cursor: not-allowed; }
    .btn-primary { background: var(--honey-500); color: var(--ink-900); flex: 1; }
    .btn-primary:hover:not(:disabled) { background: var(--honey-600); }
    .btn-outline { background: var(--color-surface); border: 1px solid var(--line-200); color: var(--ink-900); }
    .btn-outline:hover { border-color: var(--ink-700); }
  `]
})
export class SondageFormComponent implements OnDestroy {
  private fb = inject(FormBuilder);
  public router = inject(Router);
  private http = inject(HttpClient);
  private toast = inject(ToastService);
  private destroy$ = new Subject<void>();
  loading = signal(false);
  form = this.fb.nonNullable.group({
    question: ['', Validators.required],
    options: this.fb.array([
      this.fb.nonNullable.control('', Validators.required),
      this.fb.nonNullable.control('', Validators.required),
    ]),
  });

  get options() { return this.form.get('options') as FormArray; }

  ngOnDestroy() { this.destroy$.next(); this.destroy$.complete(); }

  addOption() { this.options.push(this.fb.nonNullable.control('', Validators.required)); }
  removeOption(i: number) { this.options.removeAt(i); }

  save() {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.http.post('/api/communaute/sondages', { question: this.form.value.question, options: this.form.value.options })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => { this.toast.success('Sondage créé'); this.router.navigate(['/communaute/sondages']); },
        error: () => { this.loading.set(false); this.toast.error('Erreur'); },
      });
  }
}
