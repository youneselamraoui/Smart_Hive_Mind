import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { DatePipe } from '@angular/common';
import { ProfilCertifieService, ProfilCertifie } from '../../features/profil-certifie/profil-certifie.service';
import { IdenticonComponent } from '../../core/identicon.component';
import { SafeHtmlPipe } from '../../core/safe-html.pipe';

const BADGE_ICONS: Record<string, string> = {
  innovateur: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M9 18h6"/><path d="M10 22h4"/><path d="M15.09 14c.58-.68.91-1.55.91-2.5a4 4 0 0 0-8 0c0 .95.33 1.82.91 2.5"/><path d="M12 2v1"/><path d="M4.93 4.93l.71.71"/><path d="M2 12h1"/></svg>`,
  collaborateur: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  expert: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg>`,
  mentor: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>`,
  contributeur: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><line x1="6" y1="3" x2="6" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/></svg>`,
  leader: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M2 20h20"/><path d="M4 20V8l4 4 4-8 4 8 4-4v12"/></svg>`,
};

@Component({
  selector: 'app-member-profile',
  standalone: true,
  imports: [RouterLink, DatePipe, IdenticonComponent, SafeHtmlPipe],
  template: `
    <div class="page">
      <div class="page-head"><div><h1>Profil membre</h1></div></div>

      @if (loading()) {
        <div class="skel-k"><div class="skel-line w-60"></div><div class="skel-line w-40"></div></div>
      } @else { @if (membre(); as m) {
        <div class="hero">
          <div class="hero-identicon"><app-identicon [id]="m._id" [name]="m.prenom + ' ' + m.nom"></app-identicon></div>
          <div class="hero-info">
            <h2>{{ m.prenom }} {{ m.nom }}</h2>
            <span class="role-tag" [class]="'role--' + (m.role || 'etudiant')">{{ m.role }}</span>
            <p class="hero-email">{{ m.email }}</p>
            <div class="reputation">
              <span class="rep-label">Réputation</span>
              <div class="rep-bar"><div class="rep-fill" [style.width.%]="m.reputationScore || 0"></div></div>
              <span class="rep-val">{{ m.reputationScore || 0 }}/100</span>
            </div>
          </div>
        </div>

        @if (m.badges?.length) {
          <div class="badges-section">
            <h3>Badges</h3>
            <div class="badges-grid">
              @for (b of m.badges; track b._id) {
                <div class="badge-item">
                  <div class="badge-icon" [innerHTML]="badgeIcon(b.type) | safeHtml"></div>
                  <div><strong>{{ b.type }}</strong>@if (b.justification) { <p>{{ b.justification }}</p> }<small>{{ b.createdAt | date:'dd MMM yyyy' }}</small></div>
                </div>
              }
            </div>
          </div>
        }

        @if (profil(); as pc) {
          @if (pc.competencesValidees.length || pc.formationsSuivies.length || pc.historiqueMissions.length || pc.oeuvresProuvees.length || pc.reputationScore > 0) {
            <section class="certified-section">
              <div class="certified-head">
                <h3>Profil certifié</h3>
                <div class="certified-ring">
                  <svg viewBox="0 0 36 36" width="64" height="64">
                    <circle cx="18" cy="18" r="15.5" fill="none" stroke="var(--line-200)" stroke-width="2.5"/>
                    <circle cx="18" cy="18" r="15.5" fill="none" stroke="var(--verify-500)" stroke-width="2.5"
                      stroke-dasharray="97.4" [attr.stroke-dashoffset]="97.4 - (97.4 * pc.reputationScore / 100)"
                      stroke-linecap="round" transform="rotate(-90 18 18)"/>
                    <text x="18" y="18" text-anchor="middle" dy="4" font-size="7" font-weight="700" fill="var(--ink-900)">{{ pc.reputationScore }}</text>
                  </svg>
                  <span class="ring-label">Réputation certifiée</span>
                </div>
              </div>

              @if (pc.competencesValidees.length) {
                <div class="certified-block">
                  <h4>Compétences validées</h4>
                  <div class="certified-list">
                    @for (c of pc.competencesValidees; track $index) {
                      <div class="certified-item">
                        <div class="ci-main"><strong>{{ c.competence }}</strong>@if (c.missionId?.titre) { <span class="ci-src">via {{ c.missionId.titre }}</span> }</div>
                        <div class="ci-meta">
                          @if (c.note !== undefined && c.note !== null) { <span class="ci-note">{{ c.note }}/5</span> }
                          @if (c.validePar?.prenom || c.validePar?.nom) { <span class="ci-who">{{ c.validePar.prenom }} {{ c.validePar.nom }}</span> }
                          @if (c.date) { <span class="ci-date">{{ c.date | date:'dd MMM yyyy' }}</span> }
                        </div>
                      </div>
                    }
                  </div>
                </div>
              }

              @if (pc.formationsSuivies.length) {
                <div class="certified-block">
                  <h4>Formations suivies</h4>
                  <div class="certified-list">
                    @for (f of pc.formationsSuivies; track $index) {
                      <div class="certified-item">
                        <div class="ci-main"><strong>{{ f.formationId?.titre || 'Formation #' + (f.formationId || '?') }}</strong></div>
                        <div class="ci-meta">@if (f.dateCompletion) { <span class="ci-date">{{ f.dateCompletion | date:'dd MMM yyyy' }}</span> }</div>
                      </div>
                    }
                  </div>
                </div>
              }

              @if (pc.historiqueMissions.length) {
                <div class="certified-block">
                  <h4>Historique des missions</h4>
                  <div class="certified-list">
                    @for (h of pc.historiqueMissions; track $index) {
                      <div class="certified-item">
                        <div class="ci-main"><strong>{{ h.missionId?.titre || 'Mission #' + (h.missionId || '?') }}</strong></div>
                        <div class="ci-meta">@if (h.evaluationClient !== undefined && h.evaluationClient !== null) { <span class="ci-note">{{ h.evaluationClient }}/5</span> }</div>
                      </div>
                    }
                  </div>
                </div>
              }

              @if (pc.oeuvresProuvees.length) {
                <div class="certified-block">
                  <h4>Œuvres prouvées</h4>
                  <div class="certified-list">
                    @for (o of pc.oeuvresProuvees; track $index) {
                      @if (o.publicationId?._id) {
                        <a class="certified-item certified-link" routerLink="/publications/{{ o.publicationId._id }}">
                          <div class="ci-main"><strong>{{ o.publicationId.titre || 'Publication #' + o.publicationId._id }}</strong></div>
                        </a>
                      }
                    }
                  </div>
                </div>
              }
            </section>
          } @else {
            <section class="certified-section certified-empty">
              <h3>Profil certifié</h3>
              <p>Ce membre n'a pas encore de profil certifié.</p>
            </section>
          }
        }
      } }
    </div>
  `,
  styles: [`
    :host { display: block; }
    .page-head { margin-bottom: 24px; }
    .page-head h1 { font-size: var(--text-2xl); margin: 0; }

    .skel-k { display: flex; flex-direction: column; gap: 12px; }
    .skel-line { height: 14px; border-radius: 6px; background: var(--line-200); animation: sh 1.5s infinite; }
    .w-60 { width: 60%; } .w-40 { width: 40%; }
    @keyframes sh { 0%{opacity:0.5} 50%{opacity:1} 100%{opacity:0.5} }

    .hero { display: flex; gap: 24px; align-items: center; background: var(--color-surface); border: 1px solid var(--line-200); border-radius: var(--radius-md); padding: 28px; margin-bottom: 28px; }
    .hero-identicon { width: 64px; height: 64px; flex-shrink: 0; border-radius: 50%; overflow: hidden; background: var(--paper-50); }
    .hero-identicon :deep(svg) { width: 100%; height: 100%; display: block; }
    .hero-info { flex: 1; }
    .hero-info h2 { margin: 0 0 6px; font-size: var(--text-xl); }
    .hero-email { margin: 4px 0 0; font-size: var(--text-sm); color: var(--ink-700); font-family: var(--font-mono); }
    .role-tag { display: inline-block; font-size: var(--text-xs); font-weight: 600; text-transform: capitalize; padding: 2px 10px; border-radius: 999px; }
    .role--etudiant { background: rgba(91,79,224,0.1); color: var(--agentic-500); }
    .role--encadrant { background: rgba(31,158,109,0.1); color: var(--verify-500); }
    .role--admin { background: rgba(196,67,46,0.1); color: var(--alert-500); }
    .role--organisation { background: rgba(217,160,43,0.1); color: var(--honey-600); }
    .reputation { display: flex; align-items: center; gap: 10px; margin-top: 10px; }
    .rep-label { font-size: var(--text-xs); color: var(--ink-700); white-space: nowrap; }
    .rep-bar { flex: 1; height: 6px; background: var(--line-200); border-radius: 999px; overflow: hidden; }
    .rep-fill { height: 100%; background: var(--honey-500); border-radius: 999px; transition: width 0.3s; }
    .rep-val { font-size: var(--text-xs); font-weight: 600; white-space: nowrap; font-family: var(--font-mono); }

    .badges-section { background: var(--color-surface); border: 1px solid var(--line-200); border-radius: var(--radius-md); padding: 24px; }
    .badges-section h3 { font-size: var(--text-base); margin: 0 0 16px; }
    .badges-grid { display: flex; flex-direction: column; gap: 10px; }
    .badge-item { display: flex; gap: 12px; align-items: flex-start; padding: 12px; background: var(--paper-50); border-radius: var(--radius-sm); }
    .badge-icon { width: 32px; height: 32px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; color: var(--honey-600); }
    .badge-icon :deep(svg) { width: 20px; height: 20px; }
    .badge-item strong { text-transform: capitalize; font-size: var(--text-sm); display: block; }
    .badge-item p { margin: 2px 0; font-size: var(--text-xs); color: var(--ink-700); }
    .badge-item small { font-size: var(--text-xs); color: var(--ink-700); }

    .certified-section { background: var(--color-surface); border: 1px solid var(--line-200); border-radius: var(--radius-md); padding: 24px; margin-top: 24px; }
    .certified-head { display: flex; justify-content: space-between; align-items: center; gap: 16px; margin-bottom: 20px; }
    .certified-head h3 { font-size: var(--text-base); margin: 0; }
    .certified-ring { display: flex; flex-direction: column; align-items: center; gap: 4px; flex-shrink: 0; }
    .ring-label { font-size: var(--text-xs); color: var(--ink-700); white-space: nowrap; }
    .certified-block { margin-bottom: 20px; }
    .certified-block:last-child { margin-bottom: 0; }
    .certified-block h4 { font-size: var(--text-xs); font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; color: var(--ink-700); margin: 0 0 10px; }
    .certified-list { display: flex; flex-direction: column; gap: 8px; }
    .certified-item { display: flex; justify-content: space-between; align-items: center; gap: 12px; padding: 12px; background: var(--paper-50); border-radius: var(--radius-sm); text-decoration: none; color: var(--ink-900); }
    .ci-main { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
    .ci-main strong { font-size: var(--text-sm); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .ci-src { font-size: var(--text-xs); color: var(--ink-700); }
    .ci-meta { display: flex; align-items: center; gap: 10px; flex-shrink: 0; font-size: var(--text-xs); color: var(--ink-700); }
    .ci-note { font-weight: 600; color: var(--verify-500); font-family: var(--font-mono); }
    .ci-who { font-size: var(--text-xs); }
    .ci-date { font-size: var(--text-xs); font-family: var(--font-mono); }
    .certified-link:hover { border: 1px solid var(--line-200); box-shadow: 0 1px 3px rgba(16,19,31,0.06); }
    .certified-link:hover strong { color: var(--honey-600); }
    .certified-empty p { margin: 0; font-size: var(--text-sm); color: var(--ink-700); font-style: italic; }
  `]
})
export class MemberProfileComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);
  private profilService = inject(ProfilCertifieService);
  membre = signal<any>(null);
  profil = signal<ProfilCertifie | null>(null);
  loading = signal(true);
  badgeIcon(t: string) { return BADGE_ICONS[t] || BADGE_ICONS['innovateur']; }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) { this.loading.set(false); return; }
    this.http.get<any>('/api/membres/' + id).subscribe({
      next: m => { this.membre.set(m); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
    this.profilService.getByMembreId(id).subscribe({
      next: p => this.profil.set(p),
      error: () => {},
    });
  }
}
