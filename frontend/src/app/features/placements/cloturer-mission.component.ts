import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { DatePipe, CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subject, takeUntil, catchError, of, finalize } from 'rxjs';
import { fadeInUp } from '../../core/animations';
import { ICONS } from '../../core/icons';
import { ToastService } from '../../core/toast.service';
import { SafeHtmlPipe } from '../../core/safe-html.pipe';

interface Mission {
  _id: string;
  offreId: { _id: string; titre: string };
  membreId: { _id: string; nom: string; prenom: string; email: string };
  periode: { debut: string; fin?: string };
  statut: string;
  evaluationClient?: number;
  createdAt: string;
}

@Component({
  selector: 'app-cloturer-mission',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, DatePipe, RouterLink, SafeHtmlPipe],
  template: `
    <div class="section" @fadeInUp>
      <div class="page-header">
        <div class="header-icon" [innerHTML]="ICONS.placements | safeHtml"></div>
        <div>
          <h1>Clôturer une mission</h1>
          <p>Évaluez le travail et mettez fin à la mission</p>
        </div>
      </div>

      @if (loading()) {
        <div class="skeleton-card">
          <div class="skeleton-line w-60"></div>
          <div class="skeleton-line w-80"></div>
          <div class="skeleton-line w-40"></div>
        </div>
      } @else {
        @if (missions.length === 0) {
          <div class="empty-state">
            <div class="empty-icon" [innerHTML]="ICONS.placements | safeHtml"></div>
            <h3>Aucune mission en cours</h3>
            <p>Les missions en cours apparaîtront ici.</p>
          </div>
        } @else {
          <div class="table-wrap">
            <div class="table-header">
              <span>Mission</span>
              <span>Membre</span>
              <span>Période</span>
              <span>Action</span>
            </div>
            @for (m of missions; track m._id) {
              <div class="table-row" [class.expanded]="expandedId() === m._id">
                <span class="cell-title">{{ m.offreId?.titre }}</span>
                <span class="cell"><a class="cell-link" routerLink="/placements/profil/{{ m.membreId?._id }}">{{ m.membreId?.prenom }} {{ m.membreId?.nom }}</a></span>
                <span class="cell">{{ m.periode.debut | date:'shortDate' }} — {{ m.periode.fin ? (m.periode.fin | date:'shortDate') : '…' }}</span>
                <span class="cell-action">
                  @if (expandedId() === m._id) {
                    <button class="btn-cancel" (click)="expandedId.set(null)">Annuler</button>
                  } @else {
                    <button class="btn-warning" (click)="expandedId.set(m._id); initForm(m)">Clôturer</button>
                  }
                </span>
                @if (expandedId() === m._id) {
                  <div class="expand-content">
                    <form [formGroup]="clotureForm" (ngSubmit)="cloturer(m._id)">
                      <div class="form-group">
                        <label>Évaluation (1-5)</label>
                        <select formControlName="evaluationClient">
                          <option value="">— Choisir —</option>
                          <option value="1">1 — Très insuffisant</option>
                          <option value="2">2 — Insuffisant</option>
                          <option value="3">3 — Satisfaisant</option>
                          <option value="4">4 — Bien</option>
                          <option value="5">5 — Excellent</option>
                        </select>
                      </div>
                      <div class="form-group">
                        <label>Commentaire</label>
                        <textarea formControlName="commentaire" rows="3" placeholder="Votre retour d'expérience…"></textarea>
                      </div>
                      <div class="form-group">
                        <label>Compétence validée (optionnelle)</label>
                        <input formControlName="competence" placeholder="Ex: Gestion de projet" />
                      </div>
                      @if (submittingId() === m._id) {
                        <button class="btn-primary" type="button" disabled>Traitement…</button>
                      } @else {
                        <button class="btn-primary" type="submit" [disabled]="clotureForm.invalid">Confirmer la clôture</button>
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
    .table-header { display: grid; grid-template-columns: 1.5fr 1.2fr 1fr 0.8fr; gap: 8px; padding: 10px 16px; background: var(--color-sky-blue-light); font-size: 0.78rem; font-weight: 700; color: var(--color-deep-blue); }
    .table-row { display: grid; grid-template-columns: 1.5fr 1.2fr 1fr 0.8fr; gap: 8px; padding: 10px 16px; border-bottom: 1px solid var(--color-border); font-size: 0.82rem; align-items: center; }
    .table-row:last-child { border-bottom: none; }
    .table-row.expanded { border-bottom: 1px solid var(--color-border); }
    .cell-title { font-weight: 600; }
    .cell { color: var(--color-text-secondary); }
    .cell-link { color: var(--color-primary-blue); text-decoration: none; font-weight: 600; }
    .cell-link:hover { text-decoration: underline; }
    .cell-action { display: flex; gap: 6px; }
    .expand-content { grid-column: 1 / -1; padding: 12px 0 4px; border-top: 1px solid var(--color-border); margin-top: 8px; }
    .expand-content form { display: flex; flex-direction: column; gap: 14px; align-items: flex-start; max-width: 400px; }
    .form-group { display: flex; flex-direction: column; gap: 4px; width: 100%; }
    .form-group label { font-size: 0.82rem; font-weight: 600; }
    .form-group select, .form-group input, .form-group textarea { padding: 8px 10px; border: 1.5px solid var(--color-border); border-radius: var(--radius-sm); font-family: var(--font-sans); font-size: 0.85rem; width: 100%; box-sizing: border-box; }
    .form-group textarea { resize: vertical; }
    .btn-primary { padding: 8px 16px; background: var(--color-primary-blue); color: #fff; border: none; border-radius: var(--radius-sm); font-size: 0.82rem; font-weight: 600; cursor: pointer; font-family: var(--font-sans); transition: opacity var(--transition); }
    .btn-primary:hover { opacity: 0.9; }
    .btn-primary:disabled { opacity: 0.5; cursor: default; }
    .btn-warning { padding: 8px 16px; background: var(--honey-500); color: var(--ink-900); border: none; border-radius: var(--radius-sm); font-size: 0.82rem; font-weight: 600; cursor: pointer; font-family: var(--font-sans); transition: opacity var(--transition); }
    .btn-warning:hover { opacity: 0.9; }
    .btn-cancel { padding: 8px 16px; background: transparent; color: var(--color-text-secondary); border: 1.5px solid var(--color-border); border-radius: var(--radius-sm); font-size: 0.82rem; font-weight: 600; cursor: pointer; font-family: var(--font-sans); }
    .btn-cancel:hover { background: var(--color-sky-blue-light); }
  `]
})
export class CloturerMissionComponent implements OnInit, OnDestroy {
  private http = inject(HttpClient);
  private toast = inject(ToastService);
  private fb = inject(FormBuilder);
  protected readonly ICONS = ICONS;

