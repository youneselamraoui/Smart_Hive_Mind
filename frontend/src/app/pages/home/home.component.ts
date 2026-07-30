import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { HexSealComponent } from '../../core/hex-seal.component';

interface HomeStats {
  totalMembres?: number;
  totalPublications?: number;
  totalMissions?: number;
}

interface Step {
  numero: string;
  titre: string;
  description: string;
  icon: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, HexSealComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent implements OnInit {
  private http = inject(HttpClient);

  protected readonly stats = signal<HomeStats | null>(null);

  protected readonly steps: Step[] = [
    {
      numero: '01',
      titre: 'Publiez vos travaux',
      description: 'Articles, rapports, codes sources, papiers de recherche — déposez vos productions intellectuelles.',
      icon: 'pi pi-file-edit',
    },
    {
      numero: '02',
      titre: 'Protection immédiate',
      description: 'Horodatage blockchain, tatouage numérique, empreinte SHA-256. Votre paternité devient irréfutable.',
      icon: 'pi pi-shield',
    },
    {
      numero: '03',
      titre: 'Évaluation croisée',
      description: 'Pairs, experts du domaine et IA analysent et notent chaque publication.',
      icon: 'pi pi-star',
    },
    {
      numero: '04',
      titre: 'Reconnaissance durable',
      description: 'Publications certifiées, compétences validées, réputation indexée. Votre profil parle pour vous.',
      icon: 'pi pi-verified',
    },
  ];

  ngOnInit() {
    this.http.get<HomeStats>('/api/dashboard/summary').subscribe({
      next: (d) => this.stats.set(d),
      error: () => this.stats.set(null),
    });
  }
}
