import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { HexSealComponent } from '../../core/hex-seal.component';
import { ICONS } from '../../core/icons';

interface HomeStats {
  totalMembres?: number;
  totalPublications?: number;
  totalMissions?: number;
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
  protected readonly icons = ICONS;
  // Chiffres réels tirés du dashboard — jamais de statistiques inventées
  // sur une page qui promet justement "la confiance ne se déclare pas".
  protected readonly stats = signal<HomeStats | null>(null);

  ngOnInit() {
    this.http.get<HomeStats>('/api/dashboard/summary').subscribe({
      next: (d) => this.stats.set(d),
      error: () => this.stats.set(null), // section masquée si indisponible, jamais de faux chiffres
    });
  }
}