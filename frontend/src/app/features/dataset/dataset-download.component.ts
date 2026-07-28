import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { catchError, of, finalize } from 'rxjs';

interface Dataset {
  _id: string;
  name: string;
  description: string;
  size?: string;
  format?: string;
}

const FALLBACK_DATASETS: Dataset[] = [
  { _id: '1', name: 'Données agricoles 2024', description: 'Données de production agricole et rendements par région.', size: '2.3 GB', format: 'CSV' },
  { _id: '2', name: 'Indicateurs économiques', description: 'Séries temporelles des principaux indicateurs économiques.', size: '850 MB', format: 'Parquet' },
  { _id: '3', name: 'Météo historique', description: 'Données météorologiques journalières sur 10 ans.', size: '4.1 GB', format: 'NetCDF' },
  { _id: '4', name: 'Recensement population', description: 'Données anonymisées du recensement national.', size: '1.5 GB', format: 'CSV' },
];

@Component({
  selector: 'app-dataset-download',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page">
      <div class="page-header">
        <h2>Datasets disponibles</h2>
        <p class="subtitle">Téléchargez des jeux de données pour vos analyses</p>
      </div>

      @if (loading()) {
        <div class="skeleton-grid">
          @for (s of [1,2,3,4]; track s) {
            <div class="skeleton-card">
              <div class="skeleton-line w-60"></div>
              <div class="skeleton-line w-90"></div>
              <div class="skeleton-line w-40"></div>
            </div>
          }
        </div>
      } @else if (error()) {
        <div class="error-card">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
          <h3>Erreur</h3>
          <p>{{ error() }}</p>
        </div>
      } @else if (datasets().length === 0) {
        <div class="empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
          <h3>Aucun dataset disponible</h3>
          <p>Les datasets apparaîtront ici une fois publiés.</p>
        </div>
      } @else {
        <div class="dataset-grid">
          @for (ds of datasets(); track ds._id) {
            <div class="dataset-card">
              <div class="dataset-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>
              </div>
              <div class="dataset-body">
                <h3>{{ ds.name }}</h3>
                <p>{{ ds.description }}</p>
                <div class="dataset-meta">
                  @if (ds.size) { <span class="meta-tag">{{ ds.size }}</span> }
                  @if (ds.format) { <span class="meta-tag">{{ ds.format }}</span> }
                </div>
              </div>
              <button class="btn-download" (click)="download(ds._id, ds.name)" [disabled]="downloadingId() === ds._id">
                @if (downloadingId() === ds._id) {
                  <span class="mini-spinner"></span>
                } @else {
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                }
                Télécharger
              </button>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .page { max-width: 900px; margin: 0 auto; padding: 24px 16px; }
    .page-header { margin-bottom: 24px; }
    .page-header h2 { font-size: 1.25rem; margin: 0 0 4px; }
    .subtitle { margin: 0; font-size: 0.85rem; color: var(--color-text-secondary); }
    .skeleton-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 16px; }
    .skeleton-card { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 20px; }
    .skeleton-line { height: 14px; border-radius: 4px; background: linear-gradient(90deg, var(--color-border) 25%, var(--color-surface) 50%, var(--color-border) 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; margin-bottom: 10px; }
    .skeleton-line:last-child { margin-bottom: 0; }
    .w-40 { width: 40%; } .w-60 { width: 60%; } .w-90 { width: 90%; }
    @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
    .error-card { display: flex; flex-direction: column; align-items: center; text-align: center; padding: 40px 20px; color: var(--color-error); background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-md); }
    .error-card svg { margin-bottom: 12px; }
    .error-card h3 { margin: 0 0 4px; font-size: 1rem; }
    .error-card p { margin: 0; font-size: 0.85rem; }
    .empty-state { display: flex; flex-direction: column; align-items: center; text-align: center; padding: 60px 20px; color: var(--color-text-secondary); }
    .empty-state svg { margin-bottom: 16px; }
    .empty-state h3 { margin: 0 0 4px; font-size: 1rem; }
    .empty-state p { margin: 0; font-size: 0.85rem; }
    .dataset-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 16px; }
    .dataset-card { display: flex; flex-direction: column; background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 20px; box-shadow: var(--shadow-card); transition: all var(--transition); }
    .dataset-card:hover { transform: translateY(-2px); box-shadow: var(--shadow-lg); border-color: var(--color-sky-blue); }
    .dataset-icon { width: 44px; height: 44px; border-radius: var(--radius-sm); background: rgba(217,160,43,0.1); color: var(--honey-600); display: flex; align-items: center; justify-content: center; margin-bottom: 12px; }
    .dataset-body { flex: 1; }
    .dataset-body h3 { font-size: 1rem; margin: 0 0 6px; }
    .dataset-body p { font-size: 0.85rem; color: var(--color-text-secondary); margin: 0 0 10px; line-height: 1.4; }
    .dataset-meta { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 14px; }
    .meta-tag { font-size: 0.72rem; padding: 3px 10px; border-radius: 999px; background: var(--color-cream-light); color: var(--color-text-secondary); font-weight: 500; }
    .btn-download { display: flex; align-items: center; justify-content: center; gap: 8px; padding: 10px 16px; background: var(--color-primary-blue); color: #fff; border: none; border-radius: var(--radius-sm); font-size: 0.85rem; font-weight: 600; font-family: var(--font-sans); cursor: pointer; transition: all var(--transition); width: 100%; }
    .btn-download:hover:not(:disabled) { background: var(--color-deep-blue); }
    .btn-download:disabled { opacity: 0.6; cursor: not-allowed; }
    .mini-spinner { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: spin 0.6s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class DatasetDownloadComponent implements OnInit {
  private http = inject(HttpClient);

  loading = signal(true);
  error = signal<string | null>(null);
  datasets = signal<Dataset[]>([]);
  downloadingId = signal<string | null>(null);

  ngOnInit() {
    this.http.get<Dataset[]>('/api/smart-tools/datasets').pipe(
      catchError(() => {
        this.datasets.set(FALLBACK_DATASETS);
        return of(undefined);
      }),
      finalize(() => this.loading.set(false))
    ).subscribe(list => {
      if (list) this.datasets.set(list);
    });
  }

  download(id: string, name: string) {
    this.downloadingId.set(id);
    this.http.get(`/api/smart-tools/datasets/${id}/download`, { responseType: 'blob' }).pipe(
      catchError(() => {
        this.error.set('Erreur lors du téléchargement');
        return of(undefined);
      }),
      finalize(() => this.downloadingId.set(null))
    ).subscribe(blob => {
      if (!blob) return;
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = name;
      a.click();
      window.URL.revokeObjectURL(url);
    });
  }
}