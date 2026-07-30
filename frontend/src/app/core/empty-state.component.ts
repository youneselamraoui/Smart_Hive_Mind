import { Component, Input, Output, EventEmitter } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="empty-state" [class.empty-state--compact]="compact">
      @if (icon) {
        <div class="empty-state__icon"><i [class]="icon"></i></div>
      }
      @if (title) {
        <h3 class="empty-state__title">{{ title }}</h3>
      }
      @if (description) {
        <p class="empty-state__desc">{{ description }}</p>
      }
      @if (actionLabel) {
        <div class="empty-state__actions">
          @if (actionRouterLink) {
            <a class="empty-state__btn" [routerLink]="actionRouterLink">
              @if (actionIcon) { <i [class]="actionIcon"></i> }
              {{ actionLabel }}
            </a>
          } @else {
            <button class="empty-state__btn" (click)="action.emit()">
              @if (actionIcon) { <i [class]="actionIcon"></i> }
              {{ actionLabel }}
            </button>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      padding: 60px 24px;
      color: var(--ink-700);
    }
    .empty-state--compact { padding: 32px 16px; }

    .empty-state__icon {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: var(--line-100);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.4rem;
      color: var(--ink-500);
      margin-bottom: 16px;
    }
    .empty-state--compact .empty-state__icon {
      width: 40px;
      height: 40px;
      font-size: 1rem;
      margin-bottom: 12px;
    }

    .empty-state__title {
      font-family: var(--font-heading);
      font-size: var(--text-lg);
      font-weight: 700;
      color: var(--ink-900);
      margin: 0 0 6px;
    }
    .empty-state--compact .empty-state__title { font-size: var(--text-base); }

    .empty-state__desc {
      font-size: var(--text-sm);
      color: var(--ink-700);
      margin: 0 0 20px;
      max-width: 320px;
      line-height: 1.5;
    }
    .empty-state--compact .empty-state__desc { margin-bottom: 14px; }

    .empty-state__actions { display: flex; gap: 10px; }

    .empty-state__btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 9px 20px;
      border: none;
      border-radius: var(--radius-sm);
      background: var(--honey-500);
      color: var(--ink-900);
      font-family: var(--font-body);
      font-size: var(--text-sm);
      font-weight: 600;
      cursor: pointer;
      text-decoration: none;
      transition: all var(--transition);
    }
    .empty-state__btn:hover {
      background: var(--honey-600);
      transform: translateY(-1px);
    }
    .empty-state__btn i { font-size: 0.8rem; }
  `]
})
export class EmptyStateComponent {
  @Input() icon?: string;
  @Input() title?: string;
  @Input() description?: string;
  @Input() actionLabel?: string;
  @Input() actionIcon?: string;
  @Input() actionRouterLink?: string | any[];
  @Input() compact = false;
  @Output() action = new EventEmitter<void>();
}
