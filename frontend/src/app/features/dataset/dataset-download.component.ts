import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { catchError, of, finalize } from 'rxjs';
import { RouterLink } from '@angular/router';
import { SkeletonModule } from 'primeng/skeleton';
import { ContentCardComponent } from '../../core/content-card.component';
import { EmptyStateComponent } from '../../core/empty-state.component';
import { ToastService } from '../../core/toast.service';

interface Dataset {
  _id: string;
  nom: string;
  annotations?: string;
  domaine?: string;
  licence?: string;
  qualite?: number;
  size?: string;
  format?: string;
  uploadePar?: { nom: string; prenom: string };
  createdAt?: string;
}

const FALLBACK_DATASETS: Dataset[] = [
  { _id: '1', nom: 'Données agricoles 2024', annotations: 'Données de production agricole et rendements par région.', size: '2.3 GB', format: 'CSV', domaine: 'Agriculture' },
  { _id: '2', nom: 'Indicateurs économiques', annotations: 'Séries temporelles des principaux indicateurs économiques.', size: '850 MB', format: 'Parquet', domaine: 'Économie' },
  { _id: '3', nom: 'Météo historique', annotations: 'Données météorologiques journalières sur 10 ans.', size: '4.1 GB', format: 'NetCDF', domaine: 'Météo' },
  { _id: '4', nom: 'Recensement population', annotations: 'Données anonymisées du recensement national.', size: '1.5 GB', format: 'CSV', domaine: 'Démographie' },
];

@Component({
  selector: 'app-dataset-download',
  standalone: true,
  imports: [CommonModule, ContentCardComponent, EmptyStateComponent, SkeletonModule, RouterLink],
  template: `
    <div class="page">
      <div class="page-header">
        <div><h2>Datasets disponibles</h2>
        <p class="subtitle">Téléchargez des jeux de données pour vos analyses</p></div>
        <a class="upload-btn" routerLink="/app/smart-tools/datasets/upload">Uploader un dataset</a>
      </div>

      @if (loading()) {
        <div class="skeleton-grid">
          @for (s of [1,2,3,4]; track s) {
            <div class="skeleton-card">
              <p-skeleton width="100%" height="120px" borderRadius="var(--radius-sm)" />
              <div style="padding:14px 0;display:flex;flex-direction:column;gap:10px;">
                <p-skeleton width="65%" height="1rem" />
                <p-skeleton width="90%" height="0.8rem" />
                <p-skeleton width="40%" height="0.8rem" />
              </div>
            </div>
          }
        </div>
      } @else if (error()) {
        <app-empty-state
          icon="pi pi-exclamation-triangle"
          title="Erreur"
          [description]="error() ?? 'Impossible de charger les datasets.'"
        />
      } @else if (datasets().length === 0) {
        <app-empty-state
          icon="pi pi-database"
          title="Aucun dataset disponible"
          description="Les datasets apparaîtront ici une fois publiés."
        />
      } @else {
        <div class="dataset-grid">
          @for (ds of datasets(); track ds._id) {
            <app-content-card
              [title]="ds.nom"
              [category]="ds.domaine"
              categoryIcon="pi pi-database"
              [authorName]="authorName(ds)"
              [metadata]="datasetMeta(ds)"
              [rating]="ds.qualite ? ds.qualite * 5 : undefined"
              [showRatingValue]="true"
              [actionLabel]="downloadingId() === ds._id ? 'Téléchargement…' : 'Télécharger'"
              actionIcon="pi pi-download"
              (actionClick)="download(ds._id, ds.nom)"
            />
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .page { max-width: 900px; margin: 0 auto; padding: 24px 0; }
    .page-header { margin-bottom: 24px; display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; }
    .page-header h2 { font-size: 1.25rem; margin: 0 0 4px; }
    .subtitle { margin: 0; font-size: 0.85rem; color: var(--ink-700); }
    .upload-btn { padding: 8px 16px; border-radius: var(--radius-sm); background: var(--honey-500); color: var(--ink-900); font-size: var(--text-sm); font-weight: 600; text-decoration: none; white-space: nowrap; transition: filter var(--transition); }
    .upload-btn:hover { filter: brightness(1.08); }
    .skeleton-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 16px; }
    .skeleton-card { background: var(--color-surface); border: 1px solid var(--line-200); border-radius: var(--radius-md); padding: 0; overflow: hidden; }
    .skeleton-card > div { padding: 16px 18px; }
    .dataset-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 16px; }
  `]
})
export class DatasetDownloadComponent implements OnInit {
  private http = inject(HttpClient);
  private toast = inject(ToastService);

  loading = signal(true);
  error = signal<string | null>(null);
  datasets = signal<Dataset[]>([]);
  downloadingId = signal<string | null>(null);

  authorName(ds: Dataset): string | undefined {
    const u = ds.uploadePar;
    return u ? `${u.prenom} ${u.nom}` : undefined;
  }

  datasetMeta(ds: Dataset): { icon?: string; label: string; value: string }[] {
    const meta: { icon?: string; label: string; value: string }[] = [];
    if (ds.size) meta.push({ icon: 'pi pi-database', label: 'Taille', value: ds.size });
    if (ds.format) meta.push({ icon: 'pi pi-file', label: 'Format', value: ds.format });
    if (ds.licence) meta.push({ icon: 'pi pi-shield', label: 'Licence', value: ds.licence });
    return meta;
  }

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
      catchError(err => {
        this.toast.error(err.error?.error || 'Ce fichier n\'est pas disponible pour le moment.');
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
