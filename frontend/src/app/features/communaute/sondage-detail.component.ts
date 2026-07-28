import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { DatePipe } from '@angular/common';

interface Sondage { _id: string; question: string; options: string[]; votes: Record<string, string[]>; auteurId: string; dateFin?: string; }

@Component({
  selector: 'app-sondage-detail',
  standalone: true,
  imports: [RouterLink, DatePipe],
  template: `
    <div class="sd-page">
      <a routerLink="/communaute/sondages" class="back-link">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="15 18 9 12 15 6"/></svg>
        Tous les sondages
      </a>

      @if (loading()) {
        <div class="sd-skel"><div class="skel-line w-60"></div><div class="skel-line w-90"></div><div class="skel-line w-40"></div></div>
      } @else if (error()) {
        <div class="sd-err">{{ error() }}</div>
      } @else { @let s = sondage()!;
        <div class="sd-card">
          <div class="sd-head">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>
            <div>
              <h2>{{ s.question }}</h2>
              @if (s.dateFin) { <span class="sd-meta">Clôture le {{ s.dateFin | date:'short' }}</span> }
            </div>
          </div>

          @if (submitting()) {
            <div class="spin-c"><div class="spin"></div></div>
          } @else if (dejaVote(s)) {
            <div class="sd-results">
              @for (opt of s.options; track opt; let i = $index) {
                <div class="sd-bar-row">
                  <span class="sd-bar-label">{{ opt }}</span>
                  <div class="sd-bar-track">
                    <div class="sd-bar-fill" [style.width.%]="pct(s, i)"></div>
                  </div>
                  <span class="sd-bar-pct">{{ pct(s, i) }}%</span>
                  <span class="sd-bar-count">{{ votesCount(s, i) }}v</span>
                </div>
              }
              <div class="sd-total">Total: {{ totalVotes(s) }} vote(s)</div>
            </div>
          } @else {
            <div class="sd-options">
              @for (opt of s.options; track opt; let i = $index) {
                <label class="sd-opt" [class.sd-opt--sel]="selectedOption() === i">
                  <input type="radio" name="sd-opt" [value]="i" (change)="selectedOption.set(i)" />
                  <span class="sd-dot"></span>
                  <span>{{ opt }}</span>
                </label>
              }
              <button class="btn-honey" [disabled]="selectedOption() === null" (click)="voter(s)">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                Voter
              </button>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    :host { display: block; }
    .sd-page { max-width: 640px; margin: 0 auto; }
    .back-link { display: inline-flex; align-items: center; gap: 6px; color: var(--ink-700); text-decoration: none; font-size: var(--text-sm); margin-bottom: 20px; }
    .back-link:hover { color: var(--honey-500); }

    .sd-skel { background: var(--color-surface); border: 1px solid var(--line-200); border-radius: var(--radius-md); padding: 24px; }
    .skel-line { height: 14px; border-radius: 4px; background: var(--line-200); margin-bottom: 10px; animation: shim 1.5s infinite; }
    .w-60 { width: 60%; } .w-90 { width: 90%; } .w-40 { width: 40%; }
    @keyframes shim { 0%{opacity:0.5} 50%{opacity:1} 100%{opacity:0.5} }

    .sd-err { text-align: center; padding: 32px; color: var(--alert-500); background: rgba(196,67,46,0.06); border-radius: var(--radius-md); }
    .sd-card { background: var(--color-surface); border: 1px solid var(--line-200); border-radius: var(--radius-md); padding: 24px; }
    .sd-head { display: flex; gap: 12px; margin-bottom: 20px; }
    .sd-head svg { flex-shrink: 0; color: var(--honey-500); margin-top: 3px; }
    .sd-head h2 { font-size: var(--text-lg); margin: 0 0 2px; }
    .sd-meta { font-size: var(--text-xs); color: var(--ink-700); }

    .spin-c { display: flex; justify-content: center; padding: 20px; }
    .spin { width: 24px; height: 24px; border: 2px solid var(--line-200); border-top-color: var(--honey-500); border-radius: 50%; animation: sp 0.7s linear infinite; }
    @keyframes sp { to { transform: rotate(360deg); } }

    .sd-options { display: flex; flex-direction: column; gap: 8px; }
    .sd-opt { display: flex; align-items: center; gap: 10px; padding: 10px 14px; border: 1px solid var(--line-200); border-radius: var(--radius-sm); cursor: pointer; transition: all var(--transition); font-size: var(--text-sm); }
    .sd-opt:hover { border-color: var(--honey-500); }
    .sd-opt--sel { border-color: var(--honey-500); background: rgba(217,160,43,0.04); }
    .sd-opt input { display: none; }
    .sd-dot { width: 16px; height: 16px; border-radius: 50%; border: 2px solid var(--line-200); flex-shrink: 0; transition: all var(--transition); }
    .sd-opt--sel .sd-dot { border-color: var(--honey-500); background: var(--honey-500); box-shadow: inset 0 0 0 3px var(--color-surface); }

    .btn-honey { display: flex; align-items: center; justify-content: center; gap: 6px; padding: 10px 20px; background: var(--honey-500); color: var(--ink-900); border: none; border-radius: var(--radius-md); font-family: var(--font-body); font-size: var(--text-sm); font-weight: 600; cursor: pointer; transition: all var(--transition); width: fit-content; margin-top: 4px; }
    .btn-honey:hover:not(:disabled) { background: var(--honey-600); }
    .btn-honey:disabled { opacity: 0.4; cursor: not-allowed; }

    .sd-results { display: flex; flex-direction: column; gap: 10px; }
    .sd-bar-row { display: flex; align-items: center; gap: 10px; }
    .sd-bar-label { flex: 0 0 140px; font-size: var(--text-sm); font-weight: 500; text-align: right; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .sd-bar-track { flex: 1; height: 10px; background: var(--line-200); border-radius: 999px; overflow: hidden; }
    .sd-bar-fill { height: 100%; background: var(--honey-500); border-radius: 999px; transition: width 0.6s ease-out; }
    .sd-bar-pct { flex: 0 0 36px; font-family: var(--font-mono); font-size: var(--text-sm); text-align: right; }
    .sd-bar-count { flex: 0 0 30px; font-size: var(--text-xs); color: var(--ink-700); }
    .sd-total { text-align: center; font-size: var(--text-xs); color: var(--ink-700); margin-top: 6px; }
  `]
})
export class SondageDetailComponent implements OnInit {
  private http = inject(HttpClient);
  private route = inject(ActivatedRoute);
  loading = signal(true);
  error = signal<string | null>(null);
  sondage = signal<Sondage | null>(null);
  selectedOption = signal<number | null>(null);
  submitting = signal(false);
  membreId = localStorage.getItem('membreId') || '';

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) { this.error.set('ID manquant'); this.loading.set(false); return; }
    this.http.get<Sondage>('/api/communaute/sondages/' + id).subscribe({
      next: s => { this.sondage.set(s); this.loading.set(false); },
      error: () => { this.error.set('Sondage introuvable'); this.loading.set(false); },
    });
  }

  dejaVote(s: Sondage): boolean { return Object.values(s.votes || {}).some((v: any) => (v as string[]).some(id => id === this.membreId)); }
  totalVotes(s: Sondage): number { return Object.values(s.votes || {}).reduce((sum: number, v: any) => sum + (v as string[]).length, 0); }
  votesCount(s: Sondage, i: number): number { return (s.votes?.[String(i)] || []).length; }
  pct(s: Sondage, i: number): number { const t = this.totalVotes(s); return t === 0 ? 0 : Math.round((this.votesCount(s, i) / t) * 100); }

  voter(s: Sondage) {
    if (this.selectedOption() === null) return;
    this.submitting.set(true);
    this.http.post('/api/communaute/sondages/vote', { sondageId: s._id, optionIndex: this.selectedOption() })
      .subscribe(() => {
        this.http.get<Sondage>('/api/communaute/sondages/' + s._id).subscribe(updated => { this.sondage.set(updated); this.selectedOption.set(null); this.submitting.set(false); });
      });
  }
}
