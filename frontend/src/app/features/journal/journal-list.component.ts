import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { JournalService, Journal } from './journal.service';

@Component({
  selector: 'app-journal-list',
  standalone: true,
  imports: [RouterLink, DatePipe, FormsModule],
  template: `
    <div class="section">
      <div class="section-head">
        <h2>Journaux</h2>
        <a routerLink="/journaux/new" class="btn btn-primary">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Nouveau journal
        </a>
      </div>

      <div class="filter-row">
        <input
          class="filter-input"
          type="text"
          [(ngModel)]="domaineFilter"
          (ngModelChange)="filter()"
          placeholder="Filtrer par domaine…"
        />
      </div>

      @if (loading()) {
        <div class="skel-grid">@for (i of [1,2,3]; track i) { <div class="skel-card"><div class="skel-line w-70"></div><div class="skel-line w-40"></div><div class="skel-line w-90"></div></div> }</div>
      } @else { @if (items().length === 0) {
        <div class="empty">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--honey-500)" stroke-width="1" opacity="0.3"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
          <h3>Aucun journal</h3>
          <p>Les journaux partenaires apparaîtront ici une fois créés.</p>
        </div>
      } @else {
        <div class="grid">
          @for (j of items(); track j._id) {
            <a class="journal-card" [routerLink]="['/journaux', j._id]">
              <div class="journal-top">
                <h3>{{ j.nom }}</h3>
                <span class="journal-statut" [class]="'statut--' + j.statut">{{ j.statut }}</span>
              </div>
              @if (j.domaines?.length) {
                <div class="journal-domaines">
                  @for (d of j.domaines; track d) {
                    <span class="journal-domaine">{{ d }}</span>
                  }
                </div>
              }
              <p>{{ j.description || 'Aucune description.' }}</p>
              <div class="journal-footer">
                <span class="journal-comite">{{ j.comite?.length || 0 }} membre{{ (j.comite?.length || 0) > 1 ? 's' : '' }} du comité</span>
                <span class="journal-date">{{ j.createdAt | date:'dd MMM' }}</span>
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
    .journal-card { display: flex; flex-direction: column; gap: 10px; padding: 20px; background: var(--color-surface); border: 1px solid var(--line-200); border-radius: var(--radius-md); text-decoration: none; color: inherit; transition: border-color var(--transition); }
    .journal-card:hover { border-color: var(--honey-500); }
    .journal-card h3 { font-size: var(--text-base); margin: 0; }
    .journal-card p { font-size: var(--text-sm); color: var(--ink-700); margin: 0; line-height: 1.5; }

    .journal-top { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
    .journal-statut { font-size: var(--text-xs); font-weight: 600; padding: 3px 10px; border-radius: 999px; text-transform: capitalize; }
    .statut--actif { background: rgba(31,158,109,0.1); color: var(--verify-500); }
    .statut--inactif { background: rgba(196,67,46,0.08); color: var(--alert-500); }

    .journal-domaines { display: flex; flex-wrap: wrap; gap: 6px; }
    .journal-domaine { font-size: var(--text-xs); font-weight: 500; padding: 2px 10px; border-radius: 999px; background: rgba(91,79,224,0.08); color: var(--agentic-500); }

    .journal-footer { display: flex; align-items: center; gap: 10px; padding-top: 8px; border-top: 1px solid var(--line-200); font-size: var(--text-xs); }
    .journal-comite { color: var(--ink-700); }
    .journal-date { margin-left: auto; color: var(--ink-700); font-family: var(--font-mono); }

    @media (max-width: 768px) { .grid { grid-template-columns: 1fr; } }
  `]
})
export class JournalListComponent implements OnInit {
  private service = inject(JournalService);
  loading = signal(true);
  items = signal<Journal[]>([]);
  domaineFilter = '';

  ngOnInit() {
    this.service.list().subscribe({
      next: list => this.items.set(list),
      error: () => this.items.set([]),
      complete: () => this.loading.set(false),
    });
  }

  filter() {
    this.service.list(this.domaineFilter || undefined).subscribe({
      next: list => this.items.set(list),
      error: () => this.items.set([]),
    });
  }
}
