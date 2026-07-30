import { Component, inject, signal, computed, HostListener, OnInit } from '@angular/core';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { fadeInUp } from '../core/animations';
import { ToastComponent } from '../core/toast.component';
import { AiAssistantWidgetComponent } from '../features/ai/ai-assistant-widget.component';
import { NotificationBellComponent } from '../features/notifications/notification-bell.component';
import { ThemeToggleComponent } from '../core/theme-toggle.component';
import { ConfirmDialogComponent } from '../core/confirm-dialog.component';

export interface NavItem {
  label: string;
  route: string;
  iconClass: string;
  roles?: string[];
}

interface NavSection {
  name: string;
  items: NavItem[];
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
  role = signal<string | null>(null);
  sidebarOpen = signal(true);
  isMobile = signal(false);
  showScrollFab = signal(false);

  collapsedSections = signal<Set<string>>(this.loadCollapsed());

  private rawSections: NavSection[] = [
    {
      name: 'Général',
      items: [
        { label: 'Dashboard', route: '/dashboard', iconClass: 'pi pi-home' },
        { label: 'Mon profil', route: '/profile', iconClass: 'pi pi-user' },
      ],
    },
    {
      name: 'Publications',
      items: [
        { label: 'Publications', route: '/publications', iconClass: 'pi pi-file' },
      ],
    },
    {
      name: 'Communauté',
      items: [
        { label: 'Communauté', route: '/communaute', iconClass: 'pi pi-comments' },
        { label: 'Groupements', route: '/communaute/groupements', iconClass: 'pi pi-users' },
        { label: 'Sondages', route: '/communaute/sondages', iconClass: 'pi pi-question-circle' },
        { label: 'Témoignages', route: '/communaute/temoignages', iconClass: 'pi pi-comment' },
      ],
    },
    {
      name: 'Smart Tools & IA',
      items: [
        { label: 'Smart Tools', route: '/smart-tools', iconClass: 'pi pi-cog' },
        { label: 'IA', route: '/ai', iconClass: 'pi pi-bolt' },
        { label: 'Datasets', route: '/dataset', iconClass: 'pi pi-database' },
      ],
    },
    {
      name: 'Marketplace',
      items: [
        { label: 'Marketplace', route: '/marketplace', iconClass: 'pi pi-shopping-bag' },
        { label: 'Bounties', route: '/marketplace/bounties', iconClass: 'pi pi-briefcase' },
        { label: 'Missions', route: '/marketplace/missions', iconClass: 'pi pi-send' },
        { label: 'Validations', route: '/marketplace/validations', iconClass: 'pi pi-check-circle' },
      ],
    },
    {
      name: 'Entrepreneuriat',
      items: [
        { label: 'Entrepreneuriat', route: '/entrepreneuriat', iconClass: 'pi pi-chart-line' },
        { label: 'Crowdfunding', route: '/crowdfunding', iconClass: 'pi pi-credit-card' },
      ],
    },
    {
      name: 'Carrière',
      items: [
        { label: 'Placements', route: '/placements', iconClass: 'pi pi-briefcase' },
      ],
    },
    {
      name: 'Événements',
      items: [
        { label: 'Événements', route: '/evenements', iconClass: 'pi pi-calendar' },
      ],
    },
    {
      name: 'Compétences',
      items: [
        { label: 'Skills', route: '/skills', iconClass: 'pi pi-book' },
      ],
    },
    {
      name: 'Administration',
      items: [
        { label: 'Administration', route: '/admin', iconClass: 'pi pi-shield', roles: ['admin'] },
      ],
    },
  ];

  private sections = this.rawSections.map(s => ({
    ...s,
    items: s.items.map(item => ({ ...item, route: `/app${item.route}` })),
  }));

  visibleSections = computed(() => {
    const currentRole = this.role();
    return this.sections
      .map(section => ({
        ...section,
        items: section.items.filter(item => {
          if (!item.roles) return true;
          if (!currentRole) return false;
          return item.roles.includes(currentRole);
        }),
      }))
      .filter(section => section.items.length > 0);
  });

  bottomNavItems = computed(() =>
    this.visibleSections().flatMap(s => s.items).slice(0, 5),
  );

  constructor() {
    this.checkScreen();
  }

  ngOnInit() {
    this.http.get<{ role: string }>('/api/auth/me').subscribe({
      next: (m) => this.role.set(m.role),
      error: () => this.role.set(null),
    });
  }

  isSectionExpanded(name: string): boolean {
    return !this.collapsedSections().has(name);
  }

  toggleSection(name: string) {
    this.collapsedSections.update(set => {
      const next = new Set(set);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      this.persistCollapsed(next);
      return next;
    });
  }

  private persistCollapsed(set: Set<string>) {
    localStorage.setItem('sidebar-collapsed', JSON.stringify([...set]));
  }

  private loadCollapsed(): Set<string> {
    try {
      const raw = localStorage.getItem('sidebar-collapsed');
      return new Set(raw ? JSON.parse(raw) : []);
    } catch {
      return new Set();
    }
  }

  onSearch(value: string) {
    this.searchQuery = value;
  }

  doSearch() {
    if (this.searchQuery.trim()) {
      this.router.navigate(['/app/recherche'], { queryParams: { q: this.searchQuery } });
    }
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
