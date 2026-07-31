import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface JournalComite {
  membreId: any;
  role: string;
}

export interface Journal {
  _id: string;
  nom: string;
  domaines: string[];
  description?: string;
  comite: JournalComite[];
  administrateurs: any[];
  statut: string;
  createdAt: string;
  updatedAt: string;
}

@Injectable({ providedIn: 'root' })
export class JournalService {
  private http = inject(HttpClient);
  private base = '/api/journaux';

  list(domaine?: string): Observable<Journal[]> {
    const params = domaine ? `?domaine=${encodeURIComponent(domaine)}` : '';
    return this.http.get<Journal[]>(this.base + params);
  }

  getById(id: string): Observable<Journal> {
    return this.http.get<Journal>(this.base + '/' + id);
  }

  create(data: Partial<Journal>): Observable<Journal> {
    return this.http.post<Journal>(this.base, data);
  }

  update(id: string, data: Partial<Journal>): Observable<Journal> {
    return this.http.put<Journal>(this.base + '/' + id, data);
  }

  delete(id: string): Observable<any> {
    return this.http.delete(this.base + '/' + id);
  }

  soumettrePublication(publicationId: string, journalId: string): Observable<any> {
    return this.http.post(`/api/publications/${publicationId}/soumettre-journal`, { journalId });
  }
}
