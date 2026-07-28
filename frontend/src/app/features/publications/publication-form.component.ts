import { Component, OnInit, inject, signal, effect } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { DatePipe } from '@angular/common';
import { HexSealComponent } from '../../core/hex-seal.component';
import { ToastService } from '../../core/toast.service';

@Component({
  selector: 'app-publication-form',
  standalone: true,
  imports: [RouterLink, HexSealComponent, DatePipe],
  template: `
    <div class="form-page">
      <a routerLink="/publications" class="back-link">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="15 18 9 12 15 6"/></svg>
        {{ isEdit() ? 'Retour à la publication' : 'Toutes les publications' }}
      </a>

      <div class="form-layout">
        <div class="form-main">
          <h1>{{ isEdit() ? 'Modifier la publication' : 'Nouvelle publication' }}</h1>

          @if (error()) { <div class="msg msg--error">{{ error() }}</div> }

          <div class="field">
            <label>Titre</label>
            <input class="input" placeholder="Titre de la publication" [value]="form().titre" (input)="setField('titre', $event)" />
          </div>

          <div class="field">
            <label>Type</label>
            <select class="input input--select" [value]="form().type" (change)="setField('type', $event)">
              <option value="libre">Libre</option>
              <option value="these">Thèse</option>
              <option value="pfe">PFE</option>
              <option value="pfa">PFA</option>
              <option value="scientifique">Scientifique</option>
            </select>
          </div>

          <div class="field">
            <label>Contenu</label>
            <div class="editor-toolbar">
              <button type="button" title="Gras" (click)="wrap('**')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/><path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/></svg></button>
              <button type="button" title="Italique" (click)="wrap('_')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" y1="4" x2="10" y2="4"/><line x1="14" y1="20" x2="5" y2="20"/><line x1="15" y1="4" x2="9" y2="20"/></svg></button>
              <span class="toolbar-sep"></span>
              <button type="button" title="Citation" (click)="wrap('> ')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"/><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"/></svg></button>
              <button type="button" title="Liste" (click)="wrap('- ')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg></button>
              <button type="button" title="Lien" (click)="wrapLink()"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg></button>
            </div>
            <textarea class="input input--textarea" placeholder="Écrivez votre contenu…" [value]="form().contenu" (input)="setField('contenu', $event)"></textarea>
          </div>

          <label class="checkbox-field">
            <input type="checkbox" [checked]="form().soumettre" (change)="toggleSoumettre()" />
            <span>Soumettre pour ancrage blockchain après création</span>
          </label>

          <div class="form-actions">
            <button class="btn btn-primary" [disabled]="!valid() || saving()" (click)="save()">
              {{ saving() ? 'Enregistrement…' : isEdit() ? 'Enregistrer les modifications' : 'Publier' }}
            </button>
            @if (!isEdit()) {
              <button class="btn btn-secondary" [disabled]="saving()" (click)="saveDraft()">Enregistrer comme brouillon</button>
            }
          </div>
        </div>

        <div class="form-side">
          <!-- Live seal preview -->
          <div class="preview-block">
            <span class="preview-label">Aperçu du sceau</span>
            <div class="preview-seal">
              <app-hex-seal [status]="form().soumettre ? 'en_attente' : 'valide'" [size]="56"></app-hex-seal>
            </div>
            <span class="preview-status">Statut : {{ form().soumettre ? 'En attente d\'ancrage' : 'Brouillon local' }}</span>
          </div>

          <!-- Quick stats (edit mode) -->
          @if (isEdit() && original(); as o) {
            <div class="stats-block">
              <div class="stat-row">
                <span class="stat-label">Créé le</span>
                <span class="stat-value">{{ o.createdAt | date:'dd MMM yyyy' }}</span>
              </div>
              <div class="stat-row">
                <span class="stat-label">Ancrage</span>
                <span class="stat-value" [class.text--verify]="o.preuve?.statut === 'ancre'">{{ o.preuve?.statut || 'Non soumis' }}</span>
              </div>
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .form-page { position: relative; max-width: 880px; margin: 0 auto; }

    .back-link { display: inline-flex; align-items: center; gap: 6px; color: var(--ink-700); text-decoration: none; font-size: var(--text-sm); margin-bottom: 20px; transition: color var(--transition); }
    .back-link:hover { color: var(--honey-500); }

    .form-layout { display: flex; gap: 32px; align-items: flex-start; }
    .form-main { flex: 1; }
    .form-side { width: 200px; flex-shrink: 0; position: sticky; top: 88px; display: flex; flex-direction: column; gap: 16px; }
    @media (max-width: 768px) { .form-layout { flex-direction: column; } .form-side { width: 100%; position: static; } }

    .form-main h1 { font-size: var(--text-xl); margin: 0 0 20px; }

    .field { margin-bottom: 16px; }
    .field label { display: block; font-size: var(--text-sm); font-weight: 600; margin-bottom: 6px; color: var(--ink-900); }

    .input { width: 100%; padding: 10px 14px; font-family: var(--font-body); font-size: var(--text-sm); border: 1px solid var(--line-200); border-radius: var(--radius-md); background: var(--color-surface); color: var(--ink-900); outline: none; transition: border-color var(--transition); box-sizing: border-box; }
    .input:focus { border-color: var(--honey-500); box-shadow: 0 0 0 3px rgba(217,160,43,0.08); }
    .input--select { appearance: none; background-image: url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%2310131F' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 12px center; padding-right: 32px; }
    .input--textarea { min-height: 280px; resize: vertical; line-height: 1.6; }

    .editor-toolbar { display: flex; align-items: center; gap: 4px; padding: 6px 8px; border: 1px solid var(--line-200); border-bottom: none; border-radius: var(--radius-md) var(--radius-md) 0 0; background: var(--paper-50); flex-wrap: wrap; }
    .editor-toolbar button { display: flex; align-items: center; justify-content: center; width: 30px; height: 28px; border: none; border-radius: 4px; background: none; color: var(--ink-700); cursor: pointer; transition: all var(--transition); }
    .editor-toolbar button:hover { background: var(--line-200); color: var(--ink-900); }
    .toolbar-sep { width: 1px; height: 16px; background: var(--line-200); margin: 0 4px; }
    .input--textarea { border-top-left-radius: 0; border-top-right-radius: 0; }

    .checkbox-field { display: flex; align-items: center; gap: 8px; font-size: var(--text-sm); margin: 12px 0 20px; cursor: pointer; }
    .checkbox-field input { width: 16px; height: 16px; accent-color: var(--honey-500); }

    .form-actions { display: flex; gap: 10px; margin-top: 8px; }
    .btn { padding: 10px 22px; border: none; border-radius: var(--radius-md); font-family: var(--font-body); font-size: var(--text-sm); font-weight: 600; cursor: pointer; transition: all var(--transition); }
    .btn:disabled { opacity: 0.4; cursor: not-allowed; }
    .btn-primary { background: var(--honey-500); color: var(--ink-900); }
    .btn-primary:hover:not(:disabled) { background: var(--honey-600); }
    .btn-secondary { background: var(--color-surface); border: 1px solid var(--line-200); color: var(--ink-900); }
    .btn-secondary:hover:not(:disabled) { border-color: var(--ink-700); }

    .msg { font-size: var(--text-sm); padding: 10px 14px; border-radius: var(--radius-md); margin-bottom: 16px; }
    .msg--error { color: var(--alert-500); background: rgba(196,67,46,0.06); }

    /* Side panels */
    .preview-block, .stats-block { background: var(--color-surface); border: 1px solid var(--line-200); border-radius: var(--radius-md); padding: 16px; display: flex; flex-direction: column; align-items: center; gap: 10px; }
    .preview-label, .stats-block .stat-label { font-size: var(--text-xs); font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; color: var(--ink-700); }
    .preview-status { font-size: var(--text-xs); color: var(--ink-700); }
    .stat-row { width: 100%; display: flex; justify-content: space-between; align-items: center; font-size: var(--text-xs); padding: 4px 0; border-bottom: 1px solid var(--line-200); }
    .stat-row:last-child { border-bottom: none; }
    .stat-value { font-family: var(--font-mono); color: var(--ink-900); }
    .text--verify { color: var(--verify-500); }
  `]
})
export class PublicationFormComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private http = inject(HttpClient);
  private toast = inject(ToastService);

  isEdit = signal(false);
  saving = signal(false);
  error = signal<string | null>(null);
  original = signal<any>(null);

  form = signal({ titre: '', type: 'libre', contenu: '', soumettre: false });

  private textarea: HTMLTextAreaElement | null = null;

  valid = signal(false);

  private v = effect(() => {
    const f = this.form();
    this.valid.set(f.titre.trim().length > 2 && f.contenu.trim().length > 10);
  });

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit.set(true);
      this.http.get<any>('/api/publications/' + id).subscribe({
        next: p => {
          this.original.set(p);
          this.form.set({ titre: p.titre || '', type: p.type || 'libre', contenu: p.contenu || '', soumettre: false });
        },
        error: () => this.error.set('Impossible de charger la publication.'),
      });
    }
  }

  setField(field: string, event: Event) {
    const val = (event.target as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement).value;
    this.form.update(f => ({ ...f, [field]: val }));
    this.error.set(null);
  }

  toggleSoumettre() {
    this.form.update(f => ({ ...f, soumettre: !f.soumettre }));
  }

  wrap(token: string) {
    const ta = document.querySelector('.input--textarea') as HTMLTextAreaElement;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const text = ta.value;
    const selected = text.substring(start, end);
    const wrapped = token === '> '
      ? (start > 0 && text[start - 1] !== '\n' ? '\n> ' + selected : '> ' + selected)
      : token + selected + (token === '**' ? '**' : token === '_' ? '_' : '');
    ta.value = text.substring(0, start) + wrapped + text.substring(end);
    this.form.update(f => ({ ...f, contenu: ta.value }));
    ta.focus();
    const cursor = start + wrapped.length - (selected.length ? 0 : token.length);
    ta.setSelectionRange(cursor, cursor);
  }

  wrapLink() {
    const ta = document.querySelector('.input--textarea') as HTMLTextAreaElement;
    if (!ta) return;
    const selected = ta.value.substring(ta.selectionStart, ta.selectionEnd);
    const link = selected ? `[${selected}](url)` : `[texte](url)`;
    ta.setRangeText(link, ta.selectionStart, ta.selectionEnd, 'end');
    this.form.update(f => ({ ...f, contenu: ta.value }));
  }

  save() {
    if (!this.valid() || this.saving()) return;
    this.saving.set(true);
    this.error.set(null);
    const body = { ...this.form(), soumettre: this.form().soumettre ? 'vrai' : 'faux' };
    const obs = this.isEdit()
      ? this.http.put('/api/publications/' + this.route.snapshot.paramMap.get('id'), body)
      : this.http.post('/api/publications', body);

    obs.subscribe({
      next: (r: any) => {
        this.saving.set(false);
        this.toast.success(this.isEdit() ? 'Publication modifiée' : 'Publication créée');
        this.router.navigate(['/publications', r._id || r.publication?._id]);
      },
      error: e => { this.error.set(e.error?.error || 'Erreur lors de l\'enregistrement'); this.saving.set(false); },
    });
  }

  saveDraft() {
    this.form.update(f => ({ ...f, soumettre: false }));
    this.save();
  }
}
