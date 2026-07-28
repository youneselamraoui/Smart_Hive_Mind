import { Component, OnInit, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { ToastService } from '../../core/toast.service';

@Component({
  selector: 'app-prestation-list',
  standalone: true,
  imports: [DatePipe],
  template: `
    <div class="section">
      <div class="section-head">
        <h2>Prestations</h2>
        <button class="btn btn-primary" (click)="router.navigate(['/marketplace', 'prestations', 'new'])">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Créer une prestation
        </button>
      </div>

      @if (loading()) {
        <div class="skel-grid">@for (i of [1,2,3]; track i) { <div class="skel-card"><div class="skel-line w-70"></div><div class="skel-line w-40"></div></div> }</div>
      } @else { @if (items.length === 0) {
        <div class="empty">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--honey-500)" stroke-width="1" opacity="0.3"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
          <h3>Aucune prestation</h3>
          <p>Les prestations apparaîtront ici une fois créées.</p>
        </div>
      } @else {
        <div class="grid">
          @for (p of paginatedItems; track p._id) {
            <div class="card">
              <span class="statut-tag" [class]="'statut--' + p.statut">{{ p.statut }}</span>
              <p>{{ p.description }}</p>
              <div class="meta-row"><span class="ml">Tarif</span><span class="mv">{{ p.tarif }}</span></div>
              <div class="meta-row"><span class="ml">Prestataire</span><span>{{ p.prestataireId?.prenom }} {{ p.prestataireId?.nom }}</span></div>
              @if (p.clientId) { <div class="meta-row"><span class="ml">Client</span><span>{{ p.clientId.prenom }} {{ p.clientId.nom }}</span></div> }
              <div class="meta-date">{{ p.createdAt | date:'short' }}</div>
              @if (p.prestataireId?._id === membreId) {
                <div class="card-actions">
                  <button class="btn btn-outline btn-xs" (click)="router.navigate(['/marketplace', 'prestations', p._id, 'edit'])">Modifier</button>
                  <button class="btn btn-outline btn-xs" (click)="supprimer(p)">Supprimer</button>
                </div>
              }
            </div>
          }
        </div>
      }}
    </div>
  `,
  styles: [`
    :host { display: block; }
    .section { position: relative; }
    .section-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
    .section-head h2 { font-size: var(--text-lg); margin: 0; }

    .btn { display: inline-flex; align-items: center; gap: 8px; padding: 8px 18px; border: none; border-radius: var(--radius-md); font-family: var(--font-body); font-size: var(--text-sm); font-weight: 600; cursor: pointer; transition: all var(--transition); }
    .btn-primary { background: var(--honey-500); color: var(--ink-900); }
    .btn-primary:hover { background: var(--honey-600); }
    .btn-outline { background: var(--color-surface); border: 1px solid var(--line-200); color: var(--ink-900); }
    .btn-outline:hover { border-color: var(--ink-700); }
    .btn-xs { padding: 4px 10px; font-size: var(--text-xs); }

    .skel-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }
    .skel-card { background: var(--color-surface); border: 1px solid var(--line-200); border-radius: var(--radius-md); padding: 20px; }
    .skel-line { height: 12px; border-radius: 4px; background: var(--line-200); margin-bottom: 10px; animation: sh 1.5s infinite; }
    .w-70 { width: 70%; } .w-40 { width: 40%; }
    @keyframes sh { 0%{opacity:0.5} 50%{opacity:1} 100%{opacity:0.5} }

    .empty { display: flex; flex-direction: column; align-items: center; text-align: center; padding: 60px 24px; }
    .empty h3 { font-size: var(--text-lg); margin: 12px 0 4px; }
    .empty p { font-size: var(--text-sm); color: var(--ink-700); margin: 0; }

    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }
    .card { background: var(--color-surface); border: 1px solid var(--line-200); border-radius: var(--radius-md); padding: 18px; display: flex; flex-direction: column; gap: 8px; transition: border-color var(--transition); }
    .card:hover { border-color: var(--honey-500); }
    .card p { font-size: var(--text-sm); margin: 0; color: var(--ink-700); }
    .statut-tag { font-size: var(--text-xs); font-weight: 600; text-transform: uppercase; padding: 2px 10px; border-radius: 999px; width: fit-content; }
    .statut--terminee { background: rgba(31,158,109,0.1); color: var(--verify-500); }
    .statut--en_cours { background: rgba(91,79,224,0.1); color: var(--agentic-500); }
    .statut--negociee { background: rgba(217,160,43,0.1); color: var(--honey-600); }
    .meta-row { display: flex; justify-content: space-between; font-size: var(--text-sm); padding: 2px 0; border-bottom: 1px dashed var(--line-200); }
    .ml { color: var(--ink-700); }
    .mv { font-weight: 500; }
    .meta-date { font-size: var(--text-xs); color: var(--ink-700); }
    .card-actions { display: flex; gap: 6px; margin-top: 4px; }
  `]
})
export class PrestationListComponent implements OnInit {
  private http = inject(HttpClient);
  private toast = inject(ToastService);
  protected router = inject(Router);
  items: any[] = [];
  loading = signal(true);
  membreId = localStorage.getItem('membreId') || '';
  pageSize = 10;
  currentPage = signal(1);

  get paginatedItems() {
    const start = (this.currentPage() - 1) * this.pageSize;
    return this.items.slice(start, start + this.pageSize);
  }

  ngOnInit() {
    this.http.get<any[]>('/api/prestations').subscribe({
      next: list => this.items = list,
      error: () => this.items = [],
      complete: () => this.loading.set(false),
    });
  }

  supprimer(p: any) {
    if (!confirm('Supprimer cette prestation ?')) return;
    this.http.delete('/api/prestations/' + p._id).subscribe({
      next: () => { this.items = this.items.filter(x => x._id !== p._id); this.toast.success('Prestation supprimée.'); },
      error: err => this.toast.error(err.error?.error || 'Erreur suppression.'),
    });
  }
}
