import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { DatePipe } from '@angular/common';
import { HexSealComponent } from '../../core/hex-seal.component';
import { IdenticonComponent } from '../../core/identicon.component';

@Component({
  selector: 'app-profil-certifie',
  standalone: true,
  imports: [DatePipe, HexSealComponent, IdenticonComponent],
  template: `
    <div class="page">
      @if (loading()) {
        <div class="skel-k">
          <div class="skel-card"><div class="skel-line w-50"></div><div class="skel-line w-30"></div></div>
          <div class="skel-card"><div class="skel-line w-80"></div><div class="skel-line w-60"></div></div>
        </div>
      } @else { @if (membre(); as m) {
        <div class="profile-hero">
          <div class="hero-identicon"><app-identicon [id]="m._id" [name]="m.prenom + ' ' + m.nom"></app-identicon></div>
          <div class="hero-info">
            <h1 class="hero-name">{{ m.prenom }} {{ m.nom }}</h1>
            <p class="hero-title">Profil certifié</p>
            <p class="hero-email">{{ m.email }}</p>
          </div>
          <div class="hero-ring">
            <svg viewBox="0 0 36 36" width="88" height="88">
              <circle cx="18" cy="18" r="15.5" fill="none" stroke="var(--line-200)" stroke-width="2.5"/>
              <circle cx="18" cy="18" r="15.5" fill="none" stroke="var(--verify-500)" stroke-width="2.5"
                stroke-dasharray="97.4" [attr.stroke-dashoffset]="97.4 - (97.4 * m.reputationScore / 100)"
                stroke-linecap="round" transform="rotate(-90 18 18)"/>
              <text x="18" y="18" text-anchor="middle" dy="4" font-size="7" font-weight="700" fill="var(--ink-900)">{{ m.reputationScore }}</text>
            </svg>
            <span class="ring-label">Réputation</span>
          </div>
        </div>

        <div class="profile-stats">
          <div class="stat-cell"><strong>{{ missions().length }}</strong> missions</div>
          <div class="stat-cell"><strong>{{ competenceValidees.length }}</strong> compétences certifiées</div>
        </div>

        <section class="section-block">
          <h2>Compétences validées</h2>
          @if (competenceValidees.length === 0 && competenceDeclaratives.length === 0) {
            <p class="empty-p">Aucune compétence renseignée.</p>
          } @else {
            <div class="pills">
              @for (c of competenceValidees; track c._id) {
                <span class="pill pill-verified" title="Validée par mission">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--verify-500)" stroke-width="2.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                  {{ c.competence }}
                </span>
              }
              @for (c of competenceDeclaratives; track c._id) {
                <span class="pill">{{ c.competence }}</span>
              }
            </div>
          }
        </section>

        <section class="section-block">
          <h2>Historique des missions</h2>
          @if (missions().length === 0) {
            <p class="empty-p">Aucune mission réalisée.</p>
          } @else {
            <div class="timeline">
              @for (m of missions(); track m._id) {
                <div class="tl-item">
                  <div class="tl-marker">
                    <app-hex-seal [status]="m.statut === 'terminee' ? 'valide' : 'en_attente'" [size]="32"></app-hex-seal>
                  </div>
                  <div class="tl-content">
                    <div class="tl-head">
                      <h3>{{ m.offreId?.titre }}</h3>
                      @if (m.evaluationClient !== undefined && m.evaluationClient !== null) {
                        <span class="tl-note">{{ m.evaluationClient }}/5</span>
                      }
                    </div>
                    <div class="tl-meta">
                      <span>{{ m.periode.debut | date:'dd MMM yyyy' }} — {{ m.periode.fin ? (m.periode.fin | date:'dd MMM yyyy') : 'En cours' }}</span>
                    </div>
                    @if (m.livrables?.length) {
                      <div class="tl-livrables">
                        <strong>Livrables</strong>
                        <ul>@for (l of m.livrables; track l) { <li>{{ l }}</li> }</ul>
                      </div>
                    }
                  </div>
                </div>
              }
            </div>
          }
        </section>
      } @else {
        <div class="empty"><h3>Profil introuvable</h3></div>
      }}
    </div>
  `,
  styles: [`
    :host { display: block; }
    .page { max-width: 800px; margin: 0 auto; position: relative; }

    .skel-k { display: flex; flex-direction: column; gap: 20px; }
    .skel-card { background: var(--color-surface); border: 1px solid var(--line-200); border-radius: var(--radius-md); padding: 24px; }
    .skel-line { height: 14px; border-radius: 6px; background: var(--line-200); margin-bottom: 10px; animation: sh 1.5s infinite; }
    .skel-line:last-child { margin-bottom: 0; }
    .w-50 { width: 50%; } .w-30 { width: 30%; } .w-80 { width: 80%; } .w-60 { width: 60%; }
    @keyframes sh { 0%{opacity:0.5} 50%{opacity:1} 100%{opacity:0.5} }

    .empty { display: flex; flex-direction: column; align-items: center; padding: 80px 24px; }
    .empty h3 { font-size: var(--text-lg); margin: 0; }
    .empty-p { font-size: var(--text-sm); color: var(--ink-700); font-style: italic; margin: 0; }

    .profile-hero { display: flex; align-items: center; gap: 28px; margin-bottom: 24px; padding: 32px; background: var(--color-surface); border: 1px solid var(--line-200); border-radius: var(--radius-md); }
    .hero-identicon { width: 72px; height: 72px; flex-shrink: 0; }
    .hero-identicon :deep(svg) { width: 100%; height: 100%; }
    .hero-info { flex: 1; min-width: 0; }
    .hero-name { font-size: var(--text-2xl); margin: 0 0 2px; }
    .hero-title { font-size: var(--text-sm); font-weight: 600; color: var(--verify-500); margin: 0 0 4px; text-transform: uppercase; letter-spacing: 0.06em; }
    .hero-email { font-size: var(--text-sm); color: var(--ink-700); margin: 0; font-family: var(--font-mono); }
    .hero-ring { display: flex; flex-direction: column; align-items: center; gap: 4px; flex-shrink: 0; }
    .ring-label { font-size: var(--text-xs); color: var(--ink-700); }

    .profile-stats { display: flex; gap: 32px; padding: 16px 32px; margin-bottom: 32px; }
    .stat-cell { font-size: var(--text-sm); color: var(--ink-700); }
    .stat-cell strong { font-size: var(--text-base); color: var(--ink-900); margin-right: 4px; }

    .section-block { margin-bottom: 36px; }
    .section-block h2 { font-size: var(--text-lg); margin: 0 0 16px; font-weight: 600; }

    .pills { display: flex; flex-wrap: wrap; gap: 8px; }
    .pill { display: inline-flex; align-items: center; gap: 5px; padding: 6px 14px; border-radius: 999px; font-size: var(--text-sm); background: var(--line-200); color: var(--ink-900); transition: all var(--transition); }
    .pill-verified { background: transparent; border: 1px solid var(--verify-500); color: var(--verify-500); }
    .pill-verified:hover { background: rgba(31,158,109,0.06); }
    .pill:hover { background: rgba(16,19,31,0.08); }

    .timeline { display: flex; flex-direction: column; }
    .tl-item { display: flex; gap: 20px; padding-bottom: 24px; position: relative; }
    .tl-item:not(:last-child)::before { content: ''; position: absolute; left: 15px; top: 36px; bottom: 0; width: 1px; background: var(--line-200); }
    .tl-marker { flex-shrink: 0; position: relative; z-index: 1; padding-top: 2px; }
    .tl-content { flex: 1; min-width: 0; background: var(--color-surface); border: 1px solid var(--line-200); border-radius: var(--radius-md); padding: 20px; transition: border-color var(--transition); }
    .tl-content:hover { border-color: var(--ink-700); }
    .tl-head { display: flex; justify-content: space-between; align-items: center; gap: 10px; margin-bottom: 4px; }
    .tl-head h3 { font-size: var(--text-base); margin: 0; }
    .tl-note { flex-shrink: 0; font-size: var(--text-sm); font-weight: 600; color: var(--verify-500); font-family: var(--font-mono); }
    .tl-meta { font-size: var(--text-sm); color: var(--ink-700); margin-bottom: 8px; }
    .tl-livrables { font-size: var(--text-sm); }
    .tl-livrables strong { display: block; font-size: var(--text-xs); text-transform: uppercase; letter-spacing: 0.04em; color: var(--ink-700); margin-bottom: 4px; }
    .tl-livrables ul { margin: 0 0 0 16px; padding: 0; }
    .tl-livrables li { margin-bottom: 2px; color: var(--ink-700); }

    @media (max-width: 768px) {
      .profile-hero { flex-direction: column; text-align: center; padding: 24px; }
      .profile-stats { justify-content: center; }
    }
  `]
})
export class ProfilCertifieComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);
  membre = signal<any>(null);
  missions = signal<any[]>([]);
  validations = signal<any[]>([]);
  loading = signal(true);

  get competenceValidees() {
    return (this.validations() || []).filter((v: any) => v.valideeParMission);
  }
  get competenceDeclaratives() {
    return (this.validations() || []).filter((v: any) => !v.valideeParMission);
  }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) { this.loading.set(false); return; }
    this.http.get<any>(`/api/membres/${id}`).subscribe({
      next: m => this.membre.set(m),
      error: () => this.loading.set(false),
    });
    this.http.get<any[]>(`/api/placements/missions?membreId=${id}`).subscribe({
      next: list => this.missions.set(list),
    });
    this.http.get<any[]>(`/api/placements/validations?membreId=${id}`).subscribe({
      next: list => this.validations.set(list),
      complete: () => this.loading.set(false),
    });
  }
}
