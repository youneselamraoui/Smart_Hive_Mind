import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { ToastService } from '../../core/toast.service';
import { ProjetRechercheFinanceService, Livrable } from './projet-recherche-finance.service';

@Component({
  selector: 'app-projet-form',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <div class="section">
      <div class="page-header">
        <h1>{{ isEdit() ? 'Modifier le projet' : 'Nouveau projet financé' }}</h1>
        <a class="btn-outline-sm" routerLink="/projets-recherche">Retour</a>
      </div>

      <div class="form-card">
        <form [formGroup]="form" (ngSubmit)="save()">
          <div class="field">
            <label for="theme">Thème du projet</label>
            <input id="theme" type="text" formControlName="theme" placeholder="Ex: Détection d'essaims par vision par ordinateur" />
          </div>

          <div class="field">
            <label for="budget">Budget (MAD)</label>
            <input id="budget" type="number" min="0" formControlName="budget" placeholder="Ex: 250000" />
          </div>

          <div class="field">
            <label>Livrables</label>
            <div formArrayName="livrables">
              @for (livrable of livrables.controls; track livrable; let i = $index) {
                <div class="livrable-row" [formGroupName]="i">
                  <input type="text" formControlName="description" placeholder="Description du livrable" />
                  <input type="date" formControlName="dateEcheance" title="Date d'échéance (optionnelle)" />
                  <input type="text" formControlName="statut" placeholder="Statut (optionnel)" />
                  <button type="button" class="livrable-remove" (click)="removeLivrable(i)" title="Supprimer">&times;</button>
                </div>
              }
            </div>
            <button type="button" class="livrable-add" (click)="addLivrable()">+ Ajouter un livrable</button>
          </div>

          <div class="field">
            <label for="statut">Statut</label>
            <select id="statut" formControlName="statut">
              <option value="candidature">Candidature</option>
              <option value="en_cours">En cours</option>
              <option value="termine">Terminé</option>
            </select>
          </div>

          <p class="form-note">L'industriel est déterminé automatiquement : vous êtes rattaché à ce projet comme son auteur.</p>

          <div class="form-actions">
            <button type="button" class="btn-outline" (click)="router.navigate(['/projets-recherche'])">Annuler</button>
            <button type="submit" class="btn-primary" [disabled]="form.invalid || loading()">
              {{ loading() ? 'Enregistrement…' : isEdit() ? 'Enregistrer' : 'Créer le projet' }}
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
    .form-note { font-size: 0.8rem; color: var(--ink-700); margin: 0 0 20px; }
    .livrable-row { display: grid; grid-template-columns: 1fr auto auto 36px; gap: 8px; margin-bottom: 8px; }
    .livrable-row input { padding: 10px 14px; border: 1.5px solid var(--color-border); border-radius: var(--radius-sm); font-size: 0.88rem; font-family: var(--font-sans); outline: none; background: var(--color-surface); color: var(--ink-900); box-sizing: border-box; }
    .livrable-row input:focus { border-color: var(--color-primary-blue); box-shadow: 0 0 0 3px rgba(217,160,43,0.15); }
    .livrable-remove { width: 36px; height: 38px; border: 1.5px solid var(--color-border); border-radius: var(--radius-sm); background: none; font-size: 1.2rem; cursor: pointer; color: var(--ink-700); display: flex; align-items: center; justify-content: center; }
    .livrable-remove:hover { border-color: var(--alert-500); color: var(--alert-500); }
    .livrable-add { background: none; border: 1.5px dashed var(--color-border); border-radius: var(--radius-sm); padding: 10px; font-size: 0.88rem; color: var(--color-primary-blue); cursor: pointer; width: 100%; }
    .livrable-add:hover { border-color: var(--color-primary-blue); }
    .form-actions { display: flex; gap: 12px; margin-top: 24px; }
    .btn-primary { flex: 1; padding: 12px; background: var(--color-primary-blue); color: var(--ink-900); border: none; border-radius: var(--radius-sm); font-size: 0.88rem; font-weight: 600; cursor: pointer; }
    .btn-primary:hover:not(:disabled) { background: var(--honey-600); }
    .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-outline { padding: 12px 24px; border: 1.5px solid var(--color-border); border-radius: var(--radius-sm); background: none; color: var(--color-text-secondary); font-size: 0.88rem; font-weight: 600; cursor: pointer; }
    .btn-outline:hover { border-color: var(--color-primary-blue); color: var(--color-primary-blue); }
    .btn-outline-sm { padding: 6px 14px; border: 1.5px solid var(--color-border); border-radius: var(--radius-sm); font-size: 0.78rem; color: var(--color-text-secondary); text-decoration: none; }
  `]
})
export class ProjetFormComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  public router = inject(Router);
  private route = inject(ActivatedRoute);
  private service = inject(ProjetRechercheFinanceService);
  private toast = inject(ToastService);

  loading = signal(false);
  isEdit = signal(false);
  private destroy$ = new Subject<void>();

  form = this.fb.nonNullable.group({
    theme: ['', Validators.required],
    budget: [<number | null>null],
    livrables: this.fb.array([]),
    statut: ['candidature'],
  });

  get livrables() { return this.form.get('livrables') as FormArray; }

  private livrableGroup(l?: Livrable) {
    return this.fb.nonNullable.group({
      description: [l?.description ?? ''],
      dateEcheance: [l?.dateEcheance ? l.dateEcheance.slice(0, 10) : ''],
      statut: [l?.statut ?? ''],
    });
  }

  addLivrable() { this.livrables.push(this.livrableGroup()); }
  removeLivrable(i: number) { this.livrables.removeAt(i); }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit.set(true);
      this.service.getById(id).pipe(takeUntil(this.destroy$)).subscribe({
        next: p => {
          this.form.patchValue({
            theme: p.theme,
            budget: p.budget ?? null,
            statut: p.statut,
          });
          this.livrables.clear();
          (p.livrables || []).forEach(l => this.livrables.push(this.livrableGroup(l)));
        },
        error: () => this.toast.error('Impossible de charger le projet.'),
      });
    }
  }

  ngOnDestroy() { this.destroy$.next(); this.destroy$.complete(); }

  save() {
    if (this.form.invalid) return;
    const raw = this.form.value;
    // industrielId volontairement absent : il est dérivé côté serveur depuis
    // req.membre._id (createProjetRechercheFinance), comme pour le schéma Zod
    // de création qui ne l'accepte pas.
    const data = {
      theme: raw.theme ?? '',
      ...(raw.budget != null ? { budget: raw.budget } : {}),
      livrables: (this.livrables.controls as FormGroup[])
        .map(g => {
          const v = g.value;
          const l: { description?: string; dateEcheance?: string; statut?: string } = {};
          if (v.description?.trim()) l.description = v.description.trim();
          if (v.dateEcheance) l.dateEcheance = v.dateEcheance;
          if (v.statut?.trim()) l.statut = v.statut.trim();
          return l;
        })
        .filter(l => l.description || l.dateEcheance || l.statut),
      statut: (raw.statut ?? 'candidature') as 'candidature' | 'en_cours' | 'termine',
    };

    this.loading.set(true);
    const id = this.route.snapshot.paramMap.get('id');
    const req = id ? this.service.update(id, data) : this.service.create(data);
    req.pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.toast.success(id ? 'Projet modifié.' : 'Projet créé.');
        this.router.navigate(['/projets-recherche']);
      },
      error: (e) => {
        this.loading.set(false);
        this.toast.error(e.error?.error || 'Erreur lors de l\'enregistrement.');
      },
    });
  }
}
