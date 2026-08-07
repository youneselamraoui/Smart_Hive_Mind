import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Regle {
  nom: string;
  condition: string;
  poids: number;
  actif: boolean;
  impactSiDeclenchee: 'positif' | 'negatif';
}

export interface Justification {
  regle: string;
  valeur: number | null;
  impact: 'positif' | 'negatif';
  justification: string;
}

export interface TestResult {
  scores: { similarite: number; originalite: number; rigueur: number; completude: number; scoreGlobal: number };
  justifications: Justification[];
  nbReglesDeclenchees: number;
  nbReglesActives: number;
}

export interface AtelierStatus {
  id: string;
  type: string;
  statut: string;
  etapes: any[];
  regles: Regle[];
  resultatFinal: TestResult | null;
  createdAt: string;
  updatedAt: string;
}

@Injectable({ providedIn: 'root' })
export class AtelierNeuroSymboliqueService {
  private http = inject(HttpClient);
  private base = '/api/smart-tools/ateliers/neuro-symbolique';

  create(): Observable<any> {
    return this.http.post(this.base, {});
  }

  updateRegles(id: string, regles: Regle[]): Observable<any> {
    return this.http.put(this.base + '/' + id + '/regles', { regles });
  }

  tester(id: string, scores: { similarite: number; originalite: number; rigueur: number; completude: number }): Observable<TestResult> {
    return this.http.post<TestResult>(this.base + '/' + id + '/tester', scores);
  }

  getStatus(id: string): Observable<AtelierStatus> {
    return this.http.get<AtelierStatus>(this.base + '/' + id + '/status');
  }
}
