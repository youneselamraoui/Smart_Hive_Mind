import { Component, inject, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ToastService } from '../../../core/toast.service';

@Component({
  selector: 'app-dataset-upload',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="page">
      <div class="page-head">
        <div>
          <h1>Uploader un jeu de données</h1>
          <p>Publiez un dataset pour la communauté</p>
        </div>
        <a routerLink="/smart-tools/models" class="btn btn-outline">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="15 18 9 12 15 6"/></svg>
          Model Bank
        </a>
      </div>

      <div class="upload-layout">
        <div class="upload-form">
          <div class="field">
            <label>Nom</label>
            <input class="input" [(ngModel)]="nom" placeholder="Nom du dataset" />
          </div>
          <div class="field">
            <label>Domaine</label>
            <input class="input" [(ngModel)]="domaine" placeholder="Domaine d'application" />
          </div>
          <div class="field">
            <label>Licence</label>
            <input class="input" [(ngModel)]="licence" placeholder="Licence (MIT, CC-BY, ...)" />
          </div>

          <div class="field">
            <label>Fichier</label>
            <div class="dropzone" (dragover)="$event.preventDefault()" (drop)="onDrop($event)" (click)="fileInput.click()">
              @if (uploadedFile) {
                <div class="dz-file">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/></svg>
                  <span>{{ uploadedFile }}</span>
                </div>
              } @else {
                <div class="dz-empty">
                  <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linejoin="round">
                    <path d="M21 16v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2"/>
                    <path d="M7 10l5-5 5 5"/>
                    <line x1="12" y1="5" x2="12" y2="16"/>
                    <rect x="3" y="16" width="18" height="4" rx="1"/>
                  </svg>
                  <span class="dz-title">Glissez votre jeu de données ou parcourez vos fichiers</span>
                  <span class="dz-hint">.csv, .json, .zip, .pt, .joblib, .pkl (max 50 Mo)</span>
                </div>
              }
            </div>
            <input #fileInput type="file" accept=".csv,.json,.zip,.pt,.joblib,.pkl" (change)="onFileSelected($event)" style="display:none" />
          </div>

          <button class="btn btn-primary" [disabled]="!selectedFile || uploading()" (click)="upload()">
            @if (uploading()) {
              <div class="spin-sm"></div>
              Upload en cours…
            } @else {
              Uploader le dataset
            }
          </button>
        </div>

        <!-- Quality gauge (shown after upload) -->
        @if (result(); as r) {
          <div class="quality-panel">
            <h3>Qualité du dataset</h3>
            <div class="gauge-wrap">
              <svg class="gauge-ring" viewBox="0 0 120 120" width="140" height="140">
                <circle cx="60" cy="60" r="50" fill="none" stroke="var(--line-200)" stroke-width="8"/>
                <circle class="gauge-fill" cx="60" cy="60" r="50" fill="none" stroke="var(--honey-500)" stroke-width="8"
                  stroke-dasharray="314.159" stroke-dashoffset="314.159"
                  [attr.stroke-dashoffset]="314.159 - (r.qualite || 0) * 314.159"
                  stroke-linecap="round" transform="rotate(-90 60 60)"/>
                <text x="60" y="60" text-anchor="middle" dominant-baseline="central"
                  font-family="var(--font-mono)" font-size="20" font-weight="700" fill="var(--ink-900)">
                  {{ ((r.qualite || 0) * 100).toFixed(0) }}%
                </text>
              </svg>
            </div>
            <div class="quality-meta">
              <span class="q-label">Score de qualité</span>
              <span class="q-value">{{ r.qualite?.toFixed(2) || '—' }}</span>
            </div>
            @if (r.dimension) {
              <div class="quality-meta">
                <span class="q-label">Dimension</span>
                <span class="q-value">{{ r.dimension }}</span>
              </div>
            }
            @if (r.lignes) {
              <div class="quality-meta">
                <span class="q-label">Lignes</span>
                <span class="q-value">{{ r.lignes }}</span>
              </div>
            }
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .page { position: relative; }
    .page-head { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 28px; flex-wrap: wrap; }
    .page-head h1 { font-size: var(--text-2xl); margin: 0 0 2px; }
    .page-head p { margin: 0; font-size: var(--text-sm); color: var(--ink-700); }

    .btn { display: inline-flex; align-items: center; gap: 8px; padding: 10px 20px; border: none; border-radius: var(--radius-md); font-family: var(--font-body); font-size: var(--text-sm); font-weight: 600; cursor: pointer; transition: all var(--transition); text-decoration: none; }
    .btn:disabled { opacity: 0.4; cursor: not-allowed; }
    .btn-primary { background: var(--honey-500); color: var(--ink-900); }
    .btn-primary:hover:not(:disabled) { background: var(--honey-600); }
    .btn-outline { background: var(--color-surface); border: 1px solid var(--line-200); color: var(--ink-900); }
    .btn-outline:hover { border-color: var(--ink-700); }

    .upload-layout { display: flex; gap: 32px; align-items: flex-start; }
    .upload-form { flex: 1; max-width: 520px; display: flex; flex-direction: column; gap: 16px; }
    @media (max-width: 768px) { .upload-layout { flex-direction: column; } }

    .field { display: flex; flex-direction: column; gap: 6px; }
    .field label { font-size: var(--text-sm); font-weight: 600; }
    .input { padding: 10px 14px; border: 1px solid var(--line-200); border-radius: var(--radius-sm); font-family: var(--font-body); font-size: var(--text-sm); outline: none; background: var(--color-surface); color: var(--ink-900); transition: border-color var(--transition); }
    .input:focus { border-color: var(--honey-500); box-shadow: 0 0 0 3px rgba(217,160,43,0.08); }

    .dropzone { border: 2px dashed var(--line-200); border-radius: var(--radius-md); padding: 40px 20px; text-align: center; cursor: pointer; transition: all var(--transition); }
    .dropzone:hover { border-color: var(--honey-500); background: rgba(217,160,43,0.03); }
    .dz-empty { display: flex; flex-direction: column; align-items: center; gap: 10px; color: var(--ink-700); }
    .dz-empty svg { color: var(--honey-500); opacity: 0.6; }
    .dz-title { font-size: var(--text-sm); font-weight: 500; }
    .dz-hint { font-size: var(--text-xs); opacity: 0.6; }
    .dz-file { display: flex; align-items: center; gap: 10px; font-weight: 600; color: var(--honey-500); justify-content: center; }
    .dz-file svg { color: var(--verify-500); }

    .spin-sm { width: 14px; height: 14px; border: 2px solid rgba(16,19,31,0.2); border-top-color: var(--ink-900); border-radius: 50%; animation: sp 0.7s linear infinite; }
    @keyframes sp { to { transform: rotate(360deg); } }

    /* Quality gauge */
    .quality-panel { width: 200px; flex-shrink: 0; background: var(--color-surface); border: 1px solid var(--line-200); border-radius: var(--radius-md); padding: 20px; display: flex; flex-direction: column; align-items: center; gap: 14px; position: sticky; top: 88px; }
    .quality-panel h3 { font-size: var(--text-sm); margin: 0; }
    .gauge-wrap { line-height: 0; }
    .gauge-ring { display: block; }
    .gauge-fill { transition: stroke-dashoffset 0.8s ease-out; }
    .quality-meta { width: 100%; display: flex; justify-content: space-between; align-items: center; font-size: var(--text-xs); padding: 4px 0; border-bottom: 1px solid var(--line-200); }
    .quality-meta:last-of-type { border-bottom: none; }
    .q-label { color: var(--ink-700); }
    .q-value { font-family: var(--font-mono); font-weight: 500; }
  `]
})
export class DatasetUploadComponent {
  private http = inject(HttpClient);
  private toast = inject(ToastService);
  nom = '';
  domaine = '';
  licence = '';
  selectedFile?: File;
  uploadedFile = '';
  uploading = signal(false);
  result = signal<any>(null);

  onFileSelected(event: any) {
    const f = event.target.files?.[0];
    if (f) { this.selectedFile = f; this.uploadedFile = f.name; }
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    const f = event.dataTransfer?.files?.[0];
    if (f) { this.selectedFile = f; this.uploadedFile = f.name; }
  }

  upload() {
    if (!this.selectedFile) return;
    this.uploading.set(true);
    const fd = new FormData();
    fd.append('fichier', this.selectedFile);
    fd.append('nom', this.nom || this.selectedFile.name);
    fd.append('domaine', this.domaine);
    fd.append('licence', this.licence);
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders(token ? { Authorization: 'Bearer ' + token } : {});
    this.http.post<any>('/api/smart-tools/datasets', fd, { headers }).subscribe({
      next: res => {
        this.uploadedFile = res.dataset?.nom || this.selectedFile!.name;
        this.result.set(res.dataset || res);
        this.toast.success('Dataset uploadé');
        this.uploading.set(false);
      },
      error: err => {
        this.toast.error(err.error?.error || 'Erreur upload');
        this.uploading.set(false);
      },
    });
  }
}
