import { Component, OnInit, inject, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

function identiconSvg(id: string, name: string, size: number = 36): string {
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
  return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" xmlns="http://www.w3.org/2000/svg">${cells.join('')}</svg>`;
}

@Component({
  selector: 'app-mentorat-dashboard',
  standalone: true,
  imports: [DatePipe, FormsModule],
  template: `
    <div class="page">
      <div class="page-head"><div><h1>Mentorats</h1><p>Transmission et accompagnement</p></div></div>

      @if (loading()) {
        <div class="skel-grid">@for (i of [1,2]; track i) { <div class="skel-card"><div class="skel-line w-70"></div><div class="skel-line w-40"></div></div> }</div>
      } @else { @if (mentorats.length === 0 && apprentissages.length === 0) {
        <div class="empty"><h3>Aucun mentorat</h3><p>Les mentorats apparaîtront ici une fois actifs.</p></div>
      } @else {
        @if (mentorats.length) {
          <h2 class="sub">En tant que mentor</h2>
          @for (m of mentorats; track m._id) {
            <div class="relation-card">
              <div class="relation-connect">
                <div class="conn-side">
                  <div class="identicon" [innerHTML]="identiconSvg(membreId, 'Moi')"></div>
                  <span class="conn-label">Moi</span>
                </div>
                <div class="conn-line">
                  <div class="conn-dash"></div>
                  <div class="conn-arrow"></div>
                </div>
                <div class="conn-side">
                  <div class="identicon" [innerHTML]="identiconSvg(m.apprenantId._id, m.apprenantId.prenom + ' ' + m.apprenantId.nom)"></div>
                  <span class="conn-label">{{ m.apprenantId.prenom }}</span>
                </div>
                <span class="conn-status" [class.active]="m.statut === 'actif'">{{ m.statut }}</span>
              </div>
              @if (m.suivi?.length) {
                <div class="timeline">
                  @for (s of m.suivi; track s.date) {
                    <div class="tl-row">
                      <span class="tl-date">{{ s.date | date:'dd MMM' }}</span>
                      <span class="tl-note">{{ s.note }}</span>
                    </div>
                  }
                </div>
              }
              @if (m.statut === 'actif') {
                <div class="suivi-form">
                  <input class="input" [(ngModel)]="suiviNotes[m._id]" placeholder="Note de suivi…" />
                  <button class="btn btn-primary btn-sm" (click)="ajouterSuivi(m)">Ajouter</button>
                </div>
              }
            </div>
          }
        }

        @if (apprentissages.length) {
          <h2 class="sub">En tant qu'apprenant</h2>
          @for (m of apprentissages; track m._id) {
            <div class="relation-card">
              <div class="relation-connect">
                <div class="conn-side">
                  <div class="identicon" [innerHTML]="identiconSvg(m.mentorId._id, m.mentorId.prenom + ' ' + m.mentorId.nom)"></div>
                  <span class="conn-label">{{ m.mentorId.prenom }}</span>
                </div>
                <div class="conn-line">
                  <div class="conn-dash"></div>
                  <div class="conn-arrow conn-arrow--rev"></div>
                </div>
                <div class="conn-side">
                  <div class="identicon" [innerHTML]="identiconSvg(membreId, 'Moi')"></div>
                  <span class="conn-label">Moi</span>
                </div>
                <span class="conn-status" [class.active]="m.statut === 'actif'">{{ m.statut }}</span>
              </div>
              @if (m.suivi?.length) {
                <div class="timeline">
                  @for (s of m.suivi; track s.date) {
                    <div class="tl-row">
                      <span class="tl-date">{{ s.date | date:'dd MMM' }}</span>
                      <span class="tl-note">{{ s.note }}</span>
                    </div>
                  }
                </div>
              }
            </div>
          }
        }
      }}
    </div>
  `,
  styles: [`
    :host { display: block; }
    .page-head { margin-bottom: 24px; }
    .page-head h1 { font-size: var(--text-2xl); margin: 0 0 2px; }
    .page-head p { margin: 0; font-size: var(--text-sm); color: var(--ink-700); }

    .empty { display: flex; flex-direction: column; align-items: center; padding: 60px 24px; }
    .empty h3 { font-size: var(--text-lg); margin: 0 0 4px; }
    .empty p { font-size: var(--text-sm); color: var(--ink-700); margin: 0; }

    .skel-grid { display: grid; gap: 16px; }
    .skel-card { background: var(--color-surface); border: 1px solid var(--line-200); border-radius: var(--radius-md); padding: 20px; }
    .skel-line { height: 12px; border-radius: 4px; background: var(--line-200); margin-bottom: 10px; animation: sh 1.5s infinite; }
    .w-70 { width: 70%; } .w-40 { width: 40%; }
    @keyframes sh { 0%{opacity:0.5} 50%{opacity:1} 100%{opacity:0.5} }

    .sub { font-size: var(--text-lg); margin: 24px 0 16px; }

    .relation-card { background: var(--color-surface); border: 1px solid var(--line-200); border-radius: var(--radius-md); padding: 24px; margin-bottom: 16px; transition: border-color var(--transition); }
    .relation-card:hover { border-color: var(--ink-700); }

    .relation-connect { display: flex; align-items: center; gap: 16px; margin-bottom: 16px; }
    .conn-side { display: flex; flex-direction: column; align-items: center; gap: 4px; min-width: 50px; }
    .identicon { width: 40px; height: 40px; border-radius: 50%; overflow: hidden; background: var(--paper-50); flex-shrink: 0; }
    .identicon :deep(svg) { width: 100%; height: 100%; display: block; }
    .conn-label { font-size: var(--text-xs); font-weight: 600; color: var(--ink-700); text-align: center; }
    .conn-line { flex: 1; height: 2px; position: relative; }
    .conn-dash { width: 100%; height: 100%; border-top: 2px dashed var(--line-200); }
    .conn-arrow { position: absolute; top: 50%; left: 0; width: 8px; height: 8px; background: var(--honey-500); border-radius: 50%; transform: translateY(-50%); animation: arrowMove 3s ease-in-out infinite; }
    .conn-arrow--rev { left: auto; right: 0; animation: arrowMoveRev 3s ease-in-out infinite; }
    @keyframes arrowMove { 0%{left:0;opacity:0.3} 50%{left:calc(100% - 8px);opacity:1} 100%{left:0;opacity:0.3} }
    @keyframes arrowMoveRev { 0%{right:0;opacity:0.3} 50%{right:calc(100% - 8px);opacity:1} 100%{right:0;opacity:0.3} }
    .conn-status { font-size: var(--text-xs); font-weight: 600; text-transform: uppercase; padding: 2px 10px; border-radius: 999px; background: var(--line-200); color: var(--ink-700); }
    .conn-status.active { background: rgba(31,158,109,0.1); color: var(--verify-500); }

    .timeline { display: flex; flex-direction: column; gap: 0; border-left: 1px solid var(--line-200); margin-left: 20px; padding-left: 16px; }
    .tl-row { display: flex; gap: 12px; padding: 6px 0; font-size: var(--text-sm); position: relative; }
    .tl-row::before { content: ''; position: absolute; left: -21px; top: 11px; width: 7px; height: 7px; border-radius: 50%; background: var(--line-200); }
    .tl-date { font-family: var(--font-mono); font-size: var(--text-xs); color: var(--ink-700); white-space: nowrap; min-width: 70px; }
    .tl-note { color: var(--ink-900); }

    .suivi-form { display: flex; gap: 8px; margin-top: 12px; }
    .input { flex: 1; padding: 8px 12px; border: 1px solid var(--line-200); border-radius: var(--radius-sm); font-family: var(--font-body); font-size: var(--text-sm); outline: none; background: var(--color-surface); color: var(--ink-900); transition: border-color var(--transition); }
    .input:focus { border-color: var(--honey-500); }
    .btn { display: inline-flex; align-items: center; gap: 6px; border-radius: var(--radius-sm); font-family: var(--font-body); font-size: var(--text-sm); font-weight: 600; cursor: pointer; transition: all var(--transition); border: none; }
    .btn-sm { padding: 8px 16px; }
    .btn-primary { background: var(--honey-500); color: var(--ink-900); }
    .btn-primary:hover { background: var(--honey-600); }

    @media (max-width: 768px) { .relation-connect { gap: 10px; } .conn-label { font-size: 10px; } }
  `]
})
export class MentoratDashboardComponent implements OnInit {
  private http = inject(HttpClient);
  membreId = localStorage.getItem('membreId') || '';
  mentorats: any[] = [];
  apprentissages: any[] = [];
  suiviNotes: Record<string, string> = {};
  loading = signal(true);

  identiconSvg = identiconSvg;

  ngOnInit() {
    this.http.get<any[]>('/api/skills/mentorats').subscribe({
      next: list => {
        this.mentorats = list.filter(m => m.mentorId._id === this.membreId);
        this.apprentissages = list.filter(m => m.apprenantId._id === this.membreId);
      },
      error: () => this.loading.set(false),
      complete: () => this.loading.set(false),
    });
  }

  ajouterSuivi(m: any) {
    const note = this.suiviNotes[m._id];
    if (!note?.trim()) return;
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders(token ? { Authorization: `Bearer ${token}` } : {});
    this.http.post<any>('/api/skills/mentorats/suivi', { mentoratId: m._id, note }, { headers }).subscribe({
      next: res => { m.suivi = res.suivi; this.suiviNotes[m._id] = ''; },
    });
  }
}
