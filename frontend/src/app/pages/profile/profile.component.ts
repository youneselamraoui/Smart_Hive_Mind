import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ToastService } from '../../core/toast.service';

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
  return `<svg viewBox="0 0 24 24" width="100%" height="100%" fill="none">${cells.join('')}</svg>`;
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <div class="page">
      <div class="page-head"><div><h1>Mon profil</h1></div></div>

      @if (membre(); as m) {
        <div class="hero">
          <div class="hero-identicon" [innerHTML]="identicon(m._id, m.prenom + ' ' + m.nom)"></div>
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
      }

      <div class="form-card">
        <h3>Modifier mes informations</h3>
        <form [formGroup]="form" (ngSubmit)="save()">
          <div class="field"><label>Nom</label><input type="text" formControlName="nom" /></div>
          <div class="field"><label>Prénom</label><input type="text" formControlName="prenom" /></div>
          <div class="field"><label>Email</label><input type="email" formControlName="email" /></div>
          <div class="field"><label>Nouveau mot de passe (optionnel)</label><input type="password" formControlName="motDePasse" placeholder="Laisser vide pour ne pas changer" /></div>
          <div class="form-actions">
            <button type="submit" class="btn btn-primary" [disabled]="form.invalid || loading()">{{ loading() ? 'Enregistrement…' : 'Enregistrer' }}</button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .page-head { margin-bottom: 24px; }
    .page-head h1 { font-size: var(--text-2xl); margin: 0; }

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

    .form-card { background: var(--color-surface); border: 1px solid var(--line-200); border-radius: var(--radius-md); padding: 28px; max-width: 640px; }
    .form-card h3 { margin: 0 0 20px; font-size: var(--text-base); }
    .field { display: flex; flex-direction: column; gap: 6px; margin-bottom: 20px; }
    .field label { font-size: var(--text-sm); font-weight: 600; }
    .field input { padding: 10px 14px; border: 1px solid var(--line-200); border-radius: var(--radius-sm); font-family: var(--font-body); font-size: var(--text-sm); outline: none; background: var(--color-surface); color: var(--ink-900); transition: border-color var(--transition); }
    .field input:focus { border-color: var(--honey-500); }
    .form-actions { margin-top: 24px; }
    .btn { display: inline-flex; align-items: center; gap: 6px; padding: 10px 24px; border-radius: var(--radius-sm); font-family: var(--font-body); font-size: var(--text-sm); font-weight: 600; cursor: pointer; transition: all var(--transition); border: none; }
    .btn:disabled { opacity: 0.4; cursor: not-allowed; }
    .btn-primary { background: var(--honey-500); color: var(--ink-900); }
    .btn-primary:hover:not(:disabled) { background: var(--honey-600); }
  `]
})
export class ProfileComponent implements OnInit {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private toast = inject(ToastService);
  membre = signal<any>(null);
  loading = signal(false);

  form = this.fb.nonNullable.group({
    nom: ['', Validators.required],
    prenom: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    motDePasse: ['', [Validators.minLength(6)]],
  });

  identicon = identiconSvg;

  ngOnInit() {
    this.http.get<any>('/api/auth/me').subscribe({
      next: m => { this.membre.set(m); this.form.patchValue({ nom: m.nom, prenom: m.prenom, email: m.email }); },
      error: () => this.toast.error('Impossible de charger le profil.'),
    });
  }

  save() {
    if (this.form.invalid) return;
    this.loading.set(true);
    const body: Record<string, string> = {};
    const v = this.form.value;
    if (v.nom) body['nom'] = v.nom;
    if (v.prenom) body['prenom'] = v.prenom;
    if (v.email) body['email'] = v.email;
    if (v.motDePasse) body['motDePasse'] = v.motDePasse;
    this.http.put('/api/auth/mon-profil', body).subscribe({
      next: (res: any) => { this.membre.set(res.membre); this.loading.set(false); this.toast.success('Profil mis à jour.'); },
      error: err => { this.loading.set(false); this.toast.error(err.error?.error || 'Erreur.'); },
    });
  }
}
