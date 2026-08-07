import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { ToastService } from '../../core/toast.service';
import { StructureRechercheService } from './structure-recherche.service';

@Component({
  selector: 'app-structure-form',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <div class="section">
      <div class="page-header">
        <h1>{{ isEdit() ? 'Modifier la structure' : 'Nouvelle structure' }}</h1>
        <a class="btn-outline-sm" routerLink="/structures-recherche">Retour</a>
      </div>

      <div class="form-card">
        <form [formGroup]="form" (ngSubmit)="save()">
          <div class="field">
            <label for="nom">Nom</label>
            <input id="nom" type="text" formControlName="nom" placeholder="Ex: Laboratoire d'Intelligence Artificielle" />
          </div>

          <div class="field">
            <label for="type">Type</label>
            <select id="type" formControlName="type">
              <option value="centre">Centre</option>
              <option value="laboratoire">Laboratoire</option>
              <option value="equipe">Équipe</option>
            </select>
          </div>

          <div class="field">
            <label for="axes">Axes de recherche (séparés par des virgules)</label>
            <input id="axes" type="text" formControlName="axes" placeholder="Ex: IA, Cybersécurité, Data Science" />
          </div>

          <div class="form-actions">
            <button type="button" class="btn-outline" (click)="router.navigate(['/structures-recherche'])">Annuler</button>
            <button type="submit" class="btn-primary" [disabled]="form.invalid || loading()">
              {{ loading() ? 'Enregistrement…' : isEdit() ? 'Enregistrer' : 'Créer la structure' }}
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
    .field input, .field textarea, .field select { padding: 10px 14px; border: 1.5px solid var(--color-border); border-radius: var(--radius-sm); font-size: 0.88rem; font-family: var(--font-sans); outline: none; background: var(--color-surface); color: var(--ink-900); }
    .field input:focus, .field textarea:focus, .field select:focus { border-color: var(--color-primary-blue); box-shadow: 0 0 0 3px rgba(217,160,43,0.15); }
    .form-actions { display: flex; gap: 12px; margin-top: 24px; }
    .btn-primary { flex: 1; padding: 12px; background: var(--color-primary-blue); color: var(--ink-900); border: none; border-radius: var(--radius-sm); font-size: 0.88rem; font-weight: 600; cursor: pointer; }
    .btn-primary:hover:not(:disabled) { background: var(--honey-600); }
    .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-outline { padding: 12px 24px; border: 1.5px solid var(--color-border); border-radius: var(--radius-sm); background: none; color: var(--color-text-secondary); font-size: 0.88rem; font-weight: 600; cursor: pointer; }
    .btn-outline:hover { border-color: var(--color-primary-blue); color: var(--color-primary-blue); }
    .btn-outline-sm { padding: 6px 14px; border: 1.5px solid var(--color-border); border-radius: var(--radius-sm); font-size: 0.78rem; color: var(--color-text-secondary); text-decoration: none; }
  `]
})
export class StructureFormComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  public router = inject(Router);
  private route = inject(ActivatedRoute);
  private service = inject(StructureRechercheService);
  private toast = inject(ToastService);

  loading = signal(false);
  isEdit = signal(false);
  private destroy$ = new Subject<void>();

  form = this.fb.nonNullable.group({
    nom: ['', Validators.required],
    type: ['centre'],
    axes: [''],
  });

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit.set(true);
      this.service.getById(id).pipe(takeUntil(this.destroy$)).subscribe({
        next: s => {
          this.form.patchValue({
            nom: s.nom,
            type: s.type,
            axes: (s.axes || []).join(', '),
          });
        },
        error: () => this.toast.error('Impossible de charger la structure.'),
      });
    }
  }

  ngOnDestroy() { this.destroy$.next(); this.destroy$.complete(); }

  save() {
    if (this.form.invalid) return;
    const raw = this.form.value;
    const data = {
      nom: raw.nom ?? '',
      type: (raw.type ?? 'centre') as 'centre' | 'laboratoire' | 'equipe',
      axes: (raw.axes || '')
        .split(',')
        .map((s: string) => s.trim())
        .filter(Boolean),
    };

    this.loading.set(true);
    const id = this.route.snapshot.paramMap.get('id');
    const req = id ? this.service.update(id, data) : this.service.create(data);
    req.pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.toast.success(id ? 'Structure modifiée.' : 'Structure créée.');
        this.router.navigate(['/structures-recherche']);
      },
      error: (e) => {
        this.loading.set(false);
        this.toast.error(e.error?.error || 'Erreur lors de l\'enregistrement.');
      },
    });
  }
}
