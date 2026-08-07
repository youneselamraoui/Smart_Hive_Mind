import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { Textarea } from 'primeng/textarea';
import { Button } from 'primeng/button';
import { ToastService } from '../../core/toast.service';
import { ICONS } from '../../core/icons';
import { SafeHtmlPipe } from '../../core/safe-html.pipe';

@Component({
  selector: 'app-prestation-form',
  standalone: true,
  imports: [ReactiveFormsModule, Textarea, Button, SafeHtmlPipe],
  template: `
    <div class="prestation-form-page">
      <div class="page-header">
        <div class="header-icon" [innerHTML]="ICONS.zap | safeHtml"></div>
        <div>
          <h1>{{ isEdit() ? 'Modifier la prestation' : 'Nouvelle prestation' }}</h1>
          <p>{{ isEdit() ? 'Modifiez les détails de votre prestation' : 'Proposez un service à la communauté' }}</p>
        </div>
      </div>

      <div class="form-card">
        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="prestation-form">
          <div class="form-field">
            <label for="description">Description</label>
            <textarea id="description" pTextarea formControlName="description" rows="5"
              placeholder="Décrivez la prestation proposée…" class="w-full"></textarea>
            @if (form.get('description')?.invalid && form.get('description')?.touched) {
              <small class="field-error">La description est requise</small>
            }
          </div>

          <div class="form-field">
            <label for="tarif">Tarif</label>
            <p-inputNumber id="tarif" formControlName="tarif" class="w-full" />
            @if (form.get('tarif')?.invalid && form.get('tarif')?.touched) {
              <small class="field-error">Le tarif doit être un nombre positif</small>
            }
          </div>

          <div class="form-actions">
            <p-button label="Annuler" icon="pi pi-times" severity="secondary" variant="outlined"
              type="button" (onClick)="cancel()"></p-button>
            <p-button [label]="submitting() ? 'Enregistrement...' : (isEdit() ? 'Enregistrer' : 'Créer la prestation')"
              [icon]="submitting() ? 'pi pi-spin pi-spinner' : (isEdit() ? 'pi pi-check' : 'pi pi-send')"
              [disabled]="form.invalid || submitting()" type="submit"></p-button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .prestation-form-page { position: relative; }
    .page-header { display: flex; align-items: center; gap: 14px; margin-bottom: 28px; }
    .header-icon { width: 44px; height: 44px; border-radius: var(--radius-sm); background: rgba(217,160,43,0.1); color: var(--honey-600); display: flex; align-items: center; justify-content: center; }
    .header-icon :deep(svg) { width: 22px; height: 22px; }
    .page-header h1 { font-size: 1.5rem; margin-bottom: 2px; }
    .page-header p { margin: 0; font-size: 0.9rem; }
    .form-card { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 32px; box-shadow: var(--shadow-card); max-width: 600px; }
    .prestation-form { display: flex; flex-direction: column; gap: 20px; }
    .form-field { display: flex; flex-direction: column; gap: 6px; }
    .form-field label { font-weight: 600; font-size: 0.9rem; color: var(--color-text); }
    .w-full { width: 100%; }
    .field-error { color: var(--color-error); font-size: 0.8rem; }
    .form-actions { display: flex; gap: 12px; justify-content: flex-end; margin-top: 8px; }
  `]
})
export class PrestationFormComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private toast = inject(ToastService);
  private destroy$ = new Subject<void>();
  protected readonly ICONS = ICONS;
  submitting = signal(false);
  isEdit = signal(false);
  editId: string | null = null;
  membreId = localStorage.getItem('membreId') || '';

  form = this.fb.nonNullable.group({
    description: ['', Validators.required],
    tarif: [0, [Validators.required, Validators.min(1)]],
  });

  ngOnDestroy() { this.destroy$.next(); this.destroy$.complete(); }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit.set(true);
      this.editId = id;
      this.http.get<any>('/api/prestations/' + id).pipe(takeUntil(this.destroy$)).subscribe({
        next: p => this.form.patchValue({ description: p.description, tarif: p.tarif }),
        error: () => this.router.navigate(['/marketplace']),
      });
    }
  }

  onSubmit() {
    if (this.form.invalid) return;

    this.submitting.set(true);
    const payload = {
      ...this.form.getRawValue(),
      clientId: this.membreId,
    };

    if (this.isEdit() && this.editId) {
      this.http.put<any>('/api/prestations/' + this.editId, payload).pipe(takeUntil(this.destroy$)).subscribe({
        next: () => {
          this.toast.success('Prestation modifiée.');
          this.router.navigate(['/marketplace']);
        },
        error: err => { this.submitting.set(false); this.toast.error(err.error?.error || 'Erreur modification.'); },
      });
    } else {
      this.http.post<any>('/api/prestations', payload).pipe(takeUntil(this.destroy$)).subscribe({
        next: () => {
          this.toast.success('Prestation créée.');
          this.router.navigate(['/marketplace']);
        },
        error: err => { this.submitting.set(false); this.toast.error(err.error?.error || 'Erreur création.'); },
      });
    }
  }

  cancel() {
    this.router.navigate(['/marketplace']);
  }
}
