import { Component, OnInit, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { DatePipe, KeyValuePipe } from '@angular/common';

@Component({
  selector: 'app-model-bank-list',
  standalone: true,
  imports: [DatePipe, KeyValuePipe, RouterLink],
  template: `
    <div class="page">
      <div class="page-head">
        <div>
          <h1>Model Bank</h1>
          <p>Modèles d'IA publiés par la communauté</p>
        </div>
        <a routerLink="/smart-tools/models/publish" class="btn btn-primary">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Publier un modèle
        </a>
      </div>

      <div class="search-bar">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input [value]="searchTerm()" (input)="searchTerm.set($any($event.target).value)" placeholder="Rechercher un modèle…" />
        @if (searchTerm()) {
          <button class="search-clear" (click)="searchTerm.set('')"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
        }
      </div>

      @if (loading()) {
        <div class="skel-grid">@for (i of [1,2,3]; track i) { <div class="skel-card"><div class="skel-line w-70"></div><div class="skel-line w-50"></div><div class="skel-line w-90"></div></div> }</div>
      } @else { @if (filteredItems.length === 0) {
        <div class="empty">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--honey-500)" stroke-width="1" opacity="0.3"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
          <h3>{{ searchTerm() ? 'Aucun résultat' : 'Aucun modèle publié' }}</h3>
          <p>{{ searchTerm() ? 'Essayez un autre terme.' : 'Soyez le premier à publier un modèle.' }}</p>
        </div>
      } @else {
        <div class="grid">
          @for (m of filteredItems; track m._id) {
            <div class="model-card">
              <div class="model-top">
                <h3>{{ m.nom }}</h3>
                <span class="model-version">{{ m.version }}</span>
              </div>
              <span class="model-tache">{{ m.tache }}</span>

              <!-- Datasheet block -->
              <div class="datasheet">
                <div class="ds-row"><span class="ds-label">Tâche</span><span class="ds-value">{{ m.tache }}</span></div>
                <div class="ds-row"><span class="ds-label">Version</span><span class="ds-value">{{ m.version }}</span></div>
                @for (kv of (m.performance | keyvalue); track kv.key) {
                  <div class="ds-row">
                    <span class="ds-label">{{ kv.key }}</span>
                    <span class="ds-value">{{ kv.value }}</span>
                  </div>
                }
              </div>

              <!-- Performance gauge bars -->
              @for (kv of (m.performance | keyvalue); track kv.key) {
                <div class="perf-row">
                  <span class="perf-label">{{ kv.key }}</span>
                  <div class="perf-track">
                    <div class="perf-fill" [style.width.%]="Number(kv.value) * 100 || 0"></div>
                  </div>
                  <span class="perf-val">{{ kv.value }}</span>
                </div>
              }

              <div class="model-footer">
                <span class="model-author">{{ m.auteurId?.prenom }} {{ m.auteurId?.nom }}</span>
                <span class="model-date">{{ m.createdAt | date:'dd MMM yyyy' }}</span>
              </div>
              @if (m.jeuDeDonneesId) {
                <div class="model-dataset">{{ m.jeuDeDonneesId.nom }}</div>
              }
              <div class="model-actions">
                @if (m.explicabiliteUrl) {
                  <a class="btn btn-outline btn-xs" [href]="m.explicabiliteUrl" target="_blank">Explicabilité</a>
                }
                <button class="btn btn-primary btn-xs" (click)="reutiliser(m)">Réutiliser</button>
              </div>
            </div>
          }
        </div>
      }}
    </div>
  `,
  styles: [`
    :host { display: block; }
    .page { position: relative; }
    .page-head { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 24px; flex-wrap: wrap; }
    .page-head h1 { font-size: var(--text-2xl); margin: 0 0 2px; }
    .page-head p { margin: 0; font-size: var(--text-sm); color: var(--ink-700); }

    .btn { display: inline-flex; align-items: center; gap: 8px; padding: 10px 20px; border: none; border-radius: var(--radius-md); font-family: var(--font-body); font-size: var(--text-sm); font-weight: 600; cursor: pointer; text-decoration: none; transition: all var(--transition); }
    .btn:disabled { opacity: 0.4; cursor: not-allowed; }
    .btn-primary { background: var(--honey-500); color: var(--ink-900); }
    .btn-primary:hover:not(:disabled) { background: var(--honey-600); }
    .btn-outline { background: var(--color-surface); border: 1px solid var(--line-200); color: var(--ink-900); }
    .btn-outline:hover { border-color: var(--honey-500); }
    .btn-xs { padding: 4px 10px; font-size: var(--text-xs); }

    .search-bar { display: flex; align-items: center; gap: 8px; margin-bottom: 20px; padding: 8px 14px; background: var(--color-surface); border: 1px solid var(--line-200); border-radius: var(--radius-md); transition: border-color var(--transition); }
    .search-bar:focus-within { border-color: var(--honey-500); }
    .search-bar svg { flex-shrink: 0; color: var(--ink-700); }
    .search-bar input { flex: 1; border: none; background: none; font-size: var(--text-sm); font-family: var(--font-body); outline: none; color: var(--ink-900); }
    .search-clear { background: none; border: none; cursor: pointer; color: var(--ink-700); padding: 2px; border-radius: 50%; display: flex; }
    .search-clear:hover { background: var(--line-200); }

    .skel-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; }
    .skel-card { background: var(--color-surface); border: 1px solid var(--line-200); border-radius: var(--radius-md); padding: 20px; }
    .skel-line { height: 12px; border-radius: 4px; background: var(--line-200); margin-bottom: 10px; animation: sh 1.5s infinite; }
    .w-70 { width: 70%; } .w-50 { width: 50%; } .w-90 { width: 90%; }
    @keyframes sh { 0%{opacity:0.5} 50%{opacity:1} 100%{opacity:0.5} }

    .empty { display: flex; flex-direction: column; align-items: center; text-align: center; padding: 60px 24px; }
    .empty h3 { font-size: var(--text-lg); margin: 12px 0 4px; }
    .empty p { font-size: var(--text-sm); color: var(--ink-700); margin: 0; }

    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 16px; }

    .model-card { background: var(--color-surface); border: 1px solid var(--line-200); border-radius: var(--radius-md); padding: 20px; display: flex; flex-direction: column; gap: 10px; transition: border-color var(--transition); }
    .model-card:hover { border-color: var(--honey-500); }

    .model-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; }
    .model-top h3 { font-size: var(--text-base); margin: 0; }
    .model-version { font-family: var(--font-mono); font-size: var(--text-xs); padding: 2px 8px; border-radius: 4px; background: var(--paper-50); color: var(--ink-700); white-space: nowrap; }
    .model-tache { font-size: var(--text-xs); font-weight: 500; padding: 2px 8px; border-radius: 999px; background: rgba(91,79,224,0.08); color: var(--agentic-500); width: fit-content; }

    .datasheet { font-family: var(--font-mono); font-size: var(--text-xs); background: var(--paper-50); border: 1px solid var(--line-200); border-radius: var(--radius-sm); padding: 10px 12px; display: flex; flex-direction: column; gap: 4px; }
    .ds-row { display: flex; justify-content: space-between; align-items: center; }
    .ds-label { color: var(--ink-700); text-transform: uppercase; letter-spacing: 0.04em; font-size: 0.6rem; }
    .ds-value { color: var(--ink-900); font-weight: 500; }

    .perf-row { display: flex; align-items: center; gap: 8px; }
    .perf-label { flex: 0 0 60px; font-size: var(--text-xs); color: var(--ink-700); text-transform: uppercase; letter-spacing: 0.03em; }
    .perf-track { flex: 1; height: 5px; background: var(--line-200); border-radius: 999px; overflow: hidden; }
    .perf-fill { height: 100%; background: var(--honey-500); border-radius: 999px; transition: width 0.6s ease-out; }
    .perf-val { flex: 0 0 32px; font-family: var(--font-mono); font-size: var(--text-xs); text-align: right; }

    .model-footer { display: flex; justify-content: space-between; align-items: center; font-size: var(--text-xs); padding-top: 4px; border-top: 1px solid var(--line-200); }
    .model-author { font-weight: 500; }
    .model-date { color: var(--ink-700); font-family: var(--font-mono); }
    .model-dataset { font-size: var(--text-xs); color: var(--ink-700); }

    .model-actions { display: flex; gap: 6px; margin-top: 2px; }

    @media (max-width: 768px) { .grid { grid-template-columns: 1fr; } }
  `]
})
export class ModelBankListComponent implements OnInit {
  private http = inject(HttpClient);
  private router = inject(Router);
  models: any[] = [];
  loading = signal(true);
  searchTerm = signal('');
  Number = Number;

  get filteredItems() {
    const q = this.searchTerm().toLowerCase();
    if (!q) return this.models;
    return this.models.filter(m => m.nom?.toLowerCase().includes(q) || m.tache?.toLowerCase().includes(q));
  }

  ngOnInit() {
    this.http.get<any[]>('/api/smart-tools/models').subscribe({
      next: list => this.models = list,
      error: () => this.models = [],
      complete: () => this.loading.set(false),
    });
  }

  reutiliser(m: any) { this.router.navigate(['/smart-tools/ateliers/new']); }
}
