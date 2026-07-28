import { Component, inject, signal, computed, HostListener, OnInit } from '@angular/core';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { fadeInUp } from '../core/animations';
import { ICONS } from '../core/icons';
import { ToastComponent } from '../core/toast.component';
import { AiAssistantWidgetComponent } from '../features/ai/ai-assistant-widget.component';
import { NotificationBellComponent } from '../features/notifications/notification-bell.component';
import { ThemeToggleComponent } from '../core/theme-toggle.component';
import { ConfirmDialogComponent } from '../core/confirm-dialog.component';

interface NavItem {
  label: string;
  route: string;
  icon: string;
  roles?: string[];
}

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, ToastComponent, AiAssistantWidgetComponent, NotificationBellComponent, ThemeToggleComponent, ConfirmDialogComponent],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.css',
  animations: [fadeInUp],
})
export class MainLayoutComponent implements OnInit {
  private router = inject(Router);
  private http = inject(HttpClient);

  searchQuery = '';

  onSearch(value: string) {
    this.searchQuery = value;
  }

  doSearch() {
    if (this.searchQuery.trim()) {
      this.router.navigate(['/app/recherche'], { queryParams: { q: this.searchQuery } });
    }
  }

  sidebarOpen = signal(true);
  isMobile = signal(false);
  showScrollFab = signal(false);

  role = signal<string | null>(null);

  navItems: NavItem[] = [
    { label: 'Dashboard', route: '/dashboard', icon: ICONS.dashboard },
    { label: 'Mon profil', route: '/profile', icon: ICONS.dashboard },
    { label: 'Publications', route: '/publications', icon: ICONS.publications },
    { label: 'Communauté', route: '/communaute', icon: ICONS.communaute },
    { label: 'Groupements', route: '/communaute/groupements', icon: ICONS.communaute },
    { label: 'Smart Tools', route: '/smart-tools', icon: ICONS['smart-tools'] },
    { label: 'Marketplace', route: '/marketplace', icon: ICONS.marketplace },
    { label: 'Entrepreneuriat', route: '/entrepreneuriat', icon: ICONS.entrepreneuriat },
    { label: 'Placements', route: '/placements', icon: ICONS.placements },
    { label: 'Événements', route: '/evenements', icon: ICONS.evenements },
    { label: 'Skills', route: '/skills', icon: ICONS.skills },
    { label: 'Sondages', route: '/communaute/sondages', icon: ICONS.vote },
    { label: 'Témoignages', route: '/communaute/temoignages', icon: ICONS.forum },
    { label: 'Bounties', route: '/marketplace/bounties', icon: ICONS.briefcase },
    { label: 'Missions', route: '/marketplace/missions', icon: ICONS.briefcase },
    { label: 'Validations', route: '/marketplace/validations', icon: ICONS.clipboard },
    { label: 'Crowdfunding', route: '/crowdfunding', icon: ICONS.crowdfunding },
    { label: 'Datasets', route: '/dataset', icon: ICONS['smart-tools'] },
    { label: 'Administration', route: '/admin', icon: ICONS.dashboard, roles: ['admin'] },
    { label: 'IA', route: '/ai', icon: ICONS['smart-tools'] },
    { label: 'Créer un événement', route: '/evenements/new', icon: ICONS.evenements, roles: ['encadrant', 'admin'] },
    { label: 'Créer une offre', route: '/marketplace/offres/new', icon: ICONS.briefcase, roles: ['encadrant', 'admin'] },
    { label: 'Créer une bourse', route: '/marketplace/bourses/new', icon: ICONS.placements, roles: ['encadrant', 'admin'] },
    { label: 'Créer un sujet', route: '/communaute/sujets/new', icon: ICONS.communaute },
    { label: 'Créer un sondage', route: '/communaute/sondages/new', icon: ICONS.communaute },
    { label: 'Témoigner', route: '/communaute/temoignages/new', icon: ICONS.communaute },
    { label: 'Business plan', route: '/entrepreneuriat/business-plans/new', icon: ICONS.entrepreneuriat },
    { label: 'Demander mentorat', route: '/entrepreneuriat/mentorats/demander', icon: ICONS.entrepreneuriat },
    { label: 'Nouvelle mission', route: '/marketplace/missions/new', icon: ICONS.marketplace, roles: ['encadrant', 'admin'] },
    { label: 'Nouvelle validation', route: '/marketplace/validations/new', icon: ICONS.marketplace, roles: ['encadrant', 'admin'] },
    { label: 'Nouvelle campagne', route: '/crowdfunding/new', icon: ICONS.crowdfunding, roles: ['encadrant', 'admin'] },
  ];

  visibleNavItems = computed(() => {
    const currentRole = this.role();
    return this.navItems.filter(item => {
      if (!item.roles) return true;
      if (!currentRole) return false;
      return item.roles.includes(currentRole);
    });
  });

  constructor() {
    this.navItems = this.navItems.map(item => ({ ...item, route: `/app${item.route}` }));
    this.checkScreen();
  }

  ngOnInit() {
    this.http.get<{ role: string }>('/api/auth/me').subscribe({
      next: (m) => this.role.set(m.role),
      error: () => this.role.set(null),
    });
  }

  @HostListener('window:scroll')
  onScroll() {
    this.showScrollFab.set(window.scrollY > 300);
  }

  scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  @HostListener('window:resize')
  checkScreen() {
    const mobile = window.innerWidth < 768;
    this.isMobile.set(mobile);
    if (mobile) this.sidebarOpen.set(false);
    else this.sidebarOpen.set(true);
  }

  toggleSidebar() {
    this.sidebarOpen.update(v => !v);
  }

  closeSidebar() {
    if (this.isMobile()) this.sidebarOpen.set(false);
  }

  logout() {
    this.http.post('/api/auth/deconnexion', {}).subscribe({
      complete: () => {
        localStorage.removeItem('membreId');
        this.router.navigate(['/login']);
      },
    });
  }
}
