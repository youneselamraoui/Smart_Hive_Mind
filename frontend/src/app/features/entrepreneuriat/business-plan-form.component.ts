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
            <label>Modèle économique</label>
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
            <label>Contenu pour l'IA</label>
            <textarea class="input input--ta" [(ngModel)]="formData.contenuIA" rows="3" placeholder="Décrivez votre projet ou collez une ébauche, l'IA générera un business plan structuré…"></textarea>
            <button class="btn btn-sm btn-ia" [disabled]="!formData.contenuIA?.trim() || iaLoading()" (click)="genererIA()">
              {{ iaLoading() ? 'Génération…' : 'Générer avec l\'IA' }}
            </button>
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
    .input:focus { border-color: var(--indigo-500); }
    .input--ta { resize: vertical; min-height: 80px; }

    .form-actions { display: flex; gap: 10px; justify-content: flex-end; margin-top: 8px; }
    .btn { display: inline-flex; align-items: center; gap: 6px; padding: 10px 24px; border: none; border-radius: var(--radius-sm); font-family: var(--font-body); font-size: var(--text-sm); font-weight: 600; cursor: pointer; transition: all var(--transition); }
    .btn:disabled { opacity: 0.4; cursor: not-allowed; }
    .btn-sm { padding: 6px 14px; font-size: var(--text-xs); }
    .btn-primary { background: var(--indigo-500); color: #fff; }
    .btn-primary:hover:not(:disabled) { background: var(--indigo-600); }
    .btn-ia { background: var(--indigo-100); color: var(--indigo-700); border: 1px solid var(--indigo-300); align-self: flex-start; }
    .btn-ia:hover:not(:disabled) { background: var(--indigo-200); }
    .btn-outline { background: var(--color-surface); border: 1px solid var(--line-200); color: var(--ink-900); }
    .btn-outline:hover { border-color: var(--ink-700); }
  `]
})
export class BusinessPlanFormComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);
  private toast = inject(ToastService);
  router = inject(Router);

  formData: any = { titre: '', modeleEconomique: '', budgetGlobal: null, previsionsFinancieres: '', contenuIA: '' };
  loading = signal(true);
  submitting = signal(false);
  iaLoading = signal(false);
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
        next: d => { this.formData = { titre: d.titre || '', modeleEconomique: d.modeleEconomique || '', budgetGlobal: d.budget, previsionsFinancieres: d.previsions || '', contenuIA: '' }; this.loading.set(false); },
        error: () => this.loading.set(false),
      });
    } else { this.loading.set(false); }
  }

  genererIA() {
    const contenu = this.formData.contenuIA?.trim();
    if (!contenu) return;
    this.iaLoading.set(true);
    this.http.post<any>('/api/entrepreneuriat/business-plan/generate', {
      contenu,
      projetId: null,
    }).subscribe({
      next: (res) => {
        this.iaLoading.set(false);
        if (res?.businessPlan?.assistanceDetails) {
          const iaSegments = res.businessPlan.assistanceDetails.filter((s: any) => s.source === 'ia');
          if (iaSegments.length) {
            this.formData.modeleEconomique = (this.formData.modeleEconomique + '\n\n--- Assistance IA ---\n' + iaSegments.map((s: any) => s.segment).join('\n\n')).trim();
          }
        }
        this.toast.success('Contenu généré par l\'IA.');
      },
      error: (err) => {
        this.iaLoading.set(false);
        this.toast.error(err.error?.error || 'Erreur lors de la génération IA.');
      },
    });
  }

  save() {
    if (!this.valid()) return;
    this.submitting.set(true);
    const body = { titre: this.formData.titre, modeleEconomique: this.formData.modeleEconomique, budgetGlobal: this.formData.budgetGlobal, previsionsFinancieres: this.formData.previsionsFinancieres };
    const req = this.bpId
      ? this.http.put<any>('/api/entrepreneuriat/business-plans/' + this.bpId, body)
      : this.http.post<any>('/api/entrepreneuriat/business-plans', body);
    req.subscribe({
      next: () => { this.submitting.set(false); this.toast.success('Business plan enregistré.'); this.router.navigate(['..']); },
      error: err => { this.submitting.set(false); this.toast.error(err.error?.error || 'Erreur.'); },
    });
  }
}
