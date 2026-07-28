import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { HexSealComponent } from '../../core/hex-seal.component';

interface DashboardData {
  totalPublications?: number;
  repartitionPublications?: Record<string, number>;
  totalMembres?: number;
  totalSujets?: number;
  totalMissions?: number;
  repartitionMissions?: Record<string, number>;
  totalEvenements?: number;
  totalIdees?: number;
  totalOffres?: number;
  totalFormations?: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, HexSealComponent],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class DashboardComponent implements OnInit {
  private http = inject(HttpClient);
  data: DashboardData | null = null;
  loaded = false;

  isEmpty(): boolean {
    const d = this.data;
    if (!d) return false;
    return !d.totalMembres && !d.totalPublications && !d.totalMissions
        && !d.totalSujets && !d.totalEvenements && !d.totalIdees
        && !d.totalOffres && !d.totalFormations;
  }

  getRepartitionKeys(repart: Record<string, number> | undefined): { status: 'ancre' | 'en_attente' | 'echec' | 'valide'; count: number }[] {
    if (!repart) return [];
    return Object.entries(repart).map(([k, v]) => ({
      status: (k === 'accepte' || k === 'acceptee' || k === 'ancre' || k === 'valide' ? 'valide' :
               k === 'en_attente' ? 'en_attente' :
               k === 'rejete' || k === 'rejetee' || k === 'echec' ? 'echec' : 'valide') as 'ancre' | 'en_attente' | 'echec' | 'valide',
      count: v,
    }));
  }

  ngOnInit() {
    this.http.get<DashboardData>('/api/dashboard/summary').subscribe({
      next: d => {
        this.data = d;
        this.loaded = true;
      },
      error: () => { this.loaded = true; },
    });
  }
}
