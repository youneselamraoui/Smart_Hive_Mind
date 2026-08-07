import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-projet-detail',
  standalone: true,
  imports: [DatePipe, RouterLink],
  template: `
    @if (loading()) {
      <div class="page"><div class="skel-k"><div class="skel-line w-50"></div><div class="skel-line w-80"></div><div class="skel-line w-60"></div></div></div>
    } @else { @if (p()) {
      <div class="page">
        <div class="page-head"><div><h1>{{ p().titre }}</h1></div></div>

        <div class="timeline">
          @for (step of statusSteps; track step.key) {
            <div class="tl-step" [class.active]="isActive(step.key)" [class.done]="isDone(step.key)" [class.fail]="step.key === 'abandonne' && p().statut === 'abandonne'"
              [style.cursor]="step.key === 'termine' || step.key === 'abandonne' ? 'default' : ''">
              <div class="tl-pastille">
                @if (isDone(step.key)) { <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg> }
                @if (isActive(step.key) && !isDone(step.key)) { <span class="tl-pulse"></span> }
              </div>
              <div class="tl-content"><span class="tl-label">{{ step.label }}</span><span class="tl-date">{{ p().dates?.[step.key] | date:'dd MMM' }}</span></div>
            </div>
          }
        </div>

        <div class="detail-grid">
          <div class="col-main">
            <h3>Description</h3>
            <p class="desc">{{ p().description }}</p>
            <h3>Objectifs</h3>
            <p class="desc">{{ p().objectifs || 'Non renseigné' }}</p>
          </div>
          <div class="col-side">
            <div class="card-side">
              <h4>Informations</h4>
              <div class="side-row"><span>Porteur</span>
                @if (porteur()?._id) {
                  <a class="membre-link" [routerLink]="['/app', 'membre', porteur()._id]">{{ porteur()?.prenom }} {{ porteur()?.nom }}</a>
                } @else {
                  <b>Non renseigné</b>
                }
              </div>
              <div class="side-row"><span>Équipe</span><b>{{ p().equipe?.length || 0 }} membre(s)</b></div>
              @if (p().equipe?.length) {
                <div class="equipe-list">
                  @for (m of p().equipe; track m._id) {
                    <a class="membre-link" [routerLink]="['/app', 'membre', m._id]">{{ m.prenom }} {{ m.nom }}</a>
                  }
                </div>
              }
              <div class="side-row"><span>Statut</span><b class="statut-tag" [class]="'statut--' + p().statut">{{ p().statut }}</b></div>
            </div>
          </div>
        </div>
      </div>
    } }
  `,
  styles: [`
    .page { position: relative; }
    .page-head { margin-bottom: 28px; }
    .page-head h1 { font-size: var(--text-2xl); margin: 0; }

    .skel-k { display: flex; flex-direction: column; gap: 12px; padding: 40px 0; }
    .skel-line { height: 14px; border-radius: 6px; background: var(--line-200); animation: sh 1.5s infinite; }
    .w-50 { width: 50%; } .w-80 { width: 80%; } .w-60 { width: 60%; }
    @keyframes sh { 0%{opacity:0.5} 50%{opacity:1} 100%{opacity:0.5} }

    .timeline { display: flex; align-items: flex-start; justify-content: space-between; gap: 0; margin-bottom: 32px; position: relative; padding: 0 0 12px; }
    .timeline::before { content: ''; position: absolute; top: 14px; left: 0; right: 0; height: 2px; background: var(--line-200); z-index: 0; }
    .tl-step { display: flex; flex-direction: column; align-items: center; gap: 6px; flex: 1; position: relative; z-index: 1; }
    .tl-pastille { width: 28px; height: 28px; border-radius: 50%; background: var(--color-surface); border: 2px solid var(--line-200); display: flex; align-items: center; justify-content: center; transition: all var(--transition); }
    .tl-step.done .tl-pastille { background: var(--verify-500); border-color: var(--verify-500); color: white; }
    .tl-step.active .tl-pastille { border-color: var(--honey-500); box-shadow: 0 0 0 3px rgba(217,160,43,0.2); }
    .tl-step.fail .tl-pastille { background: var(--alert-500); border-color: var(--alert-500); color: white; }
    .tl-pulse { width: 8px; height: 8px; border-radius: 50%; background: var(--honey-500); animation: pulse 1.5s infinite; }
    @keyframes pulse { 0%{opacity:1;transform:scale(1)} 50%{opacity:0.6;transform:scale(1.4)} 100%{opacity:1;transform:scale(1)} }
    .tl-content { display: flex; flex-direction: column; align-items: center; gap: 2px; }
    .tl-label { font-size: var(--text-xs); font-weight: 600; color: var(--ink-700); white-space: nowrap; }
    .tl-date { font-size: var(--text-xs); color: var(--ink-700); }

    .detail-grid { display: grid; grid-template-columns: 1fr 280px; gap: 28px; }
    .col-main h3 { font-size: var(--text-base); margin: 24px 0 10px; }
    .col-main h3:first-child { margin-top: 0; }
    .desc { font-size: var(--text-sm); color: var(--ink-700); line-height: 1.6; margin: 0; }

    .card-side { background: var(--color-surface); border: 1px solid var(--line-200); border-radius: var(--radius-md); padding: 20px; display: flex; flex-direction: column; gap: 12px; }
    .card-side h4 { font-size: var(--text-sm); margin: 0; }
    .side-row { display: flex; justify-content: space-between; align-items: center; font-size: var(--text-sm); }
    .side-row span { color: var(--ink-700); }
    .side-row b { font-weight: 600; }
    .membre-link { font-weight: 600; color: var(--ink-900); text-decoration: none; transition: color var(--transition); }
    .membre-link:hover { color: var(--honey-600); }
    .equipe-list { display: flex; flex-direction: column; gap: 6px; border-top: 1px solid var(--line-200); padding-top: 12px; }

    .statut-tag { font-size: var(--text-xs); font-weight: 600; text-transform: uppercase; padding: 2px 10px; border-radius: 999px; }
    .statut--planification { background: rgba(91,79,224,0.1); color: var(--agentic-500); }
    .statut--en_cours { background: rgba(217,160,43,0.1); color: var(--honey-600); }
    .statut--termine { background: rgba(31,158,109,0.1); color: var(--verify-500); }
    .statut--abandonne { background: rgba(196,67,46,0.1); color: var(--alert-500); }

    @media (max-width: 768px) { .detail-grid { grid-template-columns: 1fr; } .tl-label { font-size: 10px; } }
  `]
})
export class ProjetDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);
  p = signal<any>(null);
  loading = signal(true);
  porteur = computed(() => this.p()?.porteur ?? this.p()?.equipe?.[0] ?? null);

  statusSteps = [
    { key: 'planification', label: 'Planification' },
    { key: 'en_cours', label: 'En cours' },
    { key: 'termine', label: 'Terminé' },
    { key: 'abandonne', label: 'Abandonné' },
  ];

  order = ['planification', 'en_cours', 'termine', 'abandonne'];

  isDone(k: string) {
    const s = this.p()?.statut;
    if (s === 'abandonne') return k === 'abandonne';
    return this.order.indexOf(k) <= this.order.indexOf(s);
  }
  isActive(k: string) { return this.p()?.statut === k; }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) { this.loading.set(false); return; }
    this.http.get<any>('/api/entrepreneuriat/projets/' + id).subscribe({
      next: p => this.p.set(p),
      error: () => this.loading.set(false),
      complete: () => this.loading.set(false),
    });
  }
}
