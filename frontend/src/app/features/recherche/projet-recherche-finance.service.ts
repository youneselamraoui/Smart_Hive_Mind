import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Livrable {
  description?: string;
  dateEcheance?: string;
  statut?: string;
}

export interface Candidature {
  equipeId: any;
  dateCandidature?: string;
  statut?: string;
}

export interface ProjetRechercheFinance {
  _id: string;
  theme: string;
  budget?: number;
  livrables?: Livrable[];
  industrielId: any;
  structureRechercheId: any;
  statut: 'candidature' | 'en_cours' | 'termine';
  candidatures?: Candidature[];
  createdAt: string;
  updatedAt: string;
}

@Injectable({ providedIn: 'root' })
export class ProjetRechercheFinanceService {
  private http = inject(HttpClient);
  private base = '/api/projets-recherche';

  list(statut?: string): Observable<ProjetRechercheFinance[]> {
    const params = statut ? `?statut=${encodeURIComponent(statut)}` : '';
    return this.http.get<ProjetRechercheFinance[]>(this.base + params);
  }

  getById(id: string): Observable<ProjetRechercheFinance> {
    return this.http.get<ProjetRechercheFinance>(this.base + '/' + id);
  }

  create(data: Partial<ProjetRechercheFinance>): Observable<ProjetRechercheFinance> {
    return this.http.post<ProjetRechercheFinance>(this.base, data);
  }

  update(id: string, data: Partial<ProjetRechercheFinance>): Observable<ProjetRechercheFinance> {
    return this.http.put<ProjetRechercheFinance>(this.base + '/' + id, data);
  }

  delete(id: string): Observable<any> {
    return this.http.delete(this.base + '/' + id);
  }

  candidater(id: string, equipeId: string): Observable<ProjetRechercheFinance> {
    return this.http.post<ProjetRechercheFinance>(this.base + '/' + id + '/candidater', { equipeId });
  }

  attribuer(id: string, equipeId: string): Observable<ProjetRechercheFinance> {
    return this.http.put<ProjetRechercheFinance>(this.base + '/' + id + '/attribuer', { equipeId });
  }
}
