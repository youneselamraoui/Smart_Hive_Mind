import { Component, OnInit, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { ToastService } from '../../core/toast.service';

@Component({
  selector: 'app-mentorat-accepter',
  standalone: true,
  imports: [DatePipe, RouterLink],
  template: `
    <div class="page">
      <div class="page-head"><div><h1>Accepter un mentorat</h1></div></div>

      @if (loading()) {
        <div class="skel-grid">@for (i of [1,2,3]; track i) { <div class="skel-card"><div class="skel-line w-70"></div><div class="skel-line w-40"></div></div> }</div>
      } @else { @if (pending.length === 0) {
        <div class="empty"><h3>Aucune demande en attente</h3></div>
      } @else {
        <div class="grid">
          @for (req of pending; track req._id) {
            <div class="card">
              <div class="card-head"><h3>{{ req.apprenantId.prenom }} {{ req.apprenantId.nom }}</h3><span class="tag">{{ req.statut }}</span></div>
              <div class="row"><span>Domaine</span><b>{{ req.domaine }}</b></div>
              <div class="row"><span>Disponibilité</span><b>{{ req.disponibilite || 'Non spécifiée' }}</b></div>
              <p>{{ req.objectifs }}</p>
              <div class="card-foot">
                <span>{{ req.createdAt | date:'short' }}</span>
                <button class="btn btn-primary" [disabled]="acceptingId() === req._id" (click)="accepter(req)">{{ acceptingId() === req._id ? '…' : 'Accepter' }}</button>
              </div>
            </div>
          }
        </div>
      }}
    </div>
  `,
  styles: [`
    :host { display: block; }
    .page-head { margin-bottom: 24px; }
    .page-head h1 { font-size: var(--text-2xl); margin: 0; }

    .empty { display: flex; flex-direction: column; align-items: center; padding: 60px 24px; }
    .empty h3 { font-size: var(--text-lg); margin: 0; }

    .skel-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 16px; }
    .skel-card { background: var(--color-surface); border: 1px solid var(--line-200); border-radius: var(--radius-md); padding: 20px; }
    .skel-line { height: 12px; border-radius: 4px; background: var(--line-200); margin-bottom: 10px; animation: sh 1.5s infinite; }
    .w-70 { width: 70%; } .w-40 { width: 40%; }
    @keyframes sh { 0%{opacity:0.5} 50%{opacity:1} 100%{opacity:0.5} }

    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(360px, 1fr)); gap: 16px; }
    .card { display: flex; flex-direction: column; gap: 10px; background: var(--color-surface); border: 1px solid var(--line-200); border-radius: var(--radius-md); padding: 24px; transition: border-color var(--transition); }
    .card:hover { border-color: var(--honey-500); }
    .card-head { display: flex; justify-content: space-between; align-items: center; gap: 10px; }
    .card-head h3 { font-size: var(--text-base); margin: 0; }
    .tag { font-size: var(--text-xs); font-weight: 600; text-transform: uppercase; padding: 2px 10px; border-radius: 999px; background: rgba(217,160,43,0.1); color: var(--honey-600); }
    .row { display: flex; justify-content: space-between; font-size: var(--text-sm); }
    .row span { color: var(--ink-700); }
    .card p { font-size: var(--text-sm); color: var(--ink-700); margin: 0; line-height: 1.5; }
    .card-foot { display: flex; justify-content: space-between; align-items: center; gap: 10px; margin-top: auto; padding-top: 12px; border-top: 1px solid var(--line-200); font-size: var(--text-xs); color: var(--ink-700); }
    .btn { display: inline-flex; align-items: center; gap: 6px; padding: 8px 20px; border: none; border-radius: var(--radius-sm); font-family: var(--font-body); font-size: var(--text-sm); font-weight: 600; cursor: pointer; transition: all var(--transition); }
    .btn:disabled { opacity: 0.4; cursor: not-allowed; }
    .btn-primary { background: var(--honey-500); color: var(--ink-900); }
    .btn-primary:hover:not(:disabled) { background: var(--honey-600); }

    @media (max-width: 768px) { .grid { grid-template-columns: 1fr; } }
  `]
})
export class MentoratAccepterComponent implements OnInit {
  private http = inject(HttpClient);
  private toast = inject(ToastService);
  private router = inject(Router);
  pending: any[] = [];
  loading = signal(true);
  acceptingId = signal<string | null>(null);

  ngOnInit() {
    this.http.get<any[]>('/api/skills/mentorats').subscribe({
      next: list => this.pending = list.filter(m => m.statut === 'en_attente'),
      error: () => this.loading.set(false),
      complete: () => this.loading.set(false),
    });
  }

  accepter(req: any) {
    this.acceptingId.set(req._id);
    this.http.post('/api/skills/mentorats/accepter', { mentoratId: req._id }).subscribe({
      next: () => { this.toast.success('Mentorat accepté.'); this.pending = this.pending.filter(m => m._id !== req._id); this.acceptingId.set(null); },
      error: () => { this.toast.error('Erreur.'); this.acceptingId.set(null); },
    });
  }
}
