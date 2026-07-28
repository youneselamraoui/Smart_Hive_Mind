import { Component, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../core/toast.service';

@Component({
  selector: 'app-mentorat-demander',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="page">
      <div class="page-head"><div><h1>Demander un Mentor</h1><p>Trouvez un mentor pour vous accompagner</p></div></div>

      @if (loading()) {
        <div class="skel-k"><div class="skel-line w-50"></div><div class="skel-line w-70"></div></div>
      } @else {
        <div class="form">
          <div class="field">
            <label>Domaine recherché</label>
            <select class="input" [(ngModel)]="formData.domaine">
              <option value="">Sélectionnez un domaine</option>
              @for (d of domaines; track d) { <option [value]="d">{{ d }}</option> }
            </select>
          </div>
          <div class="field">
            <label>Objectifs du mentorat</label>
            <textarea class="input input--ta" [(ngModel)]="formData.objectifs" rows="4" placeholder="Décrivez ce que vous attendez du mentorat…"></textarea>
          </div>
          <div class="field">
            <label>Disponibilités</label>
            <textarea class="input input--ta" [(ngModel)]="formData.disponibilites" rows="3" placeholder="Vos créneaux disponibles…"></textarea>
          </div>
          <div class="form-actions">
            <button class="btn btn-outline" (click)="router.navigate(['..'])">Annuler</button>
            <button class="btn btn-primary" [disabled]="!valid() || submitting()" (click)="envoyer()">{{ submitting() ? 'Envoi…' : 'Envoyer la demande' }}</button>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .page { position: relative; }
    .page-head { margin-bottom: 24px; }
    .page-head h1 { font-size: var(--text-2xl); margin: 0 0 2px; }
    .page-head p { margin: 0; font-size: var(--text-sm); color: var(--ink-700); }

    .skel-k { display: flex; flex-direction: column; gap: 12px; padding: 40px 0; }
    .skel-line { height: 14px; border-radius: 6px; background: var(--line-200); animation: sh 1.5s infinite; }
    .w-50 { width: 50%; } .w-70 { width: 70%; }
    @keyframes sh { 0%{opacity:0.5} 50%{opacity:1} 100%{opacity:0.5} }

    .form { max-width: 620px; display: flex; flex-direction: column; gap: 20px; background: var(--color-surface); border: 1px solid var(--line-200); border-radius: var(--radius-md); padding: 28px; }
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
export class MentoratDemanderComponent {
  private http = inject(HttpClient);
  private toast = inject(ToastService);
  router = inject(Router);
  loading = signal(false);
  submitting = signal(false);

  domaines = ['Stratégie', 'Finance', 'Marketing', 'Technique', 'RH', 'Juridique', 'Autre'];

  formData: any = { domaine: '', objectifs: '', disponibilites: '' };

  valid() {
    return this.formData.domaine && this.formData.objectifs?.trim()?.length >= 10;
  }

  envoyer() {
    if (!this.valid()) return;
    this.submitting.set(true);
    this.http.post<any>('/api/entrepreneuriat/mentorat/demander', this.formData).subscribe({
      next: () => { this.submitting.set(false); this.toast.success('Demande envoyée.'); this.router.navigate(['..']); },
      error: err => { this.submitting.set(false); this.toast.error(err.error?.error || 'Erreur.'); },
    });
  }
}
