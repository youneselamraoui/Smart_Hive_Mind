import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { catchError, of } from 'rxjs';
import { EmptyStateComponent } from '../../../core/empty-state.component';

interface Sondage { _id: string; question: string; options: string[]; votes: Record<string, string[]>; auteurId: string; dateFin?: string; }

@Component({
  selector: 'app-sondage-widget',
  standalone: true,
  imports: [DatePipe, EmptyStateComponent],
  template: `
    @if (sondageId) {
      @if (error()) {
        <app-empty-state icon="alert-circle" title="Erreur de chargement" [description]="error()!" actionLabel="Réessayer" (action)="loadSondage()" />
      } @else if (!sondage) {
        <div class="sw-skel"><div class="skel-line w-70"></div><div class="skel-line w-90"></div><div class="skel-line w-40"></div></div>
      } @else { @let s = sondage;
        <div class="sw-card">
          <div class="sw-head">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>
            <div>
              <h3>{{ s.question }}</h3>
              @if (s.dateFin) { <span class="sw-meta">Clôture le {{ s.dateFin | date:'short' }}</span> }
            </div>
          </div>

          @if (dejaVote) {
            <div class="sw-results">
              @for (opt of s.options; track opt; let i = $index) {
                <div class="sw-bar-row">
                  <span class="sw-bar-label">{{ opt }}</span>
                  <div class="sw-bar-track">
                    <div class="sw-bar-fill" [style.width.%]="pct(i)"></div>
                  </div>
                  <span class="sw-bar-pct">{{ pct(i) }}%</span>
                  <span class="sw-bar-count">{{ votesCount(i) }}v</span>
                </div>
              }
              <div class="sw-total">{{ totalVotes() }} vote(s)</div>
            </div>
          } @else {
            <div class="sw-options">
              @for (opt of s.options; track opt; let i = $index) {
                <label class="sw-opt" [class.sw-opt--sel]="selectedOption === i">
                  <input type="radio" name="sw-opt" [value]="i" (change)="selectedOption = i" />
                  <span class="sw-dot"></span>
                  <span>{{ opt }}</span>
                </label>
              }
              <button class="btn-honey" [disabled]="selectedOption === null" (click)="voter()">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                Voter
              </button>
            </div>
          }
        </div>
      }
    } @else {
      <app-empty-state icon="bar-chart" title="Sondages" description="Aucun sondage disponible pour le moment." actionLabel="Créer un sondage" actionIcon="plus" actionRouterLink="/communaute/sondages/new" />
    }
  `,
  styles: [`
    :host { display: block; }
    .sw-card { background: var(--color-surface); border: 1px solid var(--line-200); border-radius: var(--radius-md); padding: 20px; }
    .sw-skel { background: var(--color-surface); border: 1px solid var(--line-200); border-radius: var(--radius-md); padding: 20px; }
    .skel-line { height: 12px; border-radius: 4px; background: var(--line-200); margin-bottom: 10px; animation: sh 1.5s infinite; }
    .w-70 { width: 70%; } .w-90 { width: 90%; } .w-40 { width: 40%; }
    @keyframes sh { 0%{opacity:0.5} 50%{opacity:1} 100%{opacity:0.5} }
    .sw-head { display: flex; gap: 10px; margin-bottom: 16px; }
    .sw-head svg { flex-shrink: 0; color: var(--honey-500); margin-top: 2px; }
    .sw-head h3 { font-size: var(--text-base); margin: 0 0 2px; }
    .sw-meta { font-size: var(--text-xs); color: var(--ink-700); }

    .sw-options { display: flex; flex-direction: column; gap: 8px; }
    .sw-opt { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border: 1px solid var(--line-200); border-radius: var(--radius-sm); cursor: pointer; transition: all var(--transition); font-size: var(--text-sm); }
    .sw-opt:hover { border-color: var(--honey-500); }
    .sw-opt--sel { border-color: var(--honey-500); background: rgba(217,160,43,0.04); }
    .sw-opt input { display: none; }
    .sw-dot { width: 16px; height: 16px; border-radius: 50%; border: 2px solid var(--line-200); flex-shrink: 0; transition: all var(--transition); }
    .sw-opt--sel .sw-dot { border-color: var(--honey-500); background: var(--honey-500); box-shadow: inset 0 0 0 3px var(--color-surface); }
    .btn-honey { display: flex; align-items: center; justify-content: center; gap: 6px; padding: 10px 20px; background: var(--honey-500); color: var(--ink-900); border: none; border-radius: var(--radius-md); font-family: var(--font-body); font-size: var(--text-sm); font-weight: 600; cursor: pointer; transition: all var(--transition); }
    .btn-honey:hover:not(:disabled) { background: var(--honey-600); }
    .btn-honey:disabled { opacity: 0.4; cursor: not-allowed; }

    .sw-results { display: flex; flex-direction: column; gap: 8px; }
    .sw-bar-row { display: flex; align-items: center; gap: 8px; }
    .sw-bar-label { flex: 0 0 120px; font-size: var(--text-sm); font-weight: 500; text-align: right; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .sw-bar-track { flex: 1; height: 8px; background: var(--line-200); border-radius: 999px; overflow: hidden; }
    .sw-bar-fill { height: 100%; background: var(--honey-500); border-radius: 999px; transition: width 0.6s ease-out; }
    .sw-bar-pct { flex: 0 0 36px; font-family: var(--font-mono); font-size: var(--text-xs); text-align: right; }
    .sw-bar-count { flex: 0 0 28px; font-size: var(--text-xs); color: var(--ink-700); }
    .sw-total { text-align: center; font-size: var(--text-xs); color: var(--ink-700); margin-top: 4px; }
  `]
})
export class SondageWidgetComponent implements OnInit {
  private http = inject(HttpClient);
  @Input() sondageId!: string;
  sondage?: Sondage;
  selectedOption: number | null = null;
  membreId = localStorage.getItem('membreId') || '';
  error = signal<string | null>(null);

  ngOnInit() {
    if (this.sondageId) this.loadSondage();
  }

  loadSondage() {
    this.error.set(null);
    this.sondage = undefined;
    this.http.get<Sondage>('/api/communaute/sondages/' + this.sondageId).pipe(
      catchError(() => { this.error.set('Sondage introuvable.'); return of(null); })
    ).subscribe(s => { if (s) this.sondage = s; });
  }

  get dejaVote(): boolean {
    if (!this.sondage) return false;
    const votes = this.sondage.votes || {};
    return Object.values(votes).some((v: any) => (v as string[]).some(id => id === this.membreId));
  }

  totalVotes(): number { return !this.sondage ? 0 : Object.values(this.sondage.votes || {}).reduce((s: number, v: any) => s + (v as string[]).length, 0); }
  votesCount(i: number): number { return (this.sondage?.votes?.[String(i)] || []).length; }
  pct(i: number): number { const t = this.totalVotes(); return t === 0 ? 0 : Math.round((this.votesCount(i) / t) * 100); }

  voter() {
    if (this.selectedOption === null || !this.sondage || !this.sondageId) return;
    this.http.post('/api/communaute/sondages/vote', { sondageId: this.sondage._id, optionIndex: this.selectedOption })
      .subscribe(() => {
        this.http.get<Sondage>('/api/communaute/sondages/' + this.sondageId).subscribe(s => { this.sondage = s; this.selectedOption = null; });
      });
  }
}
