import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../core/toast.service';

@Component({
  selector: 'app-business-plan-form',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="page">
      <div class="page-head"><div><h1>{{ isEdit() ? 'Modifier' : 'Créer' }} un Business Plan</h1></div></div>

      @if (loading()) {
        <div class="skel-k"><div class="skel-line w-50"></div><div class="skel-line w-80"></div><div class="skel-line w-60"></div></div>
      } @else {
        <div class="form">
          <div class="field">
            <label>Titre</label>
            <input class="input" [(ngModel)]="formData.titre" placeholder="Titre de votre projet" maxlength="200" />
          </div>
          <div class="field">
            <label>Modele économique</label>
            <textarea class="input input--ta" [(ngModel)]="formData.modeleEconomique" rows="6" placeholder="Décrivez votre modèle économique…"></textarea>
          </div>
          <div class="field">
            <label>Budget global (FCFA)</label>
            <input class="input" type="number" [(ngModel)]="formData.budgetGlobal" placeholder="0" min="0" />
          </div>
          <div class="field">
            <label>Prévisions financières</label>
            <textarea class="input input--ta" [(ngModel)]="formData.previsionsFinancieres" rows="4" placeholder="Prévisions sur 3-5 ans…"></textarea>
          </div>
          <div class="field">
            <label>Assistance IA (optionnel)</label>
            <textarea class="input input--ta" [(ngModel)]="formData.assistanceDetails" rows="3" placeholder="Détails sur l'assistance IA souhaitée…"></textarea>
          </div>
          <div class="form-actions">
            <button class="btn btn-outline" (click)="router.navigate(['..'])">Annuler</button>
            <button class="btn btn-primary" [disabled]="!valid() || submitting()" (click)="save()">{{ submitting() ? 'Enregistrement…' : isEdit() ? 'Mettre à jour' : 'Créer' }}</button>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .page { position: relative; }
    .page-head { margin-bottom: 24px; }
    .page-head h1 { font-size: var(--text-2xl); margin: 0; }

    .skel-k { display: flex; flex-direction: column; gap: 12px; padding: 40px 0; }
    .skel-line { height: 14px; border-radius: 6px; background: var(--line-200); animation: sh 1.5s infinite; }
    .w-50 { width: 50%; } .w-80 { width: 80%; } .w-60 { width: 60%; }
    @keyframes sh { 0%{opacity:0.5} 50%{opacity:1} 100%{opacity:0.5} }

    .form { max-width: 720px; display: flex; flex-direction: column; gap: 20px; background: var(--color-surface); border: 1px solid var(--line-200); border-radius: var(--radius-md); padding: 28px; }
    .field { display: flex; flex-direction: column; gap: 6px; }
    .field label { font-size: var(--text-sm); font-weight: 600; color: var(--ink-900); }

    .input { padding: 10px 14px; border: 1px solid var(--line-200); border-radius: var(--radius-sm); font-family: var(--font-body); font-size: var(--text-sm); outline: none; background: var(--color-surface); color: var(--ink-900); transition: border-color var(--transition); }
    .input:focus { border-color: var(--honey-500); }
    .input--ta { resize: vertical; min-height: 80px; }

    .form-actions { display: flex; gap: 10px; justify-content: flex-end; margin-top: 8px; }
    .btn { display: inline-flex; align-items: center; gap: 6px; padding: 10px 24px; border: none; border-radius: var(--radius-sm); font-family: var(--font-body); font-size: var(--text-sm); font-weight: 600; cursor: pointer; transition: all var(--transition); }
    .btn:disabled { opacity: 0.4; cursor: not-allowed; }
    .btn-primary { background: var(--honey-500); color: var(--ink-900); }
    .btn-primary:hover:not(:disabled) { background: var(--honey-600); }
    .btn-outline { background: var(--color-surface); border: 1px solid var(--line-200); color: var(--ink-900); }
    .btn-outline:hover { border-color: var(--ink-700); }
  `]
})
export class BusinessPlanFormComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);
  private toast = inject(ToastService);
  router = inject(Router);

  formData: any = { titre: '', modeleEconomique: '', budgetGlobal: null, previsionsFinancieres: '', assistanceDetails: '' };
  loading = signal(true);
  submitting = signal(false);
  bpId: string | null = null;

  isEdit = () => !!this.bpId;

  valid() {
    const d = this.formData;
    return d.titre?.trim()?.length >= 3 && d.modeleEconomique?.trim()?.length >= 10 && d.budgetGlobal > 0;
  }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.bpId = id;
      this.http.get<any>('/api/entrepreneuriat/business-plans/' + id).subscribe({
        next: d => { this.formData = { titre: d.titre, modeleEconomique: d.modeleEconomique, budgetGlobal: d.budgetGlobal, previsionsFinancieres: d.previsionsFinancieres || '', assistanceDetails: d.assistanceDetails || '' }; this.loading.set(false); },
        error: () => this.loading.set(false),
      });
    } else { this.loading.set(false); }
  }

  save() {
    if (!this.valid()) return;
    this.submitting.set(true);
    const body = { ...this.formData };
    const req = this.bpId
      ? this.http.put<any>('/api/entrepreneuriat/business-plans/' + this.bpId, body)
      : this.http.post<any>('/api/entrepreneuriat/business-plans', body);
    req.subscribe({
      next: () => { this.submitting.set(false); this.toast.success('Business plan enregistré.'); this.router.navigate(['..']); },
      error: err => { this.submitting.set(false); this.toast.error(err.error?.error || 'Erreur.'); },
    });
  }
}
