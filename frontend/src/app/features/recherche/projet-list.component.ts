import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProjetRechercheFinanceService, ProjetRechercheFinance } from './projet-recherche-finance.service';

@Component({
  selector: 'app-projet-list',
  standalone: true,
  imports: [RouterLink, DatePipe, CurrencyPipe, FormsModule],
  template: `
    <div class="section">
      <div class="section-head">
        <h2>Projets financés</h2>
        <a routerLink="/projets-recherche/new" class="btn btn-primary">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Nouveau projet
        </a>
      </div>

      <div class="filter-row">
        <select class="filter-input" [ngModel]="statutFilter" (ngModelChange)="onStatutChange($event)">
          <option value="">Tous les statuts</option>
          <option value="candidature">Candidature</option>
          <option value="en_cours">En cours</option>
          <option value="termine">Terminé</option>
        </select>
      </div>

      @if (loading()) {
        <div class="skel-grid">@for (i of [1,2,3]; track i) { <div class="skel-card"><div class="skel-line w-70"></div><div class="skel-line w-40"></div><div class="skel-line w-90"></div></div> }</div>
      } @else { @if (items().length === 0) {
        <div class="empty">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--honey-500)" stroke-width="1" opacity="0.3"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
          <h3>Aucun projet</h3>
          <p>Les projets de recherche financés apparaîtront ici une fois publiés.</p>
        </div>
      } @else {
        <div class="grid">
          @for (p of items(); track p._id) {
            <a class="projet-card" [routerLink]="['/projets-recherche', p._id]">
              <div class="projet-top">
                <h3>{{ p.theme }}</h3>
                <span class="projet-statut" [class]="'statut--' + p.statut">{{ statutLabel(p.statut) }}</span>
              </div>
              <div class="projet-meta">
                <span class="projet-meta-item">Budget : {{ p.budget != null ? (p.budget | currency:'MAD':'symbol':'1.0-0') : '—' }}</span>
                <span class="projet-meta-item">Candidatures : {{ p.candidatures?.length || 0 }}</span>
              </div>
              <div class="projet-footer">
                <span class="projet-industriel">{{ p.industrielId?.nom || p.industrielId?.prenom || 'Industriel #' + p.industrielId }}</span>
                @if (p.structureRechercheId) {
                  <span class="projet-attribue">{{ p.structureRechercheId?.nom || 'Structure #' + p.structureRechercheId }}</span>
                }
                <span class="projet-date">{{ p.createdAt | date:'dd MMM' }}</span>
              </div>
            </a>
          }
        </div>
      }}
    </div>
  `,
  styles: [`
    :host { display: block; }
    .section { position: relative; }
    .section-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; flex-wrap: wrap; gap: 10px; }
    .section-head h2 { font-size: var(--text-lg); margin: 0; }

    .btn { display: inline-flex; align-items: center; gap: 8px; padding: 8px 18px; border: none; border-radius: var(--radius-md); font-family: var(--font-body); font-size: var(--text-sm); font-weight: 600; cursor: pointer; text-decoration: none; transition: all var(--transition); }
    .btn-primary { background: var(--honey-500); color: var(--ink-900); }
    .btn-primary:hover { background: var(--honey-600); }

    .filter-row { margin-bottom: 16px; }
    .filter-input { width: 100%; max-width: 320px; padding: 9px 14px; border: 1.5px solid var(--line-200); border-radius: var(--radius-sm); font-family: var(--font-body); font-size: var(--text-sm); background: var(--color-surface); color: var(--ink-900); outline: none; transition: border-color var(--transition); }
    .filter-input:focus { border-color: var(--honey-500); }

    .empty { display: flex; flex-direction: column; align-items: center; text-align: center; padding: 60px 24px; }
    .empty h3 { font-size: var(--text-lg); margin: 12px 0 4px; }
    .empty p { font-size: var(--text-sm); color: var(--ink-700); margin: 0; }

    .skel-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 16px; }
    .skel-card { background: var(--color-surface); border: 1px solid var(--line-200); border-radius: var(--radius-md); padding: 20px; }
    .skel-line { height: 12px; border-radius: 4px; background: var(--line-200); margin-bottom: 10px; animation: sh 1.5s infinite; }
    .w-70 { width: 70%; } .w-40 { width: 40%; } .w-90 { width: 90%; }
    @keyframes sh { 0%{opacity:0.5} 50%{opacity:1} 100%{opacity:0.5} }

    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 16px; }
    .projet-card { display: flex; flex-direction: column; gap: 10px; padding: 20px; background: var(--color-surface); border: 1px solid var(--line-200); border-radius: var(--radius-md); text-decoration: none; color: inherit; transition: border-color var(--transition); }
    .projet-card:hover { border-color: var(--honey-500); }
    .projet-card h3 { font-size: var(--text-base); margin: 0; line-height: 1.4; }

    .projet-top { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
    .projet-statut { font-size: var(--text-xs); font-weight: 600; padding: 3px 10px; border-radius: 999px; text-transform: capitalize; flex-shrink: 0; }
    .statut--candidature { background: rgba(217,160,43,0.1); color: var(--honey-600); }
    .statut--en_cours { background: rgba(91,79,224,0.08); color: var(--agentic-500); }
    .statut--termine { background: rgba(31,158,109,0.1); color: var(--verify-500); }

    .projet-meta { display: flex; gap: 14px; font-size: var(--text-xs); color: var(--ink-700); }

    .projet-footer { display: flex; align-items: center; gap: 10px; padding-top: 8px; border-top: 1px solid var(--line-200); font-size: var(--text-xs); }
    .projet-industriel { font-weight: 500; color: var(--ink-700); }
    .projet-attribue { padding: 2px 8px; border-radius: 999px; background: rgba(31,158,109,0.1); color: var(--verify-500); }
    .projet-date { margin-left: auto; color: var(--ink-700); font-family: var(--font-mono); }

    @media (max-width: 768px) { .grid { grid-template-columns: 1fr; } }
  `]
})
export class ProjetListComponent implements OnInit {
  private service = inject(ProjetRechercheFinanceService);
  loading = signal(true);
  items = signal<ProjetRechercheFinance[]>([]);
  statutFilter = '';

  ngOnInit() {
    this.service.list().subscribe({
      next: list => this.items.set(list),
      error: () => this.items.set([]),
      complete: () => this.loading.set(false),
    });
  }

  onStatutChange(statut: string) {
    this.statutFilter = statut;
    this.service.list(this.statutFilter || undefined).subscribe({
      next: list => this.items.set(list),
      error: () => this.items.set([]),
    });
  }

  statutLabel(statut: string): string {
    const labels: Record<string, string> = { candidature: 'Candidature', en_cours: 'En cours', termine: 'Terminé' };
    return labels[statut] || statut;
  }
}
