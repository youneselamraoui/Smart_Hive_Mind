import { Component, OnInit, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { DatePipe } from '@angular/common';
import { HexSealComponent } from '../../core/hex-seal.component';
import { ToastService } from '../../core/toast.service';
import { ConfirmDialogService } from '../../core/confirm-dialog.service';

function identiconSvg(id: string, name: string): string {
  let hash = 0;
  const str = id || name;
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
  selector: 'app-publication-list',
  standalone: true,
  imports: [RouterLink, DatePipe, HexSealComponent],
  template: `
    <div class="page">
      <div class="page-head">
        <div>
          <h1>Publications</h1>
          <p>Œuvres protégées par ancrage blockchain</p>
        </div>
        <a routerLink="/publications/new" class="btn btn-primary">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Nouvelle publication
        </a>
      </div>

      @if (loading()) {
        <div class="skeleton-grid">@for (i of [1,2,3]; track i) { <div class="skeleton-card"><div class="skeleton-line w-70"></div><div class="skeleton-line w-40"></div><div class="skeleton-line w-90"></div></div> }</div>
      } @else if (publications().length === 0) {
        <div class="empty-state">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--honey-500)" stroke-width="1" opacity="0.4"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
          <h3>Aucune publication</h3>
          <p>Protégez votre première œuvre sur la blockchain.</p>
          <a routerLink="/publications/new" class="btn btn-primary">Créer une publication</a>
        </div>
      } @else {
        <div class="cards-grid">
          @for (pub of publications(); track pub._id) {
            <a class="pub-card" [routerLink]="['/publications', pub._id]">
              <div class="pub-head">
                <h3 class="pub-title">{{ pub.titre }}</h3>
                <span class="pub-type" [class]="'type--' + (pub.type || 'libre')">{{ pub.type }}</span>
              </div>
              <div class="pub-meta">
                <span class="pub-author" [innerHTML]="identicon(pub)"></span>
                <span class="pub-author-name">{{ pub.auteur?.prenom || pub.auteur?.email || 'Inconnu' }} {{ pub.auteur?.nom || '' }}</span>
                <span class="pub-date">{{ pub.createdAt | date:'dd MMM yyyy' }}</span>
              </div>
              <div class="pub-footer">
                <app-hex-seal [status]="sealStatus(pub)" [size]="36"></app-hex-seal>
                <span class="pub-statut" [class]="'statut--' + sealStatus(pub)">{{ sealLabel(pub) }}</span>
              </div>
            </a>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    :host { display: block; }
    .page { position: relative; }
    .page-head { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 28px; flex-wrap: wrap; }
    .page-head h1 { font-size: var(--text-2xl); margin: 0 0 2px; }
    .page-head p { margin: 0; font-size: var(--text-sm); color: var(--ink-700); }

    .btn { display: inline-flex; align-items: center; gap: 8px; padding: 10px 20px; border: none; border-radius: var(--radius-md); font-family: var(--font-body); font-size: var(--text-sm); font-weight: 600; cursor: pointer; text-decoration: none; transition: all var(--transition); }
    .btn-primary { background: var(--honey-500); color: var(--ink-900); }
    .btn-primary:hover { background: var(--honey-600); transform: translateY(-1px); }

    .skeleton-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }
    .skeleton-card { background: var(--color-surface); border: 1px solid var(--line-200); border-radius: var(--radius-md); padding: 20px; }
    .skeleton-line { height: 12px; border-radius: 4px; background: var(--line-200); margin-bottom: 10px; animation: shimmer 1.5s infinite; }
    .w-70 { width: 70%; } .w-40 { width: 40%; } .w-90 { width: 90%; }
    @keyframes shimmer { 0%{opacity:0.5} 50%{opacity:1} 100%{opacity:0.5} }

    .empty-state { display: flex; flex-direction: column; align-items: center; text-align: center; padding: 64px 24px; }
    .empty-state svg { margin-bottom: 16px; }
    .empty-state h3 { font-size: var(--text-lg); margin: 0 0 6px; }
    .empty-state p { font-size: var(--text-sm); color: var(--ink-700); margin: 0 0 20px; }

    .cards-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; }

    .pub-card { display: flex; flex-direction: column; gap: 12px; padding: 20px; background: var(--color-surface); border: 1px solid var(--line-200); border-radius: var(--radius-md); text-decoration: none; color: inherit; transition: border-color var(--transition), box-shadow var(--transition); cursor: pointer; }
    .pub-card:hover { border-color: var(--honey-500); box-shadow: 0 2px 12px rgba(217,160,43,0.08); }

    .pub-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; }
    .pub-title { font-family: var(--font-heading); font-size: var(--text-lg); font-weight: 700; color: var(--ink-900); margin: 0; line-height: 1.3; }
    .pub-type { font-size: var(--text-xs); font-weight: 600; padding: 2px 8px; border-radius: 999px; white-space: nowrap; text-transform: uppercase; letter-spacing: 0.04em; flex-shrink: 0; margin-top: 2px; }
    .type--these { background: rgba(91,79,224,0.1); color: var(--agentic-500); }
    .type--pfe { background: rgba(31,158,109,0.1); color: var(--verify-500); }
    .type--pfa { background: rgba(217,160,43,0.1); color: var(--honey-600); }
    .type--libre { background: rgba(42,47,69,0.08); color: var(--ink-700); }
    .type--scientifique { background: rgba(91,79,224,0.08); color: var(--agentic-500); }

    .pub-meta { display: flex; align-items: center; gap: 8px; font-size: var(--text-xs); color: var(--ink-700); }
    .pub-author { display: flex; flex-shrink: 0; }
    .pub-author :deep(svg) { width: 20px; height: 20px; border-radius: 4px; }
    .pub-author-name { font-weight: 500; }
    .pub-date { margin-left: auto; opacity: 0.7; font-family: var(--font-mono); font-size: 0.70rem; }

    .pub-footer { display: flex; align-items: center; gap: 10px; padding-top: 8px; border-top: 1px solid var(--line-200); }
    .pub-statut { font-size: var(--text-xs); font-weight: 600; }
    .statut--valide { color: var(--verify-500); }
    .statut--en_attente { color: var(--honey-500); }
    .statut--echec { color: var(--alert-500); }

    @media (max-width: 768px) { .cards-grid { grid-template-columns: 1fr; } }
  `]
})
export class PublicationListComponent implements OnInit {
  private http = inject(HttpClient);
  private router = inject(Router);
  private toast = inject(ToastService);
  private confirm = inject(ConfirmDialogService);
  loading = signal(true);
  publications = signal<any[]>([]);

  ngOnInit() {
    this.http.get<any[]>('/api/publications').subscribe({
      next: list => this.publications.set(list),
      error: () => this.publications.set([]),
      complete: () => this.loading.set(false),
    });
  }

  identicon(pub: any): string {
    const id = pub.auteur?._id || pub.auteur || '';
    const name = (pub.auteur?.prenom || '') + (pub.auteur?.nom || '');
    return identiconSvg(id, name);
  }

  sealStatus(pub: any): 'valide' | 'en_attente' | 'echec' {
    const s = pub.preuve?.statut;
    if (s === 'ancre' || s === 'ancree') return 'valide';
    if (s === 'en_attente') return 'en_attente';
    if (s === 'echec') return 'echec';
    return 'en_attente';
  }

  sealLabel(pub: any): string {
    const s = pub.preuve?.statut;
    if (s === 'ancre' || s === 'ancree') return 'Ancrée';
    if (s === 'en_attente') return 'En attente';
    if (s === 'echec') return 'Échec';
    return 'Non soumise';
  }
}
