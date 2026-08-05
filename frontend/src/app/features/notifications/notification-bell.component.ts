import { Component, inject, signal, HostListener } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { NotificationService } from '../../core/notification.service';
import { SafeHtmlPipe } from '../../core/safe-html.pipe';

const NOTIF_ICONS: Record<string, string> = {
  evenement: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`,
  bounty: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5"/><polyline points="2 8.5 12 15 22 8.5"/></svg>`,
  mission: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`,
  badge: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg>`,
  candidature: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>`,
  discussion: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`,
  sujet: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg>`,
  formation: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>`,
  mentorat: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>`,
  systeme: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`,
};

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [RouterLink, DatePipe, SafeHtmlPipe],
  template: `
    <div class="wrapper" (click)="toggle()">
      <button class="bell" aria-label="Notifications">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
        @if (service.count() > 0) { <span class="badge">{{ service.count() }}</span> }
      </button>

      @if (open()) {
        <div class="drop" (click)="$event.stopPropagation()">
          <div class="drop-head">
            <span>Notifications</span>
            @if (service.count() > 0) { <button class="mark-all" (click)="markAllRead()">Tout marquer lu</button> }
          </div>
          <div class="drop-body">
            @for (n of service.items().slice(0, 5); track n._id) {
              <div class="notif" [class.unread]="!n.lu">
                @if (!n.lu) { <span class="unread-dot"></span> }
                <div class="notif-icon" [innerHTML]="icon(n.type) | safeHtml"></div>
                <div class="notif-c">
                  <p>{{ n.message }}</p>
                  <span class="notif-time">{{ n.createdAt | date:'short' }}</span>
                </div>
                @if (!n.lu) {
                  <button class="mark-btn" (click)="service.marquerLu(n._id); $event.stopPropagation()">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                  </button>
                }
              </div>
            } @empty {
              <div class="empty-drop">Aucune notification</div>
            }
          </div>
          <div class="drop-foot"><a routerLink="/notifications" (click)="open.set(false)">Voir toutes</a></div>
        </div>
      }
    </div>
  `,
  styles: [`
    :host { position: relative; }
    .wrapper { display: inline-block; }
    .bell { position: relative; background: none; border: none; cursor: pointer; padding: 6px; border-radius: var(--radius-sm); color: var(--ink-700); display: flex; align-items: center; transition: all var(--transition); }
    .bell:hover { background: var(--line-200); }
    .badge { position: absolute; top: 0; right: 0; transform: translate(25%, -25%); background: var(--honey-500); color: var(--ink-900); font-size: 0.6rem; font-weight: 700; min-width: 16px; height: 16px; border-radius: 999px; display: flex; align-items: center; justify-content: center; padding: 0 4px; line-height: 1; }
    .drop { position: absolute; top: calc(100% + 8px); right: 0; z-index: 1050; width: 360px; background: var(--color-surface); border: 1px solid var(--line-200); border-radius: var(--radius-md); box-shadow: 0 12px 40px rgba(0,0,0,0.12); overflow: hidden; }
    .drop-head { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; border-bottom: 1px solid var(--line-200); font-weight: 600; font-size: var(--text-sm); }
    .mark-all { background: none; border: none; cursor: pointer; font-size: var(--text-xs); color: var(--ink-700); font-weight: 500; padding: 0; }
    .mark-all:hover { color: var(--ink-900); }
    .drop-body { max-height: 340px; overflow-y: auto; }
    .notif { display: flex; align-items: flex-start; gap: 10px; padding: 10px 16px; transition: background var(--transition); cursor: default; position: relative; }
    .notif.unread { background: var(--paper-100); }
    .notif:hover { background: var(--paper-100); }
    .unread-dot { position: absolute; left: 6px; top: 16px; width: 6px; height: 6px; border-radius: 50%; background: var(--honey-500); flex-shrink: 0; }
    .notif-icon { flex-shrink: 0; width: 28px; height: 28px; border-radius: var(--radius-sm); display: flex; align-items: center; justify-content: center; color: var(--ink-700); background: var(--line-200); }
    .notif-icon :deep(svg) { width: 14px; height: 14px; }
    .notif-c { flex: 1; min-width: 0; padding-left: 4px; }
    .notif-c p { margin: 0; font-size: var(--text-sm); line-height: 1.3; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    .notif-time { font-size: 0.65rem; color: var(--ink-700); }
    .mark-btn { flex-shrink: 0; background: none; border: none; cursor: pointer; padding: 4px; border-radius: 50%; color: var(--ink-700); display: flex; align-items: center; }
    .mark-btn:hover { background: var(--line-200); color: var(--verify-500); }
    .empty-drop { text-align: center; padding: 32px 16px; font-size: var(--text-sm); color: var(--ink-700); }
    .drop-foot { border-top: 1px solid var(--line-200); padding: 10px 16px; text-align: center; }
    .drop-foot a { font-size: var(--text-sm); font-weight: 500; color: var(--ink-700); text-decoration: none; }
    .drop-foot a:hover { color: var(--ink-900); }
    @media (max-width: 480px) { .drop { position: fixed; top: 56px; left: 0; right: 0; width: auto; border-radius: 0; max-height: calc(100vh - 56px); } }
  `]
})
export class NotificationBellComponent {
  service = inject(NotificationService);
  open = signal(false);
  icon(t: string) { return NOTIF_ICONS[t] || NOTIF_ICONS['systeme']; }

  toggle() { this.open.update(v => !v); if (this.open()) this.service.load(); }
  @HostListener('document:click') close() { this.open.set(false); }
  markAllRead() { this.service.markAllRead(); }
}
