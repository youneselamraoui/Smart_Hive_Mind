import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Subject, takeUntil } from 'rxjs';
import { ToastService } from '../../core/toast.service';

@Component({
  selector: 'app-model-publish',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <div class="page">
      <a routerLink="/smart-tools/models" class="back-link">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="15 18 9 12 15 6"/></svg>
        Model Bank
      </a>
      <h1>Publier un modèle</h1>

      <div class="form-card">
        <form [formGroup]="form" (ngSubmit)="save()">
          <div class="field">
            <label>Nom du modèle</label>
            <input class="input" type="text" formControlName="nom" placeholder="Ex: ResNet-50" />
          </div>
          <div class="field">
            <label>Tâche</label>
            <textarea class="input input--ta" formControlName="tache" rows="4" placeholder="Décrivez la tâche du modèle…"></textarea>
          </div>
          <div class="field">
            <label>Version</label>
            <input class="input" type="text" formControlName="version" placeholder="Ex: 1.0.0" />
          </div>
          <div class="field">
            <label>Performance (précision)</label>
            <input class="input" type="number" formControlName="performance" placeholder="Ex: 0.95" step="0.01" min="0" max="1" />
          </div>
          <div class="field">
            <label>Jeu de données source</label>
            <select class="input input--sel" formControlName="jeuDeDonneesId">
              <option value="">— Aucun —</option>
              @for (ds of datasets(); track ds._id) {
                <option [value]="ds._id">{{ ds.nom }}@if (ds.domaine) { ({{ ds.domaine }}) }</option>
              }
            </select>
          </div>
          <div class="field">
            <label>Fichier du modèle</label>
            <input class="input" type="file" (change)="onFileSelected($event)" accept=".zip,.tar.gz,.pt,.h5,.onnx,.json" />
          </div>
          <div class="field">
            <label>URL d'explicabilité</label>
            <input class="input" type="url" formControlName="explicabiliteUrl" placeholder="https://…" />
          </div>
          <div class="form-actions">
            <button type="button" class="btn btn-outline" (click)="router.navigate(['/smart-tools/models'])">Annuler</button>
            <button type="submit" class="btn btn-primary" [disabled]="form.invalid || loading()">{{ loading() ? 'Publication…' : 'Publier le modèle' }}</button>
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
export class ModelPublishComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  public router = inject(Router);
  private http = inject(HttpClient);
  private toast = inject(ToastService);
  loading = signal(false);
  datasets = signal<any[]>([]);
  selectedFile: File | null = null;
  private destroy$ = new Subject<void>();

  ngOnDestroy() { this.destroy$.next(); this.destroy$.complete(); }
  form = this.fb.nonNullable.group({
    nom: ['', Validators.required],
    tache: ['', Validators.required],
    version: [''],
    performance: [''],
    jeuDeDonneesId: [''],
    explicabiliteUrl: [''],
  });

  ngOnInit() {
    this.http.get<any[]>('/api/smart-tools/datasets').pipe(takeUntil(this.destroy$)).subscribe({
      next: list => this.datasets.set(list),
    });
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
    }
  }

  save() {
    if (this.form.invalid) return;
    if (!this.selectedFile) { this.toast.error('Veuillez sélectionner un fichier.'); return; }
    this.loading.set(true);

    const v = this.form.value;
    const fd = new FormData();
    fd.append('nom', v.nom!);
    fd.append('tache', v.tache!);
    fd.append('version', v.version || '');
    if (v.performance) fd.append('performance', JSON.stringify({ accuracy: parseFloat(v.performance) }));
    if (v.jeuDeDonneesId) fd.append('jeuDeDonneesId', v.jeuDeDonneesId);
    fd.append('explicabiliteUrl', v.explicabiliteUrl || '');
    fd.append('fichier', this.selectedFile);

    this.http.post('/api/smart-tools/models', fd).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => { this.toast.success('Modèle publié.'); this.router.navigate(['/smart-tools/models']); },
      error: err => { this.loading.set(false); this.toast.error(err.error?.error || 'Erreur publication.'); },
    });
  }
}
