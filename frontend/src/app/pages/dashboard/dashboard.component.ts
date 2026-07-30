import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';

import { ChartModule } from 'primeng/chart';
import { SkeletonModule } from 'primeng/skeleton';
import { HexSealComponent } from '../../core/hex-seal.component';
import { EmptyStateComponent } from '../../core/empty-state.component';

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

interface ActivityItem {
  type: 'publication' | 'evenement' | 'mission' | 'idee' | 'membre';
  label: string;
  route: string;
  timestamp: string;
  date: Date;
}

interface CounterCard {
  label: string;
  key: keyof DashboardData;
  icon: string;
  route: string;
  accent: string;
  sparkline: number[];
}

function noAxisOpts(color: string): any {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { enabled: false } },
    scales: { x: { display: false }, y: { display: false } },
    elements: { point: { radius: 0 }, line: { borderWidth: 1.5, tension: 0.3 } },
    borderColor: color,
    backgroundColor: color + '15',
  };
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, HexSealComponent, ChartModule, SkeletonModule, EmptyStateComponent],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class DashboardComponent implements OnInit {
  private http = inject(HttpClient);

  data = signal<DashboardData | null>(null);
  loaded = signal(false);
  activity = signal<ActivityItem[]>([]);
  activityLoading = signal(false);

  readonly counterCards: CounterCard[] = [
    { label: 'Publications', key: 'totalPublications', icon: 'pi pi-file', route: '/app/publications', accent: 'var(--indigo-500)', sparkline: [4, 6, 5, 8, 12, 10, 14] },
    { label: 'Missions', key: 'totalMissions', icon: 'pi pi-briefcase', route: '/app/placements', accent: 'var(--success-500)', sparkline: [2, 3, 1, 5, 4, 7, 6] },
    { label: 'Discussions', key: 'totalSujets', icon: 'pi pi-comments', route: '/app/communaute', accent: 'var(--info-500)', sparkline: [8, 10, 7, 12, 9, 15, 11] },
    { label: 'Événements', key: 'totalEvenements', icon: 'pi pi-calendar', route: '/app/evenements', accent: 'var(--warning-500)', sparkline: [1, 2, 4, 3, 5, 4, 6] },
    { label: 'Idées', key: 'totalIdees', icon: 'pi pi-lightbulb', route: '/app/entrepreneuriat', accent: 'var(--indigo-400)', sparkline: [3, 5, 2, 4, 6, 5, 7] },
    { label: 'Offres', key: 'totalOffres', icon: 'pi pi-shopping-bag', route: '/app/placements', accent: 'var(--error-500)', sparkline: [5, 4, 6, 8, 7, 9, 10] },
    { label: 'Formations', key: 'totalFormations', icon: 'pi pi-book', route: '/app/skills', accent: 'var(--info-600)', sparkline: [2, 3, 1, 4, 3, 5, 6] },
  ];

  /* ── Hero sparkline charts (PrimeNG Chart line, no axes) ─────────── */
  heroChartData(n: number) {
    const sets = [
      [3, 5, 7, 8, 9, 11, 12], [2, 2, 4, 5, 6, 7, 8], [1, 2, 2, 3, 4, 5, 5],
    ];
    const vals = sets[n] || sets[0];
    return { labels: ['', '', '', '', '', '', ''], datasets: [{ data: vals, fill: true }] };
  }

  heroChartOpts(n: number) {
    const colors = ['#5B4FE0', '#1F9E6D', '#3B82F6'];
    return noAxisOpts(colors[n] || colors[0]);
  }

  /* ── Weekly bar chart data ──────────────────────────────────────── */
  weeklyData = computed(() => {
    const d = this.data();
    const labels = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
    const estimated = [
      Math.round((d?.totalPublications ?? 0) * 0.2),
      Math.round((d?.totalPublications ?? 0) * 0.15),
      Math.round((d?.totalPublications ?? 0) * 0.25),
      Math.round((d?.totalPublications ?? 0) * 0.1),
      Math.round((d?.totalPublications ?? 0) * 0.2),
      Math.round((d?.totalPublications ?? 0) * 0.05),
      Math.round((d?.totalPublications ?? 0) * 0.05),
    ];
    return {
      labels,
      datasets: [{
        label: 'Publications',
        data: estimated,
        backgroundColor: 'rgba(91,79,224,0.55)',
        borderColor: '#5B4FE0',
        borderWidth: 1,
        borderRadius: 4,
      }],
    };
  });

  weeklyOpts: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 10 } } },
      y: { grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { font: { size: 10 }, stepSize: 1 } },
    },
  };

  /* ── Helpers ─────────────────────────────────────────────────────── */
  isZero(val: number | undefined | null): boolean {
    return !val || val === 0;
  }

  getValue(key: keyof DashboardData): number {
    const v = this.data()?.[key];
    return typeof v === 'number' ? v : 0;
  }

  hasValue(key: keyof DashboardData): boolean {
    const v = this.data()?.[key];
    return typeof v === 'number' && v > 0;
  }

  isEmpty(): boolean {
    const d = this.data();
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

  sparklinePoints(data: number[], width = 100, height = 28): string {
    if (!data.length) return '';
    const max = Math.max(...data, 1);
    const stepX = width / (data.length - 1);
    return data.map((v, i) => `${i * stepX},${height - (v / max) * (height - 4) - 2}`).join(' ');
  }

  sparklineArea(data: number[], width = 100, height = 28): string {
    if (!data.length) return '';
    const max = Math.max(...data, 1);
    const stepX = width / (data.length - 1);
    const pts = data.map((v, i) => `${i * stepX},${height - (v / max) * (height - 4) - 2}`);
    return `0,${height} ` + pts.join(' ') + ` ${width},${height}`;
  }

  relativeTime(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'à l\'instant';
    if (mins < 60) return `il y a ${mins}min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `il y a ${hours}h`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `il y a ${days}j`;
    return date.toLocaleDateString('fr-FR');
  }

  activityIcon(type: string): string {
    const icons: Record<string, string> = {
      publication: 'pi pi-file',
      evenement: 'pi pi-calendar',
      mission: 'pi pi-briefcase',
      idee: 'pi pi-lightbulb',
      membre: 'pi pi-user',
    };
    return icons[type] || 'pi pi-circle';
  }

  hasActivity = computed(() => this.activity().length > 0);
  hasChartData = computed(() => {
    const d = this.data();
    return (d?.totalPublications ?? 0) > 0 || (d?.totalEvenements ?? 0) > 0;
  });

  ngOnInit() {
    this.http.get<DashboardData>('/api/dashboard/summary').subscribe({
      next: d => { this.data.set(d); this.loaded.set(true); },
      error: () => { this.data.set({} as DashboardData); this.loaded.set(true); },
    });

    this.activityLoading.set(true);
    const pub$ = this.http.get<any[]>('/api/publications');
    const evt$ = this.http.get<any[]>('/api/evenements');
    pub$.subscribe({
      next: pubs => {
        const fromPubs: ActivityItem[] = (pubs || []).slice(0, 5).map(p => ({
          type: 'publication' as const,
          label: p.titre || 'Publication',
          route: '/app/publications/' + p._id,
          timestamp: p.createdAt,
          date: new Date(p.createdAt),
        }));
        evt$.subscribe({
          next: evts => {
            const fromEvts: ActivityItem[] = (evts || []).slice(0, 5).map(e => ({
              type: 'evenement' as const,
              label: e.titre || 'Événement',
              route: '/app/evenements/' + e._id,
              timestamp: e.createdAt,
              date: new Date(e.createdAt),
            }));
            const merged = [...fromPubs, ...fromEvts]
              .sort((a, b) => b.date.getTime() - a.date.getTime())
              .slice(0, 8);
            this.activity.set(merged);
            this.activityLoading.set(false);
          },
          error: () => {
            this.activity.set(fromPubs);
            this.activityLoading.set(false);
          },
        });
      },
      error: () => this.activityLoading.set(false),
    });
  }
}
