import { Component, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../core/toast.service';

@Component({
  selector: 'app-mentorat-demand',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="page">
      <div class="page-head"><div><h1>Demander un mentor</h1><p>Trouvez un mentor et envoyez une demande</p></div></div>

      <div class="search-bar">
        <input class="input" [(ngModel)]="search" (input)="rechercher()" placeholder="Rechercher par nom, prénom ou email…" />
      </div>

      @if (loading()) {
        <div class="skel-grid">@for (i of [1,2,3]; track i) { <div class="skel-card"><div class="skel-line w-50"></div><div class="skel-line w-30"></div></div> }</div>
      } @else {
        @if (results().length === 0) {
          <div class="empty"><h3>Aucun membre trouvé</h3><p>Essayez une autre recherche.</p></div>
        } @else {
          <div class="results">
            @for (m of results(); track m._id) {
              <div class="member-card">
                <div class="member-info">
                  <div class="member-avatar">{{ m.prenom?.[0] }}{{ m.nom?.[0] }}</div>
                  <div>
                    <strong>{{ m.prenom }} {{ m.nom }}</strong>
                    <span class="member-role">{{ m.role }}</span>
                    @if (m.email) { <span class="member-email">{{ m.email }}</span> }
                  </div>
                </div>
                <button class="btn btn-primary" (click)="demander(m._id)" [disabled]="submitting()">
                  {{ submitting() ? '…' : 'Demander' }}
                </button>
              </div>
            }
          </div>
        }
      }
    </div>
  `,
  styles: [`
    :host { display: block; }
    .page-head { margin-bottom: 24px; }
    .page-head h1 { font-size: var(--text-2xl); margin: 0 0 2px; }
    .page-head p { margin: 0; font-size: var(--text-sm); color: var(--ink-700); }

    .search-bar { margin-bottom: 24px; max-width: 480px; }
    .input { width: 100%; padding: 10px 14px; border: 1px solid var(--line-200); border-radius: var(--radius-sm); font-family: var(--font-body); font-size: var(--text-sm); outline: none; background: var(--color-surface); color: var(--ink-900); transition: border-color var(--transition); box-sizing: border-box; }
    .input:focus { border-color: var(--indigo-500); }

    .skel-grid { display: flex; flex-direction: column; gap: 12px; }
    .skel-card { background: var(--color-surface); border: 1px solid var(--line-200); border-radius: var(--radius-md); padding: 20px; }
    .skel-line { height: 14px; border-radius: 4px; background: var(--line-200); margin-bottom: 8px; animation: sh 1.5s infinite; }
    .skel-line:last-child { margin-bottom: 0; }
    .w-50 { width: 50%; } .w-30 { width: 30%; }
    @keyframes sh { 0%{opacity:0.5} 50%{opacity:1} 100%{opacity:0.5} }

    .empty { text-align: center; padding: 48px 20px; }
    .empty h3 { font-size: var(--text-lg); margin: 0 0 4px; }
    .empty p { font-size: var(--text-sm); color: var(--ink-700); margin: 0; }

    .results { display: flex; flex-direction: column; gap: 10px; max-width: 600px; }
    .member-card { display: flex; align-items: center; justify-content: space-between; gap: 16px; background: var(--color-surface); border: 1px solid var(--line-200); border-radius: var(--radius-md); padding: 14px 20px; transition: border-color var(--transition); }
    .member-card:hover { border-color: var(--indigo-300); }
    .member-info { display: flex; align-items: center; gap: 12px; flex: 1; min-width: 0; }
    .member-info div { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
    .member-info strong { font-size: var(--text-sm); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .member-role { font-size: var(--text-xs); color: var(--ink-500); text-transform: capitalize; }
    .member-email { font-size: var(--text-xs); color: var(--ink-400); }

    .member-avatar { width: 36px; height: 36px; border-radius: 50%; background: var(--indigo-100); color: var(--indigo-600); display: flex; align-items: center; justify-content: center; font-size: var(--text-xs); font-weight: 700; flex-shrink: 0; }

    .btn { display: inline-flex; align-items: center; gap: 6px; padding: 8px 18px; border-radius: var(--radius-sm); font-family: var(--font-body); font-size: var(--text-xs); font-weight: 600; cursor: pointer; transition: all var(--transition); border: none; flex-shrink: 0; }
    .btn:disabled { opacity: 0.4; cursor: not-allowed; }
    .btn-primary { background: var(--indigo-500); color: #fff; }
    .btn-primary:hover:not(:disabled) { background: var(--indigo-600); }
  `]
})
export class MentoratDemandComponent {
  private http = inject(HttpClient);
  private toast = inject(ToastService);
  router = inject(Router);

  search = '';
  loading = signal(false);
  submitting = signal(false);
  results = signal<any[]>([]);
  private debounceTimer: any;

  rechercher() {
    clearTimeout(this.debounceTimer);
    if (!this.search.trim()) { this.results.set([]); return; }
    this.debounceTimer = setTimeout(() => {
      this.loading.set(true);
      this.http.get<any[]>('/api/membres', { params: { search: this.search } }).subscribe({
        next: list => { this.results.set(list); this.loading.set(false); },
        error: () => { this.results.set([]); this.loading.set(false); },
      });
    }, 300);
  }

  demander(mentorId: string) {
    this.submitting.set(true);
    this.http.post<any>('/api/skills/mentorats/demander', { mentorId }).subscribe({
      next: () => { this.submitting.set(false); this.toast.success('Demande de mentorat envoyée.'); this.router.navigate(['/app/skills/mentorats']); },
      error: err => { this.submitting.set(false); this.toast.error(err.error?.error || 'Erreur.'); },
    });
  }
}
