// Atelier neuro-symbolique — périmètre volontairement restreint aux règles stables
// d'évaluation de publication, cohérent avec le commentaire de
// backend/src/controllers/atelierNeuroSymboliqueController.js (synthèse IA v1 §2.7).
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../core/toast.service';
import {
  AtelierNeuroSymboliqueService,
  Regle,
  TestResult,
  AtelierStatus,
} from './atelier-neuro-symbolique.service';

@Component({
  selector: 'app-atelier-neuro-symbolique',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="page">
      <a routerLink="/smart-tools" class="back-link">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="15 18 9 12 15 6"/></svg>
        Smart Tools
      </a>
      <h1>Atelier neuro-symbolique</h1>
      <p class="scope-note">Périmètre volontairement restreint aux règles stables d'évaluation de publication (critères similarité, originalité, rigueur, complétude).</p>

      @if (loading()) {
        <div class="loading-center"><div class="spin"></div><span>Chargement…</span></div>
      } @else if (error(); as e) {
        <div class="error-box">{{ e }}</div>
        <div class="error-actions">
          <button class="btn btn-primary" [disabled]="creating()" (click)="creer()">
            {{ creating() ? 'Création…' : 'Créer un nouvel atelier' }}
          </button>
        </div>
      } @else if (!atelier(); as noAtelier) {
        <div class="start-card">
          <p>Vous n'avez pas encore d'atelier neuro-symbolique. Sa création initialise un jeu de règles par défaut copié côté serveur.</p>
          <button class="btn btn-primary" [disabled]="creating()" (click)="creer()">
            {{ creating() ? 'Création…' : 'Créer mon atelier' }}
          </button>
        </div>
      } @else { @let a = atelier()!;
        <div class="atelier-card">
          <div class="card-top">
            <span class="global-badge badge--{{ a.statut }}">
              <span class="badge-dot"></span>{{ statutLabel(a.statut) }}
            </span>
            <span class="id-ref">ID: {{ a.id }}</span>
          </div>

          <section class="block">
            <h2>Règles de l'atelier</h2>
            <p class="hint">Nom et condition sont en lecture seule ; le poids (0-1) et l'activation sont modifiables.</p>
            <div class="rules-list">
              @for (r of regles; track r.nom; let i = $index) {
                <div class="rule-row">
                  <div class="rule-info">
                    <strong>{{ r.nom }}</strong>
                    <code>{{ r.condition }}</code>
                  </div>
                  <span class="impact-badge" [class]="r.impactSiDeclenchee === 'positif' ? 'impact--positif' : 'impact--negatif'">
                    {{ r.impactSiDeclenchee === 'positif' ? 'Positif' : 'Négatif' }}
                  </span>
                  <label class="toggle">
                    <input type="checkbox" [(ngModel)]="r.actif" />
                    <span class="toggle-text">Actif</span>
                  </label>
                  <input class="poids-input" type="number" min="0" max="1" step="0.05" [(ngModel)]="r.poids" title="Poids (0-1)" />
                </div>
              }
            </div>
            <button class="btn btn-outline" [disabled]="savingRegles()" (click)="enregistrerRegles()">
              {{ savingRegles() ? 'Enregistrement…' : 'Enregistrer les règles' }}
            </button>
          </section>

          <section class="block">
            <h2>Tester les règles</h2>
            <p class="hint">Saisissez des scores entre 0 et 1 : similarité, originalité, rigueur, complétude.</p>
            <div class="test-form">
              <div class="test-field">
                <label for="similarite">Similarité</label>
                <input id="similarite" type="number" min="0" max="1" step="0.05" [(ngModel)]="scores.similarite" />
              </div>
              <div class="test-field">
                <label for="originalite">Originalité</label>
                <input id="originalite" type="number" min="0" max="1" step="0.05" [(ngModel)]="scores.originalite" />
              </div>
              <div class="test-field">
                <label for="rigueur">Rigueur</label>
                <input id="rigueur" type="number" min="0" max="1" step="0.05" [(ngModel)]="scores.rigueur" />
              </div>
              <div class="test-field">
                <label for="completude">Complétude</label>
                <input id="completude" type="number" min="0" max="1" step="0.05" [(ngModel)]="scores.completude" />
              </div>
            </div>
            <button class="btn btn-primary" [disabled]="testing()" (click)="tester()">
              {{ testing() ? 'Test en cours…' : 'Tester' }}
            </button>
          </section>

          @if (resultat(); as res) {
            <section class="block">
              <h2>Résultat du test</h2>
              <div class="result-summary">
                <span>Score global : <strong>{{ (res.scores.scoreGlobal * 100).toFixed(0) }}%</strong></span>
                <span>Règles déclenchées : <strong>{{ res.nbReglesDeclenchees }}</strong> / {{ res.nbReglesActives }} actives</span>
              </div>
              @if (res.justifications.length === 0) {
                <p class="empty-p">Aucune règle déclenchée pour ces scores.</p>
              } @else {
                <div class="justif-list">
                  @for (j of res.justifications; track $index) {
                    <div class="justif-item">
                      <span class="impact-badge" [class]="j.impact === 'positif' ? 'impact--positif' : 'impact--negatif'">
                        {{ j.impact === 'positif' ? 'Positif' : 'Négatif' }}
                      </span>
                      <div class="justif-body">
                        <strong>{{ j.regle }}</strong>
                        @if (j.valeur !== null && j.valeur !== undefined) {
                          <code>valeur: {{ j.valeur }}</code>
                        }
                        <p>{{ j.justification }}</p>
                      </div>
                    </div>
                  }
                </div>
              }
            </section>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    :host { display: block; }
    .page { max-width: 760px; }
    .back-link { display: inline-flex; align-items: center; gap: 6px; color: var(--ink-700); text-decoration: none; font-size: var(--text-sm); margin-bottom: 16px; }
    .back-link:hover { color: var(--agentic-500); }
    h1 { font-size: var(--text-xl); margin: 0 0 4px; }
    .scope-note { font-size: var(--text-xs); color: var(--ink-700); font-style: italic; margin: 0 0 20px; }

    .loading-center { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 60px 20px; color: var(--ink-700); }
    .spin { width: 24px; height: 24px; border: 2px solid var(--line-200); border-top-color: var(--agentic-500); border-radius: 50%; animation: sp 0.7s linear infinite; }
    @keyframes sp { to { transform: rotate(360deg); } }
    .error-box { background: var(--color-surface); border: 1px solid var(--alert-500); color: var(--alert-500); border-radius: var(--radius-md); padding: 24px; font-size: var(--text-sm); }
    .error-actions { margin-top: 16px; }

    .start-card, .atelier-card { background: var(--color-surface); border: 1px solid var(--line-200); border-radius: var(--radius-md); padding: 24px; }
    .start-card p { font-size: var(--text-sm); color: var(--ink-700); margin: 0 0 20px; }
    .card-top { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-bottom: 24px; flex-wrap: wrap; }
    .id-ref { font-size: var(--text-xs); color: var(--ink-700); font-family: var(--font-mono); }
    .global-badge { display: inline-flex; align-items: center; gap: 6px; font-size: var(--text-xs); font-weight: 700; text-transform: uppercase; padding: 4px 14px; border-radius: 999px; }
    .badge-dot { width: 6px; height: 6px; border-radius: 50%; }
    .badge--en_cours { background: rgba(91,79,224,0.1); color: var(--agentic-500); }
    .badge--en_cours .badge-dot { background: var(--agentic-500); animation: pulse-dot 1.5s ease-in-out infinite; }
    .badge--termine { background: rgba(31,158,109,0.1); color: var(--verify-500); }
    .badge--termine .badge-dot { background: var(--verify-500); }
    .badge--echec { background: rgba(196,67,46,0.1); color: var(--alert-500); }
    .badge--echec .badge-dot { background: var(--alert-500); }
    @keyframes pulse-dot { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(0.7)} }

    .block { margin-bottom: 28px; }
    .block:last-child { margin-bottom: 0; }
    .block h2 { font-size: var(--text-base); margin: 0 0 8px; }
    .hint { font-size: var(--text-xs); color: var(--ink-700); margin: 0 0 12px; }
    .empty-p { font-size: var(--text-sm); color: var(--ink-700); font-style: italic; margin: 0; }

    .rules-list { display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px; }
    .rule-row { display: flex; align-items: center; gap: 12px; padding: 12px; background: var(--paper-50); border-radius: var(--radius-sm); flex-wrap: wrap; }
    .rule-info { flex: 1; min-width: 200px; display: flex; flex-direction: column; gap: 2px; }
    .rule-info strong { font-size: var(--text-sm); }
    .rule-info code { font-size: var(--text-xs); color: var(--ink-700); font-family: var(--font-mono); }
    .impact-badge { display: inline-block; padding: 2px 10px; border-radius: 999px; font-size: var(--text-xs); font-weight: 600; white-space: nowrap; }
    .impact--positif { background: rgba(31,158,109,0.1); color: var(--verify-500); }
    .impact--negatif { background: rgba(196,67,46,0.1); color: var(--alert-500); }
    .toggle { display: inline-flex; align-items: center; gap: 6px; cursor: pointer; font-size: var(--text-xs); color: var(--ink-700); }
    .toggle-text { white-space: nowrap; }
    .poids-input { width: 76px; padding: 6px 8px; border: 1px solid var(--line-200); border-radius: var(--radius-sm); font-family: var(--font-mono); font-size: var(--text-sm); background: var(--color-surface); }

    .test-form { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 16px; }
    .test-field { display: flex; flex-direction: column; gap: 4px; }
    .test-field label { font-size: var(--text-xs); font-weight: 600; color: var(--ink-700); }
    .test-field input { padding: 8px 10px; border: 1px solid var(--line-200); border-radius: var(--radius-sm); font-family: var(--font-mono); font-size: var(--text-sm); background: var(--color-surface); }
    @media (max-width: 560px) { .test-form { grid-template-columns: repeat(2, 1fr); } }

    .result-summary { display: flex; gap: 24px; flex-wrap: wrap; font-size: var(--text-sm); color: var(--ink-700); margin-bottom: 12px; }
    .justif-list { display: flex; flex-direction: column; gap: 8px; }
    .justif-item { display: flex; gap: 12px; align-items: flex-start; padding: 12px; background: var(--paper-50); border-radius: var(--radius-sm); }
    .justif-item .impact-badge { margin-top: 2px; }
    .justif-body { flex: 1; min-width: 0; }
    .justif-body strong { font-size: var(--text-sm); display: block; }
    .justif-body code { font-size: var(--text-xs); color: var(--ink-700); font-family: var(--font-mono); }
    .justif-body p { margin: 4px 0 0; font-size: var(--text-xs); color: var(--ink-700); }

    .btn { display: inline-flex; align-items: center; gap: 8px; padding: 10px 22px; border: none; border-radius: var(--radius-md); font-family: var(--font-body); font-size: var(--text-sm); font-weight: 600; cursor: pointer; transition: all var(--transition); }
    .btn:disabled { opacity: 0.4; cursor: not-allowed; }
    .btn-primary { background: var(--agentic-500); color: var(--paper-50); }
    .btn-primary:hover:not(:disabled) { background: var(--agentic-500); }
    .btn-outline { background: var(--color-surface); border: 1px solid var(--line-200); color: var(--ink-900); }
    .btn-outline:hover { border-color: var(--ink-700); }
  `]
})
export class AtelierNeuroSymboliqueComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private service = inject(AtelierNeuroSymboliqueService);
  private toast = inject(ToastService);
  private STORAGE_KEY = 'atelierNeuroSymboliqueId';

  loading = signal(true);
  error = signal<string | null>(null);
  atelier = signal<AtelierStatus | null>(null);
  creating = signal(false);
  savingRegles = signal(false);
  testing = signal(false);
  resultat = signal<TestResult | null>(null);

  regles: Regle[] = [];
  scores = { similarite: 0.5, originalite: 0.5, rigueur: 0.5, completude: 0.5 };

  statutLabel(statut: string): string {
    return statut === 'termine' ? 'Terminé' : statut === 'echec' ? 'Échec' : 'En cours';
  }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadAtelier(id);
    } else {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) this.loadAtelier(stored);
      else this.loading.set(false);
    }
  }

  private loadAtelier(id: string) {
    this.loading.set(true);
    this.service.getStatus(id).subscribe({
      next: s => {
        this.atelier.set(s);
        this.regles = (s.regles || []).map(r => ({ ...r }));
        this.loading.set(false);
      },
      error: () => {
        localStorage.removeItem(this.STORAGE_KEY);
        this.error.set("Impossible de charger l'atelier (introuvable ou accès refusé).");
        this.loading.set(false);
      },
    });
  }

  creer() {
    if (this.creating()) return;
    this.creating.set(true);
    this.service.create().subscribe({
      next: atelier => {
        this.creating.set(false);
        const id = atelier._id;
        localStorage.setItem(this.STORAGE_KEY, id);
        this.router.navigate(['/smart-tools/atelier-neuro-symbolique', id], { replaceUrl: true });
        this.loadAtelier(id);
        this.toast.success('Atelier créé.');
      },
      error: () => {
        this.creating.set(false);
        this.toast.error('Erreur lors de la création.');
      },
    });
  }

  enregistrerRegles() {
    const id = this.atelier()?.id;
    if (!id || this.savingRegles()) return;
    this.savingRegles.set(true);
    this.service.updateRegles(id, this.regles).subscribe({
      next: () => {
        this.savingRegles.set(false);
        this.toast.success('Règles enregistrées.');
      },
      error: () => {
        this.savingRegles.set(false);
        this.toast.error("Erreur lors de l'enregistrement des règles.");
      },
    });
  }

  tester() {
    const id = this.atelier()?.id;
    if (!id || this.testing()) return;
    this.testing.set(true);
    this.service.tester(id, this.scores).subscribe({
      next: r => {
        this.testing.set(false);
        this.resultat.set(r);
      },
      error: () => {
        this.testing.set(false);
        this.toast.error('Erreur lors du test.');
      },
    });
  }
}
