import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface CompetenceValidee {
  _id?: string;
  competence?: string;
  note?: number;
  missionId?: any;
  validePar?: any;
  date?: string;
}

export interface FormationSuivie {
  _id?: string;
  formationId?: any;
  dateCompletion?: string;
}

export interface MissionHistorique {
  _id?: string;
  missionId?: any;
  evaluationClient?: number;
}

export interface OeuvreProuvee {
  _id?: string;
  publicationId?: any;
}

export interface ProfilCertifie {
  _id?: string;
  membreId: string;
  competencesValidees: CompetenceValidee[];
  formationsSuivies: FormationSuivie[];
  historiqueMissions: MissionHistorique[];
  oeuvresProuvees: OeuvreProuvee[];
  reputationScore: number;
}

@Injectable({ providedIn: 'root' })
export class ProfilCertifieService {
  private http = inject(HttpClient);
  private base = '/api/membres';

  getByMembreId(membreId: string): Observable<ProfilCertifie> {
    return this.http.get<ProfilCertifie>(this.base + '/' + membreId + '/profil-certifie');
  }
}
