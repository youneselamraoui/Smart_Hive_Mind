import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-atelier-start',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="page">
      <a routerLink="/smart-tools/models" class="back-link">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="15 18 9 12 15 6"/></svg>
        Model Bank
      </a>
      <h1>Lancer un atelier</h1>
      <p>Choisissez un type d'atelier pour démarrer un parcours automatisé</p>

      <div class="form-card">
        <div class="field">
          <label>Nom de l'atelier</label>
          <input class="input" [(ngModel)]="nom" placeholder="Ex: Analyse prédictive Q3" />
        </div>

        <div class="field">
          <label>Type d'atelier</label>
          <div class="type-list">
            @for (t of types; track t.id) {
              <div class="type-card" [class.selected]="selectedType === t.id" (click)="selectedType = t.id">
                <svg class="type-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33"/><path d="M4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68"/></svg>
                <div class="type-info">
                  <strong>{{ t.label }}</strong>
                  <p>{{ t.description }}</p>
                </div>
                @if (selectedType === t.id) {
                  <svg class="type-check" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                }
              </div>
            }
          </div>
        </div>

        <div class="form-actions">
          <button class="btn btn-primary" [disabled]="!canSubmit || submitting()" (click)="demarrer()">
            @if (submitting()) { <div class="spin-sm"></div> }
            {{ submitting() ? 'Lancement…' : "Démarrer l'atelier" }}
          </button>
          <a class="btn btn-outline" routerLink="../models">Annuler</a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .page { max-width: 640px; }
    .back-link { display: inline-flex; align-items: center; gap: 6px; color: var(--ink-700); text-decoration: none; font-size: var(--text-sm); margin-bottom: 16px; }
    .back-link:hover { color: var(--honey-500); }
    h1 { font-size: var(--text-xl); margin: 0 0 4px; }
    p { font-size: var(--text-sm); color: var(--ink-700); margin: 0 0 20px; }

    .form-card { background: var(--color-surface); border: 1px solid var(--line-200); border-radius: var(--radius-md); padding: 24px; display: flex; flex-direction: column; gap: 20px; }
    .field { display: flex; flex-direction: column; gap: 6px; }
    .field label { font-size: var(--text-sm); font-weight: 600; }
    .input { padding: 10px 14px; border: 1px solid var(--line-200); border-radius: var(--radius-sm); font-family: var(--font-body); font-size: var(--text-sm); outline: none; background: var(--color-surface); color: var(--ink-900); transition: border-color var(--transition); }
    .input:focus { border-color: var(--honey-500); box-shadow: 0 0 0 3px rgba(217,160,43,0.08); }

    .type-list { display: flex; flex-direction: column; gap: 10px; }
    .type-card { display: flex; align-items: center; gap: 14px; padding: 16px; border: 1px solid var(--line-200); border-radius: var(--radius-md); cursor: pointer; transition: all var(--transition); }
    .type-card:hover { border-color: var(--honey-500); }
    .type-card.selected { border-color: var(--honey-500); background: rgba(217,160,43,0.04); }
    .type-icon { flex-shrink: 0; color: var(--honey-500); }
    .type-info { flex: 1; }
    .type-info strong { display: block; font-size: var(--text-sm); margin-bottom: 2px; }
    .type-info p { margin: 0; font-size: var(--text-xs); color: var(--ink-700); }
    .type-check { color: var(--verify-500); flex-shrink: 0; }

    .form-actions { display: flex; align-items: center; gap: 12px; padding-top: 4px; }
    .btn { display: inline-flex; align-items: center; gap: 8px; padding: 10px 22px; border: none; border-radius: var(--radius-md); font-family: var(--font-body); font-size: var(--text-sm); font-weight: 600; cursor: pointer; transition: all var(--transition); text-decoration: none; }
    .btn:disabled { opacity: 0.4; cursor: not-allowed; }
    .btn-primary { background: var(--honey-500); color: var(--ink-900); }
    .btn-primary:hover:not(:disabled) { background: var(--honey-600); }
    .btn-outline { background: var(--color-surface); border: 1px solid var(--line-200); color: var(--ink-900); }
    .btn-outline:hover { border-color: var(--ink-700); }
    .spin-sm { width: 14px; height: 14px; border: 2px solid rgba(16,19,31,0.2); border-top-color: var(--ink-900); border-radius: 50%; animation: sp 0.7s linear infinite; }
    @keyframes sp { to { transform: rotate(360deg); } }
  `]
})
export class AtelierStartComponent {
  private http = inject(HttpClient);
  private router = inject(Router);
  types = [{ id: 'ia-neuro-symbolique', label: 'Atelier IA neuro-symbolique', description: 'Parcours complet : sélection de données → génération synthétique → entraînement → publication du modèle' }];
  nom = '';
  selectedType = '';
  submitting = signal(false);

  get canSubmit() { return this.nom.trim().length > 0 && this.selectedType.length > 0; }

  demarrer() {
    if (!this.canSubmit || this.submitting()) return;
    this.submitting.set(true);
    this.http.post<{ _id: string }>('/api/smart-tools/ateliers', { nom: this.nom.trim(), type: this.selectedType }).subscribe({
      next: res => this.router.navigate(['/smart-tools/ateliers', res._id]),
      error: () => this.submitting.set(false),
    });
  }
}
