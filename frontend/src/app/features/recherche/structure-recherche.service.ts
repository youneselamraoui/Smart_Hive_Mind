import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface StructureRecherche {
  _id: string;
  type: 'centre' | 'laboratoire' | 'equipe';
  nom: string;
  membres: any[];
  axes: string[];
  productions: any[];
  createdAt: string;
  updatedAt: string;
}

@Injectable({ providedIn: 'root' })
export class StructureRechercheService {
  private http = inject(HttpClient);
  private base = '/api/structures-recherche';

  list(type?: string): Observable<StructureRecherche[]> {
    const params = type ? `?type=${encodeURIComponent(type)}` : '';
    return this.http.get<StructureRecherche[]>(this.base + params);
  }

  getById(id: string): Observable<StructureRecherche> {
    return this.http.get<StructureRecherche>(this.base + '/' + id);
  }

  create(data: Partial<StructureRecherche>): Observable<StructureRecherche> {
    return this.http.post<StructureRecherche>(this.base, data);
  }

  update(id: string, data: Partial<StructureRecherche>): Observable<StructureRecherche> {
    return this.http.put<StructureRecherche>(this.base + '/' + id, data);
  }

  delete(id: string): Observable<any> {
    return this.http.delete(this.base + '/' + id);
  }
}
