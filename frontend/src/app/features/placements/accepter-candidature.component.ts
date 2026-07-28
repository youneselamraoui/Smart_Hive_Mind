import { Component, OnInit, inject, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { DatePipe, CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { catchError, of, finalize } from 'rxjs';
import { fadeInUp } from '../../core/animations';
import { ICONS } from '../../core/icons';
import { ToastService } from '../../core/toast.service';

interface Candidature {
  _id: string;
  offreId: { _id: string; titre: string; description?: string };
  membreId: { _id: string; nom: string; prenom: string; email: string };
  statut: string;
  createdAt: string;
}

@Component({
  selector: 'app-accepter-candidature',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, DatePipe],
  template: `
    <div class="section" @fadeInUp>
      <div class="page-header">
        <div class="header-icon" [innerHTML]="ICONS.placements"></div>
        <div>
          <h1>Accepter une candidature</h1>
          <p>Validez une candidature pour créer une mission</p>
        </div>
      </div>

      @if (loading()) {
        <div class="skeleton-card">
          <div class="skeleton-line w-60"></div>
          <div class="skeleton-line w-80"></div>
          <div class="skeleton-line w-40"></div>
        </div>
      } @else {
        @if (candidatures.length === 0) {
          <div class="empty-state">
            <div class="empty-icon" [innerHTML]="ICONS.placements"></div>
            <h3>Aucune candidature en attente</h3>
            <p>Les candidatures en attente apparaîtront ici.</p>
          </div>
        } @else {
          <div class="table-wrap">
            <div class="table-header">
              <span>Offre</span>
              <span>Candidat</span>
              <span>Date</span>
              <span>Action</span>
            </div>
            @for (c of candidatures; track c._id) {
              <div class="table-row" [class.expanded]="expandedId() === c._id">
                <span class="cell-title">{{ c.offreId?.titre }}</span>
                <span class="cell">{{ c.membreId?.prenom }} {{ c.membreId?.nom }}<br><small>{{ c.membreId?.email }}</small></span>
                <span class="cell">{{ c.createdAt | date:'shortDate' }}</span>
                <span class="cell-action">
                  @if (expandedId() === c._id) {
                    <button class="btn-cancel" (click)="expandedId.set(null)">Annuler</button>
                  } @else {
                    <button class="btn-primary" (click)="expandedId.set(c._id)">Accepter</button>
                  }
                </span>
                @if (expandedId() === c._id) {
                  <div class="expand-content">
                    <form [formGroup]="acceptForm" (ngSubmit)="accepter(c._id)">
                      <div class="form-row">
                        <label>
                          Début
                          <input type="date" formControlName="periodeDebut" />
                        </label>
                        <label>
                          Fin
                          <input type="date" formControlName="periodeFin" />
                        </label>
                      </div>
                      @if (submittingId() === c._id) {
                        <button class="btn-primary" type="button" disabled>Traitement…</button>
                      } @else {
                        <button class="btn-primary" type="submit" [disabled]="acceptForm.invalid">Confirmer l'acceptation</button>
                      }
                    </form>
                  </div>
                }
              </div>
            }
          </div>
        }
      }
    </div>
  `,
  styles: [`
    :host { display: block; }

    .page-header {
      display: flex; align-items: center; gap: 14px; margin-bottom: 28px;
    }
    .header-icon {
      width: 44px; height: 44px; border-radius: var(--radius-sm);
      background: rgba(217,160,43,0.1); color: var(--honey-600);
      display: flex; align-items: center; justify-content: center;
    }
    .header-icon :deep(svg) { width: 22px; height: 22px; }
    .page-header h1 { font-size: 1.5rem; margin-bottom: 2px; }
    .page-header p { margin: 0; font-size: 0.9rem; }

    .skeleton-card { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 24px; max-width: 600px; }
    .skeleton-line { height: 14px; border-radius: 4px; background: linear-gradient(90deg, var(--color-border) 25%, var(--color-surface) 50%, var(--color-border) 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; margin-bottom: 10px; }
    .skeleton-line:last-child { margin-bottom: 0; }
    .w-40 { width: 40%; } .w-60 { width: 60%; } .w-80 { width: 80%; }
    @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

    .empty-state { display: flex; flex-direction: column; align-items: center; text-align: center; padding: 60px 20px; }
    .empty-icon { margin-bottom: 16px; color: var(--color-sky-blue); }
    .empty-state h3 { color: var(--color-text-secondary); margin-bottom: 4px; }
    .empty-state p { margin: 0; font-size: 0.85rem; }

    .table-wrap { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-md); overflow: hidden; }
    .table-header { display: grid; grid-template-columns: 1.5fr 1.5fr 0.8fr 0.8fr; gap: 8px; padding: 10px 16px; background: var(--color-sky-blue-light); font-size: 0.78rem; font-weight: 700; color: var(--color-deep-blue); }
    .table-row { display: grid; grid-template-columns: 1.5fr 1.5fr 0.8fr 0.8fr; gap: 8px; padding: 10px 16px; border-bottom: 1px solid var(--color-border); font-size: 0.82rem; align-items: center; position: relative; }
    .table-row:last-child { border-bottom: none; }
    .table-row.expanded { border-bottom: 1px solid var(--color-border); }
    .cell-title { font-weight: 600; }
    .cell { color: var(--color-text-secondary); }
    .cell small { font-size: 0.75rem; }
    .cell-action { display: flex; gap: 6px; }
    .expand-content { grid-column: 1 / -1; padding: 12px 0 4px; border-top: 1px solid var(--color-border); margin-top: 8px; }
    .expand-content form { display: flex; flex-direction: column; gap: 12px; align-items: flex-start; }
    .form-row { display: flex; gap: 16px; flex-wrap: wrap; }
    .form-row label { display: flex; flex-direction: column; gap: 4px; font-size: 0.82rem; font-weight: 600; }
    .form-row input { padding: 6px 10px; border: 1.5px solid var(--color-border); border-radius: var(--radius-sm); font-family: var(--font-sans); font-size: 0.85rem; }
    .btn-primary { padding: 8px 16px; background: var(--color-primary-blue); color: #fff; border: none; border-radius: var(--radius-sm); font-size: 0.82rem; font-weight: 600; cursor: pointer; font-family: var(--font-sans); transition: opacity var(--transition); }
    .btn-primary:hover { opacity: 0.9; }
    .btn-primary:disabled { opacity: 0.5; cursor: default; }
    .btn-cancel { padding: 8px 16px; background: transparent; color: var(--color-text-secondary); border: 1.5px solid var(--color-border); border-radius: var(--radius-sm); font-size: 0.82rem; font-weight: 600; cursor: pointer; font-family: var(--font-sans); }
    .btn-cancel:hover { background: var(--color-sky-blue-light); }
  `]
})
export class AccepterCandidatureComponent implements OnInit {
  private http = inject(HttpClient);
  private toast = inject(ToastService);
  private fb = inject(FormBuilder);
  protected readonly ICONS = ICONS;

  candidatures: Candidature[] = [];
  loading = signal(true);
  expandedId = signal<string | null>(null);
  submittingId = signal<string | null>(null);

  acceptForm = this.fb.nonNullable.group({
    periodeDebut: ['', Validators.required],
    periodeFin: [''],
  });

  ngOnInit() {
    this.http.get<Candidature[]>('/api/placements/candidatures?statut=en_attente')
      .pipe(catchError(() => of([])), finalize(() => this.loading.set(false)))
      .subscribe(list => this.candidatures = list);
  }

  accepter(candidatureId: string) {
    if (this.acceptForm.invalid) return;
    this.submittingId.set(candidatureId);
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders(token ? { Authorization: `Bearer ${token}` } : {});
    this.http.post('/api/placements/accepter', {
      candidatureId,
      periodeDebut: this.acceptForm.value.periodeDebut,
      periodeFin: this.acceptForm.value.periodeFin || undefined,
    }, { headers }).subscribe({
      next: () => {
        this.toast.success('Candidature acceptée, mission créée.');
        this.candidatures = this.candidatures.filter(c => c._id !== candidatureId);
        this.expandedId.set(null);
        this.acceptForm.reset();
        this.submittingId.set(null);
      },
      error: () => {
        this.toast.error('Erreur lors de l\'acceptation.');
        this.submittingId.set(null);
      },
    });
  }
}
