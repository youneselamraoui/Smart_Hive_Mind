import { Component, OnInit, inject, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { IdenticonComponent } from '../../core/identicon.component';

@Component({
  selector: 'app-mentorat-dashboard',
  standalone: true,
  imports: [DatePipe, FormsModule, RouterLink, IdenticonComponent],
  template: `
    <div class="page">
      <div class="page-head"><div><h1>Mentorats</h1><p>Transmission et accompagnement</p></div>
        <div class="page-actions">
          <a class="btn btn-outline btn-sm" routerLink="/app/skills/mentorats/demander">Demander un mentor</a>
          <a class="btn btn-primary btn-sm" routerLink="/app/skills/mentorats/accepter">Demandes à accepter</a>
        </div>
      </div>

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
                  <div class="identicon"><app-identicon [id]="membreId" name="Moi" [size]="36"></app-identicon></div>
                  <span class="conn-label">Moi</span>
                </div>
                <div class="conn-line">
                  <div class="conn-dash"></div>
                  <div class="conn-arrow"></div>
                </div>
                <div class="conn-side">
                  <div class="identicon"><app-identicon [id]="m.apprenantId._id" [name]="m.apprenantId.prenom + ' ' + m.apprenantId.nom" [size]="36"></app-identicon></div>
                  <a class="conn-label" [routerLink]="['/app', 'membre', m.apprenantId._id]">{{ m.apprenantId.prenom }}</a>
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
                  <div class="identicon"><app-identicon [id]="m.mentorId._id" [name]="m.mentorId.prenom + ' ' + m.mentorId.nom" [size]="36"></app-identicon></div>
                  <a class="conn-label" [routerLink]="['/app', 'membre', m.mentorId._id]">{{ m.mentorId.prenom }}</a>
                </div>
                <div class="conn-line">
                  <div class="conn-dash"></div>
                  <div class="conn-arrow conn-arrow--rev"></div>
                </div>
                <div class="conn-side">
                  <div class="identicon"><app-identicon [id]="membreId" name="Moi" [size]="36"></app-identicon></div>
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
    .page-head { margin-bottom: 24px; display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; }
    .page-head h1 { font-size: var(--text-2xl); margin: 0 0 2px; }
    .page-head p { margin: 0; font-size: var(--text-sm); color: var(--ink-700); }
    .page-actions { display: flex; gap: 8px; }

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
    .conn-label { font-size: var(--text-xs); font-weight: 600; color: var(--ink-700); text-align: center; text-decoration: none; transition: color var(--transition); }
    .conn-label:hover { color: var(--honey-600); }
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
    .btn-outline { background: var(--color-surface); border: 1px solid var(--line-200); color: var(--ink-900); text-decoration: none; }
    .btn-outline:hover { border-color: var(--honey-500); }

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
