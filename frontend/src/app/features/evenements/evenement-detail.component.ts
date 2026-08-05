import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HexSealComponent } from '../../core/hex-seal.component';
import { ToastService } from '../../core/toast.service';

const TYPE_LABELS: Record<string, string> = {
  hackathon: 'Hackathon',
  congres: 'Congrès',
  salon: 'Salon',
  concours: 'Concours',
};

interface ProgrammeItem {
  intitule: string;
  heure: string;
  description?: string;
}

@Component({
  selector: 'app-evenement-detail',
  standalone: true,
  imports: [DatePipe, FormsModule, HexSealComponent],
  template: `
    @if (loading()) {
      <div class="skel-k"><div class="skel-line w-50"></div><div class="skel-line w-80"></div></div>
    } @else { @if (e(); as ev) {
      <div class="banner">
        <span class="banner-type">{{ TYPE_LABELS[ev.type] || ev.type }}</span>
        <h1 class="banner-title">{{ ev.titre }}</h1>
        <div class="banner-dates">{{ ev.dates.debut | date:'dd MMM yyyy' }} — {{ ev.dates.fin | date:'dd MMM yyyy' }}</div>
      </div>

      <div class="body">
        <div class="col-main">
          <section class="section-block">
            <h2>Programme</h2>
            @if (ev.programme?.length) {
              <div class="schedule">
                @for (p of ev.programme; track $index) {
                  <div class="sch-row" [class.sch-row--owner]="isOrganisateur(ev)">
                    <span class="sch-time">{{ p.heure }}</span>
                    <span class="sch-label">
                      <strong>{{ p.intitule }}</strong>
                      @if (p.description) { <br /><span class="sch-desc">{{ p.description }}</span> }
                    </span>
                    @if (isOrganisateur(ev)) {
                      <button class="sch-del" (click)="supprimerProgramme(ev._id, $index)" title="Supprimer">&times;</button>
                    }
                  </div>
                }
              </div>
            } @else {
              <p class="empty">Aucun programme défini.</p>
            }
            @if (isOrganisateur(ev)) {
              <div class="prog-add">
                <input class="input input--sm" [(ngModel)]="progHeure" placeholder="Heure (ex: 14:00)" />
                <input class="input input--sm" [(ngModel)]="progIntitule" placeholder="Intitulé" />
                <button class="btn btn-xs" [disabled]="!progHeure.trim() || !progIntitule.trim() || progSubmitting()" (click)="ajouterProgramme(ev._id)">{{ progSubmitting() ? '…' : '+' }}</button>
              </div>
            }
          </section>

          @if (ev.type === 'hackathon' && oeuvres().length) {
            <section class="section-block">
              <h2>Œuvres soumises</h2>
              <div class="oeuvres">
                @for (o of oeuvres(); track o._id) {
                  <div class="oeuvre-card">
                    <div class="oeuvre-head">
                      <h3>{{ o.titre }}</h3>
                      @if (o.preuve?.statut === 'ancre') {
                        <app-hex-seal status="valide" [size]="28"></app-hex-seal>
                      }
                    </div>
                    <p class="oeuvre-desc">{{ o.contenu }}</p>
                    <span class="oeuvre-author">par {{ o.auteur?.prenom }} {{ o.auteur?.nom }}</span>
                  </div>
                }
              </div>
            </section>
          }
        </div>

        <div class="col-side">
          <div class="side-card">
            <div class="inscription-block">
              @if (!inscrit()) {
                <button class="btn btn-primary btn-full" (click)="inscrire()" [disabled]="plein()">
                  S'inscrire
                </button>
              } @else {
                <div class="msg-ok">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                  Vous êtes inscrit
                </div>
              }
              @if (ev.capaciteMax) {
                <div class="capacity-bar">
                  <div class="cap-fill" [style.width.%]="capPct(ev)"></div>
                </div>
                <span class="capacity-label">{{ ev.inscrits?.length || 0 }}/{{ ev.capaciteMax }} places</span>
              }
            </div>
            @if (inscrit() && ev.type === 'hackathon') {
              <div class="soumettre-block">
                <hr class="divider" />
                <button class="btn btn-outline btn-full" (click)="showSoumettre.set(!showSoumettre())">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
                  {{ showSoumettre() ? 'Annuler' : "Soumettre mon œuvre" }}
                </button>
                @if (showSoumettre()) {
                  <div class="soumettre-form">
                    <input class="input" [(ngModel)]="souTitre" placeholder="Titre de l'œuvre" />
                    <textarea class="input input--ta" [(ngModel)]="souDesc" rows="3" placeholder="Description…"></textarea>
                    <button class="btn btn-primary btn-full" [disabled]="!souTitre.trim() || !souDesc.trim() || submitting()" (click)="soumettre()">
                      {{ submitting() ? 'Envoi…' : 'Soumettre' }}
                    </button>
                    <p class="protection-note">Les projets soumis sont automatiquement protégés par tatouage numérique.</p>
                  </div>
                }
              </div>
            }
          </div>
        </div>
      </div>
    } }
  `,
  styles: [`
    :host { display: block; }
    .skel-k { display: flex; flex-direction: column; gap: 12px; padding: 40px 0; }
    .skel-line { height: 14px; border-radius: 6px; background: var(--line-200); animation: sh 1.5s infinite; }
    .w-50 { width: 50%; } .w-80 { width: 80%; }
    @keyframes sh { 0%{opacity:0.5} 50%{opacity:1} 100%{opacity:0.5} }

    .banner { background: var(--ink-900); border-radius: var(--radius-md); padding: 36px; margin-bottom: 28px; }
    .banner-type { display: inline-block; font-size: var(--text-xs); font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: var(--indigo-500); margin-bottom: 8px; }
    .banner-title { font-family: var(--font-display); font-size: var(--text-2xl); font-weight: 600; color: var(--paper-50); margin: 0 0 6px; line-height: 1.2; }
    .banner-dates { font-size: var(--text-sm); color: rgba(246,245,242,0.6); }

    .body { display: grid; grid-template-columns: 1fr 280px; gap: 28px; }
    .section-block { margin-bottom: 32px; }
    .section-block h2 { font-size: var(--text-lg); margin: 0 0 16px; }

    .schedule { display: flex; flex-direction: column; }
    .sch-row { display: flex; gap: 16px; padding: 10px 0; position: relative; align-items: baseline; }
    .sch-row:not(:last-child)::before { content: ''; position: absolute; left: 44px; top: 28px; bottom: 0; width: 1px; background: var(--line-200); }
    .sch-row--owner { padding-right: 30px; }
    .sch-time { flex-shrink: 0; width: 40px; font-family: var(--font-mono); font-size: var(--text-sm); color: var(--indigo-500); text-align: right; }
    .sch-label { flex: 1; font-size: var(--text-sm); color: var(--ink-900); padding-left: 12px; border-left: 1px solid var(--line-200); }
    .sch-label strong { font-weight: 600; }
    .sch-desc { font-size: var(--text-xs); color: var(--ink-600); }
    .sch-del { position: absolute; right: 0; top: 50%; transform: translateY(-50%); background: none; border: none; color: var(--ink-400); cursor: pointer; font-size: 1.1rem; padding: 2px 6px; border-radius: 4px; transition: all var(--transition); line-height: 1; }
    .sch-del:hover { color: var(--error-500); background: rgba(196,67,46,0.08); }
    .empty { font-size: var(--text-sm); color: var(--ink-500); font-style: italic; margin: 0; }
    .prog-add { display: flex; gap: 6px; margin-top: 12px; flex-wrap: wrap; }
    .input--sm { padding: 6px 10px; font-size: var(--text-xs); max-width: 140px; }
    .btn-xs { padding: 6px 12px; font-size: var(--text-xs); border-radius: var(--radius-sm); border: none; background: var(--indigo-500); color: #fff; font-weight: 600; cursor: pointer; transition: background var(--transition); }
    .btn-xs:disabled { opacity: 0.4; cursor: not-allowed; }
    .btn-xs:hover:not(:disabled) { background: var(--indigo-600); }

    .oeuvres { display: flex; flex-direction: column; gap: 12px; }
    .oeuvre-card { background: var(--color-surface); border: 1px solid var(--line-200); border-radius: var(--radius-md); padding: 20px; }
    .oeuvre-head { display: flex; justify-content: space-between; align-items: center; gap: 10px; margin-bottom: 6px; }
    .oeuvre-head h3 { font-size: var(--text-base); margin: 0; }
    .oeuvre-desc { font-size: var(--text-sm); color: var(--ink-700); margin: 0 0 6px; line-height: 1.5; }
    .oeuvre-author { font-size: var(--text-xs); color: var(--ink-700); }

    .col-side { display: flex; flex-direction: column; gap: 16px; }
    .side-card { background: var(--color-surface); border: 1px solid var(--line-200); border-radius: var(--radius-md); padding: 24px; position: sticky; top: 20px; }

    .inscription-block { display: flex; flex-direction: column; gap: 8px; }
    .btn { display: inline-flex; align-items: center; justify-content: center; gap: 6px; padding: 10px 20px; border-radius: var(--radius-sm); font-family: var(--font-body); font-size: var(--text-sm); font-weight: 600; cursor: pointer; transition: all var(--transition); border: none; }
    .btn:disabled { opacity: 0.4; cursor: not-allowed; }
    .btn-full { width: 100%; }
    .btn-primary { background: var(--indigo-500); color: #fff; }
    .btn-primary:hover:not(:disabled) { background: var(--indigo-600); }
    .btn-outline { background: none; border: 1px solid var(--line-200); color: var(--ink-900); }
    .btn-outline:hover { border-color: var(--indigo-500); }

    .msg-ok { display: flex; align-items: center; gap: 6px; padding: 10px 14px; border-radius: var(--radius-sm); background: rgba(31,158,109,0.08); border: 1px solid rgba(31,158,109,0.15); color: var(--verify-500); font-size: var(--text-sm); font-weight: 500; justify-content: center; }

    .capacity-bar { height: 6px; background: var(--line-200); border-radius: 999px; overflow: hidden; }
    .cap-fill { height: 100%; background: var(--indigo-500); border-radius: 999px; transition: width 0.6s ease; }
    .capacity-label { font-family: var(--font-mono); font-size: var(--text-xs); color: var(--ink-700); text-align: center; }

    .divider { border: none; border-top: 1px solid var(--line-200); margin: 16px 0; }
    .soumettre-block { display: flex; flex-direction: column; gap: 10px; }
    .soumettre-form { display: flex; flex-direction: column; gap: 8px; }
    .input { padding: 10px 14px; border: 1px solid var(--line-200); border-radius: var(--radius-sm); font-family: var(--font-body); font-size: var(--text-sm); outline: none; background: var(--color-surface); color: var(--ink-900); transition: border-color var(--transition); }
    .input:focus { border-color: var(--indigo-500); }
    .input--ta { resize: vertical; min-height: 60px; }
    .protection-note { font-size: var(--text-xs); color: var(--ink-700); font-style: italic; margin: 0; text-align: center; }

    @media (max-width: 768px) {
      .body { grid-template-columns: 1fr; }
      .banner { padding: 24px; }
      .banner-title { font-size: var(--text-xl); }
    }
  `]
})
export class EvenementDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);
  private toast = inject(ToastService);
  e = signal<any>(null);
  oeuvres = signal<any[]>([]);
  loading = signal(true);
  inscrit = signal(false);
  showSoumettre = signal(false);
  submitting = signal(false);
  souTitre = '';
  souDesc = '';
  membreId = localStorage.getItem('membreId') || '';
  TYPE_LABELS = TYPE_LABELS;

  plein() {
    const ev = this.e();
    return ev && ev.capaciteMax && ev.inscrits?.length >= ev.capaciteMax;
  }

  capPct(ev: any): number {
    if (!ev.capaciteMax) return 0;
    return Math.min(100, Math.round(((ev.inscrits?.length || 0) / ev.capaciteMax) * 100));
  }

  progHeure = '';
  progIntitule = '';
  progSubmitting = signal(false);

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) { this.loading.set(false); return; }
    this.http.get<any>('/api/evenements/' + id).subscribe({
      next: ev => {
        this.e.set(ev);
        this.inscrit.set(ev.inscrits?.some((m: any) => (m._id || m) === this.membreId) || false);
        this.oeuvres.set(ev.oeuvresSoumises || []);
      },
      error: () => this.loading.set(false),
      complete: () => this.loading.set(false),
    });
  }

  isOrganisateur(ev: any): boolean {
    return ev.organisateurId?._id === this.membreId || ev.organisateurId === this.membreId;
  }

  ajouterProgramme(evenementId: string) {
    if (!this.progHeure.trim() || !this.progIntitule.trim()) return;
    this.progSubmitting.set(true);
    this.http.post<any>('/api/evenements/' + evenementId + '/programme', {
      heure: this.progHeure,
      intitule: this.progIntitule,
    }).subscribe({
      next: r => {
        this.e.update(ev => ({ ...ev, programme: r.programme }));
        this.progHeure = '';
        this.progIntitule = '';
        this.progSubmitting.set(false);
        this.toast.success('Élément ajouté au programme.');
      },
      error: err => { this.progSubmitting.set(false); this.toast.error(err.error?.error || 'Erreur.'); },
    });
  }

  supprimerProgramme(evenementId: string, index: number) {
    this.http.delete('/api/evenements/' + evenementId + '/programme/' + index).subscribe({
      next: r => {
        this.e.update(ev => ({ ...ev, programme: (r as any).programme }));
        this.toast.success('Élément supprimé.');
      },
      error: err => this.toast.error(err.error?.error || 'Erreur.'),
    });
  }

  inscrire() {
    const id = this.e()._id;
    this.http.post<any>('/api/evenements/inscrire', { evenementId: id }).subscribe({
      next: (res) => {
        this.inscrit.set(true);
        this.e.set(res.evenement || { ...this.e(), inscrits: [...(this.e().inscrits || []), { _id: this.membreId }] });
        this.toast.success('Inscription confirmée.');
      },
      error: err => this.toast.error(err.error?.error || 'Erreur lors de l\'inscription.'),
    });
  }

  soumettre() {
    if (!this.souTitre.trim() || !this.souDesc.trim()) return;
    this.submitting.set(true);
    this.http.post<any>('/api/evenements/soumettre', {
      evenementId: this.e()._id,
      titre: this.souTitre,
      contenu: this.souDesc,
    }).subscribe({
      next: (o) => {
        this.oeuvres.update(list => [...list, o]);
        this.souTitre = '';
        this.souDesc = '';
        this.showSoumettre.set(false);
        this.submitting.set(false);
        this.toast.success('Œuvre soumise — protégée par tatouage numérique.');
      },
      error: err => { this.submitting.set(false); this.toast.error(err.error?.error || 'Erreur.'); },
    });
  }
}
