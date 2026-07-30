import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { ToastService } from '../../../core/toast.service';

function identiconSvg(id: string, name: string): string {
  let hash = 0; const str = id || name;
  for (let i = 0; i < str.length; i++) { hash = ((hash << 5) - hash) + str.charCodeAt(i); hash |= 0; }
  const hue = Math.abs(hash % 360);
  const cells: string[] = [];
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      const ci = r * 4 + (c < 2 ? c : 3 - c);
      const on = ((hash >> (ci % 16)) & 1) === 1;
      if (on) cells.push(`<rect x="${c * 5 + 2}" y="${r * 5 + 2}" width="5" height="5" rx="1" fill="hsl(${hue},40%,${50 + (ci % 3) * 12}%)" opacity="0.8"/>`);
    }
  }
  return `<svg viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">${cells.join('')}</svg>`;
}

@Component({
  selector: 'app-sujet-detail',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule, DatePipe],
  template: `
    <div class="detail-page">
      <a routerLink="/communaute" class="back-link">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="15 18 9 12 15 6"/></svg>
        Retour aux forums
      </a>

      @if (!sujet()) {
        <div class="loading-center">
          <div class="spin"></div>
          <span>Chargement du sujet…</span>
        </div>
      } @else { @let s = sujet()!;
        <!-- Original sujet message -->
        <div class="thread-root">
          <div class="thread-identicon" [innerHTML]="identicon(s.auteurId?._id || '', (s.auteurId?.prenom || '') + (s.auteurId?.nom || ''))"></div>
          <div class="thread-content">
            <div class="thread-head">
              <h1>{{ s.titre }}</h1>
              <span class="thread-author">{{ s.auteurId?.prenom }} {{ s.auteurId?.nom }}</span>
              <span class="thread-date">{{ s.createdAt | date:'dd MMM yyyy · HH:mm' }}</span>
            </div>
            <div class="thread-body">{{ s.contenu }}</div>
          </div>
        </div>

        <!-- Discussion thread -->
        <div class="thread-section">
          <h2>Discussions <span class="thread-count">({{ s.discussions?.length || 0 }})</span></h2>

          @if (!s.discussions || s.discussions.length === 0) {
            <div class="empty-d">
              <p>Soyez le premier à répondre.</p>
            </div>
          } @else {
            <div class="thread-list">
              @for (d of s.discussions; track d._id) {
                <div class="thread-reply" [class.reply--op]="isOp(d, s)">
                  <div class="thread-identicon" [innerHTML]="identicon(d.auteurId?._id || '', (d.auteurId?.prenom || '') + (d.auteurId?.nom || ''))"></div>
                  <div class="thread-content">
                    <div class="thread-head">
                      <span class="thread-author">{{ d.auteurId?.prenom }} {{ d.auteurId?.nom }}</span>
                      @if (isOp(d, s)) { <span class="op-badge">Auteur</span> }
                      <span class="thread-date">{{ d.createdAt | date:'dd MMM yyyy · HH:mm' }}</span>
                    </div>
                    <div class="thread-body">{{ d.contenu }}</div>
                  </div>
                </div>
              }
            </div>
          }

          <!-- Reply form -->
          <div class="reply-block">
            <h3>Répondre</h3>
            <form [formGroup]="form" (ngSubmit)="repondre()">
              <textarea formControlName="contenu" rows="4" placeholder="Écrivez votre réponse…"></textarea>
              <button class="btn btn-primary" [disabled]="form.invalid || loading()">
                {{ loading() ? 'Envoi…' : 'Publier la réponse' }}
              </button>
            </form>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    :host { display: block; }
    .detail-page { max-width: 740px; }

    .back-link { display: inline-flex; align-items: center; gap: 6px; color: var(--ink-700); text-decoration: none; font-size: var(--text-sm); margin-bottom: 20px; transition: color var(--transition); }
    .back-link:hover { color: var(--honey-500); }

    .loading-center { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 60px 20px; color: var(--ink-700); }
    .spin { width: 24px; height: 24px; border: 2px solid var(--line-200); border-top-color: var(--honey-500); border-radius: 50%; animation: sp 0.7s linear infinite; }
    @keyframes sp { to { transform: rotate(360deg); } }

    /* Root message — always visible, honey left border */
    .thread-root { display: flex; gap: 14px; padding: 20px; background: var(--color-surface); border: 1px solid var(--line-200); border-left: 2px solid var(--honey-500); border-radius: var(--radius-md); margin-bottom: 24px; }
    .thread-identicon { flex-shrink: 0; }
    .thread-identicon :deep(svg) { width: 28px; height: 28px; border-radius: 4px; }
    .thread-content { flex: 1; min-width: 0; }
    .thread-head { margin-bottom: 8px; }
    .thread-head h1 { font-size: var(--text-xl); margin: 0 0 6px; }
    .thread-author { font-size: var(--text-sm); font-weight: 500; color: var(--ink-900); }
    .thread-date { font-size: var(--text-xs); color: var(--ink-700); margin-left: 10px; font-family: var(--font-mono); }
    .thread-body { font-size: var(--text-base); line-height: 1.7; white-space: pre-wrap; color: var(--ink-900); }

    .thread-section { margin-top: 0; }
    .thread-section h2 { font-size: var(--text-lg); margin: 0 0 16px; }
    .thread-count { font-weight: 400; color: var(--ink-700); }

    .empty-d { text-align: center; padding: 24px; color: var(--ink-700); font-size: var(--text-sm); background: var(--color-surface); border: 1px solid var(--line-200); border-radius: var(--radius-md); }

    .thread-list { display: flex; flex-direction: column; gap: 2px; margin-bottom: 24px; }
    .thread-reply { display: flex; gap: 14px; padding: 14px 20px; background: var(--color-surface); border: 1px solid var(--line-200); border-radius: var(--radius-sm); }
    .thread-reply.reply--op { border-left: 2px solid var(--honey-500); border-radius: var(--radius-md); background: rgba(217,160,43,0.03); }
    .thread-reply:not(.reply--op) { margin-left: 20px; }

    .reply-block { background: var(--color-surface); border: 1px solid var(--line-200); border-radius: var(--radius-md); padding: 20px; }
    .reply-block h3 { font-size: var(--text-sm); font-weight: 600; margin: 0 0 12px; }
    textarea { width: 100%; padding: 10px 14px; border: 1px solid var(--line-200); border-radius: var(--radius-md); font-family: var(--font-body); font-size: var(--text-sm); resize: vertical; background: var(--color-surface); color: var(--ink-900); outline: none; transition: border-color var(--transition); box-sizing: border-box; }
    textarea:focus { border-color: var(--honey-500); box-shadow: 0 0 0 3px rgba(217,160,43,0.08); }

    .btn { padding: 10px 22px; border: none; border-radius: var(--radius-md); font-family: var(--font-body); font-size: var(--text-sm); font-weight: 600; cursor: pointer; transition: all var(--transition); }
    .btn:disabled { opacity: 0.4; cursor: not-allowed; }
    .btn-primary { background: var(--honey-500); color: var(--ink-900); margin-top: 10px; }
    .btn-primary:hover:not(:disabled) { background: var(--honey-600); }

    .op-badge { display: inline-block; font-size: 0.6rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; padding: 1px 6px; border-radius: 4px; background: var(--honey-500); color: var(--ink-900); margin-left: 8px; vertical-align: middle; }

    @media (max-width: 600px) { .thread-reply:not(.reply--op) { margin-left: 10px; } }
  `]
})
export class SujetDetailComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);
  private fb = inject(FormBuilder);
  private toast = inject(ToastService);

  sujet = signal<any>(null);
  loading = signal(false);
  private destroy$ = new Subject<void>();

  ngOnDestroy() { this.destroy$.next(); this.destroy$.complete(); }
  form = this.fb.nonNullable.group({ contenu: ['', Validators.required] });

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;
    this.loading.set(true);
    this.http.get<any>('/api/communaute/sujets/' + id).pipe(takeUntil(this.destroy$)).subscribe({
      next: s => this.sujet.set(s),
      error: () => { this.loading.set(false); this.toast.error('Sujet introuvable.'); },
      complete: () => this.loading.set(false),
    });
  }

  identicon(id: string, name: string): string {
    return identiconSvg(id, name);
  }

  isOp(d: any, s: any): boolean {
    return d.auteurId?._id === s.auteurId?._id;
  }

  repondre() {
    if (this.form.invalid) return;
    this.loading.set(true);
    const s = this.sujet();
    this.http.post('/api/communaute/discussions', {
      sujetId: s._id,
      contenu: this.form.value.contenu,
    }).pipe(takeUntil(this.destroy$)).subscribe({
      next: (d: any) => {
        s.discussions = [...(s.discussions || []), d];
        this.sujet.set({ ...s });
        this.form.reset();
        this.loading.set(false);
        this.toast.success('Réponse publiée');
      },
      error: () => this.loading.set(false),
    });
  }
}
