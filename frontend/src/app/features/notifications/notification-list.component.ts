import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { NotificationService } from '../../core/notification.service';

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
  selector: 'app-notification-list',
  standalone: true,
  imports: [RouterLink, DatePipe],
  template: `
    <div class="page">
      <div class="page-head">
        <div><h1>Notifications</h1></div>
        @if (service.items().length > 0 && service.count() > 0) {
          <button class="btn btn-outline btn-sm" (click)="markAllRead()">Tout marquer lu</button>
        }
      </div>

      @if (service.items().length === 0) {
        <div class="empty">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--line-200)" stroke-width="1" stroke-linecap="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
          <h3>Aucune notification</h3>
          <p>Vous serez notifié des événements, badges et activités.</p>
        </div>
      } @else {
        <div class="list">
          @for (n of service.items(); track n._id) {
            <div class="notif" [class.unread]="!n.lu">
              @if (!n.lu) { <span class="unread-dot"></span> }
              <div class="notif-icon" [innerHTML]="icon(n.type)"></div>
              <div class="notif-c">
                @if (n.lien) { <a [routerLink]="n.lien" class="notif-link">{{ n.message }}</a> }
                @else { <p>{{ n.message }}</p> }
                <span class="notif-time">{{ n.createdAt | date:'short' }}</span>
              </div>
              @if (!n.lu) {
                <button class="mark-btn" (click)="service.marquerLu(n._id)">Lu</button>
              }
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    :host { display: block; }
    .page { max-width: 700px; margin: 0 auto; }
    .page-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }
    .page-head h1 { font-size: var(--text-2xl); margin: 0; }

    .btn { display: inline-flex; align-items: center; gap: 6px; border-radius: var(--radius-sm); font-family: var(--font-body); font-size: var(--text-sm); font-weight: 600; cursor: pointer; transition: all var(--transition); text-decoration: none; }
    .btn-sm { padding: 6px 14px; }
    .btn-outline { background: var(--color-surface); border: 1px solid var(--line-200); color: var(--ink-900); }
    .btn-outline:hover { border-color: var(--ink-700); }

    .empty { display: flex; flex-direction: column; align-items: center; text-align: center; padding: 80px 20px; gap: 8px; }
    .empty h3 { font-size: var(--text-lg); margin: 0; }
    .empty p { font-size: var(--text-sm); color: var(--ink-700); margin: 0; }

    .list { display: flex; flex-direction: column; gap: 6px; }
    .notif { display: flex; align-items: flex-start; gap: 12px; padding: 14px 16px; background: var(--color-surface); border: 1px solid var(--line-200); border-radius: var(--radius-md); transition: border-color var(--transition); position: relative; }
    .notif.unread { background: var(--paper-100); padding-left: 28px; }
    .notif:hover { border-color: var(--ink-700); }
    .unread-dot { position: absolute; left: 12px; top: 20px; width: 6px; height: 6px; border-radius: 50%; background: var(--honey-500); flex-shrink: 0; }
    .notif-icon { flex-shrink: 0; width: 32px; height: 32px; border-radius: var(--radius-sm); display: flex; align-items: center; justify-content: center; color: var(--ink-700); background: var(--line-200); }
    .notif-icon :deep(svg) { width: 16px; height: 16px; }
    .notif-c { flex: 1; min-width: 0; }
    .notif-c p { margin: 0 0 4px; font-size: var(--text-sm); line-height: 1.35; }
    .notif-link { display: block; margin-bottom: 4px; font-size: var(--text-sm); line-height: 1.35; color: var(--ink-900); text-decoration: none; font-weight: 500; }
    .notif-link:hover { color: var(--honey-600); }
    .notif-time { font-size: var(--text-xs); color: var(--ink-700); font-family: var(--font-mono); }
    .mark-btn { flex-shrink: 0; background: none; border: 1px solid var(--line-200); padding: 4px 12px; border-radius: var(--radius-sm); font-size: var(--text-xs); font-weight: 500; cursor: pointer; color: var(--ink-700); transition: all var(--transition); white-space: nowrap; }
    .mark-btn:hover { background: var(--honey-500); color: var(--ink-900); border-color: var(--honey-500); }
  `]
})
export class NotificationListComponent implements OnInit {
  service = inject(NotificationService);
  icon(t: string) { return NOTIF_ICONS[t] || NOTIF_ICONS['systeme']; }

  ngOnInit() { this.service.load(); }
  markAllRead() { this.service.markAllRead(); }
}
