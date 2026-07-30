import { Component, inject, signal, OnDestroy } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Subject, takeUntil } from 'rxjs';
import { ToastService } from '../../core/toast.service';

@Component({
  selector: 'app-temoignage-form',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <div class="page">
      <a routerLink="/communaute/temoignages" class="back-link">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="15 18 9 12 15 6"/></svg>
        Retour
      </a>
      <h1>Nouveau témoignage</h1>

      <div class="form-card">
        <form [formGroup]="form" (ngSubmit)="save()">
          <div class="field">
            <label>Titre</label>
            <input class="input" type="text" formControlName="titre" placeholder="Titre du témoignage" />
          </div>
          <div class="field">
            <label>Contenu</label>
            <textarea class="input input--ta" formControlName="contenu" rows="6" placeholder="Partagez votre expérience…"></textarea>
          </div>
          <div class="field">
            <label>Tags (optionnel, séparés par des virgules)</label>
            <input class="input" type="text" formControlName="tags" placeholder="Ex: communauté, pédagogie" />
          </div>
          <div class="form-actions">
            <button type="button" class="btn btn-outline" (click)="router.navigate(['/communaute/temoignages'])">Annuler</button>
            <button type="submit" class="btn btn-primary" [disabled]="form.invalid || loading()">{{ loading() ? 'Enregistrement…' : 'Publier le témoignage' }}</button>
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
    .input--ta { resize: vertical; }
    .input--sel { appearance: none; background-image: url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%2310131F' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 12px center; padding-right: 32px; }
    .form-actions { display: flex; gap: 12px; margin-top: 24px; }
    .btn { padding: 10px 22px; border: none; border-radius: var(--radius-md); font-family: var(--font-body); font-size: var(--text-sm); font-weight: 600; cursor: pointer; transition: all var(--transition); }
    .btn:disabled { opacity: 0.4; cursor: not-allowed; }
    .btn-primary { background: var(--honey-500); color: var(--ink-900); flex: 1; }
    .btn-primary:hover:not(:disabled) { background: var(--honey-600); }
    .btn-outline { background: var(--color-surface); border: 1px solid var(--line-200); color: var(--ink-900); }
    .btn-outline:hover { border-color: var(--ink-700); }
  `]
})
export class TemoignageFormComponent {
  private fb = inject(FormBuilder);
  public router = inject(Router);
  private http = inject(HttpClient);
  private toast = inject(ToastService);
  loading = signal(false);
  private destroy$ = new Subject<void>();

  ngOnDestroy() { this.destroy$.next(); this.destroy$.complete(); }
  form = this.fb.nonNullable.group({
    titre: ['', Validators.required],
    contenu: ['', Validators.required],
    tags: [''],
  });

  save() {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.http.post('/api/communaute/temoignages', {
      titre: this.form.value.titre,
      contenu: this.form.value.contenu,
      tags: this.form.value.tags ? this.form.value.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : [],
    }).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => { this.toast.success('Témoignage publié'); this.router.navigate(['/communaute/temoignages']); },
      error: err => { this.loading.set(false); this.toast.error(err.error?.error || 'Erreur lors de la publication'); },
    });
  }
}