  missions: Mission[] = [];
  loading = signal(true);
  expandedId = signal<string | null>(null);
  submittingId = signal<string | null>(null);
  private destroy$ = new Subject<void>();

  ngOnDestroy() { this.destroy$.next(); this.destroy$.complete(); }

  clotureForm = this.fb.nonNullable.group({
    evaluationClient: ['', Validators.required],
    commentaire: [''],
    competence: [''],
  });

  ngOnInit() {
    this.http.get<Mission[]>('/api/placements/missions')
      .pipe(takeUntil(this.destroy$), catchError(() => of([])), finalize(() => this.loading.set(false)))
      .subscribe(list => {
        this.missions = list.filter(m => m.statut === 'en_cours');
      });
  }

  initForm(m: Mission) {
    this.clotureForm.reset({ evaluationClient: '', commentaire: '', competence: '' });
  }

  cloturer(missionId: string) {
    if (this.clotureForm.invalid) return;
    this.submittingId.set(missionId);
    const val = this.clotureForm.value;
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders(token ? { Authorization: `Bearer ${token}` } : {});
    this.http.post('/api/placements/cloturer', {
      missionId,
      evaluationClient: Number(val.evaluationClient),
      commentaire: val.commentaire || '',
      competence: val.competence || '',
    }, { headers }).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.toast.success('Mission clôturée avec succès.');
        this.missions = this.missions.filter(m => m._id !== missionId);
        this.expandedId.set(null);
        this.clotureForm.reset();
        this.submittingId.set(null);
      },
      error: () => {
        this.toast.error('Erreur lors de la clôture.');
        this.submittingId.set(null);
      },
    });
  }
}
