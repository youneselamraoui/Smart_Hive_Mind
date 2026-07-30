import { Component, Input, Output, EventEmitter, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { RatingModule } from 'primeng/rating';

function hashToHue(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return (Math.abs(hash) + 200) % 360;
}

@Component({
  selector: 'app-content-card',
  standalone: true,
  imports: [FormsModule, RouterLink, RatingModule],
  template: `
    <div class="card" [style.--card-gradient]="gradient()">
      @if (routerLink) {
        <a class="card__visual" [routerLink]="routerLink">
          <div class="card__cover" [style.background-image]="gradient()">
            @if (categoryIcon) {
              <i [class]="categoryIcon"></i>
            }
          </div>
          @if (category) {
            <span class="card__badge">{{ category }}</span>
          }
        </a>
      } @else {
        <div class="card__visual">
          <div class="card__cover" [style.background-image]="gradient()">
            @if (categoryIcon) {
              <i [class]="categoryIcon"></i>
            }
          </div>
          @if (category) {
            <span class="card__badge">{{ category }}</span>
          }
        </div>
      }

      <div class="card__body">
        @if (routerLink) {
          <a class="card__title" [routerLink]="routerLink">{{ title }}</a>
        } @else {
          <div class="card__title">{{ title }}</div>
        }

        @if (authorName) {
          <div class="card__author">
            <span class="card__avatar">{{ initials() }}</span>
            <span>{{ authorName }}</span>
          </div>
        }

        @if (metadata && metadata.length) {
          <div class="card__meta">
            @for (m of metadata; track m.label) {
              <span class="card__meta-tag">
                @if (m.icon) { <i [class]="m.icon"></i> }
                {{ m.value }}
              </span>
            }
          </div>
        }

        @if (rating !== undefined && rating !== null) {
          <div class="card__rating">
            <p-rating [(ngModel)]="rating" [stars]="5" readonly="true" />
            @if (showRatingValue !== false) {
              <span class="card__rating-value">{{ rating }}</span>
            }
          </div>
        }
      </div>

      @if (actionLabel) {
        <div class="card__foot">
          @if (actionRouterLink) {
            <a class="card__action" [routerLink]="actionRouterLink">
              @if (actionIcon) { <i [class]="actionIcon"></i> }
              {{ actionLabel }}
            </a>
          } @else {
            <button class="card__action" (click)="actionClick.emit()">
              @if (actionIcon) { <i [class]="actionIcon"></i> }
              {{ actionLabel }}
            </button>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    :host { display: flex; }

    .card {
      display: flex;
      flex-direction: column;
      background: var(--color-surface);
      border: 1px solid var(--line-200);
      border-radius: var(--radius-md);
      overflow: hidden;
      transition: border-color var(--transition), box-shadow var(--transition);
      width: 100%;
    }
    .card:hover {
      border-color: var(--honey-500);
      box-shadow: 0 4px 16px color-mix(in srgb, var(--honey-500) 8%, transparent);
    }

    .card__visual {
      position: relative;
      display: block;
      text-decoration: none;
      color: inherit;
    }

    .card__cover {
      height: 120px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2.5rem;
      color: rgba(255,255,255,0.7);
      position: relative;
    }
    .card__cover i { filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2)); }

    .card__badge {
      position: absolute;
      top: 10px;
      left: 10px;
      padding: 3px 10px;
      font-size: 0.68rem;
      font-weight: 700;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      border-radius: var(--radius-full);
      background: rgba(0,0,0,0.45);
      backdrop-filter: blur(6px);
      color: #fff;
      max-width: calc(100% - 20px);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .card__body {
      display: flex;
      flex-direction: column;
      gap: 10px;
      padding: 16px 18px;
      flex: 1;
    }

    .card__title {
      font-family: var(--font-heading);
      font-size: var(--text-base);
      font-weight: 700;
      color: var(--ink-900);
      text-decoration: none;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      line-clamp: 2;
      overflow: hidden;
      text-overflow: ellipsis;
      line-height: 1.35;
      transition: color var(--transition);
    }
    .card__title:hover { color: var(--honey-700); }

    .card__author {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: var(--text-sm);
      color: var(--ink-700);
    }

    .card__avatar {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: var(--line-200);
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: var(--font-heading);
      font-size: 0.65rem;
      font-weight: 700;
      color: var(--ink-700);
      flex-shrink: 0;
      text-transform: uppercase;
      line-height: 1;
    }

    .card__meta {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
    }

    .card__meta-tag {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 0.72rem;
      padding: 2px 8px;
      border-radius: var(--radius-full);
      background: var(--line-100);
      color: var(--ink-700);
      font-weight: 500;
      white-space: nowrap;
    }
    .card__meta-tag i { font-size: 0.65rem; }

    .card__rating {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .card__rating :host ::ng-deep .p-rating { gap: 1px; }
    .card__rating :host ::ng-deep .p-rating-item { cursor: default; }
    .card__rating :host ::ng-deep .p-rating-icon { font-size: 0.85rem; }
    .card__rating :host ::ng-deep .p-rating-icon-active { color: var(--honey-500); }
    .card__rating-value {
      font-family: var(--font-mono);
      font-size: var(--text-xs);
      color: var(--ink-600);
    }

    .card__foot {
      padding: 0 18px 16px;
      margin-top: auto;
    }

    .card__action {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      width: 100%;
      padding: 8px 14px;
      border: 1px solid var(--line-200);
      border-radius: var(--radius-sm);
      background: var(--color-surface);
      color: var(--ink-900);
      font-family: var(--font-body);
      font-size: var(--text-sm);
      font-weight: 600;
      cursor: pointer;
      text-decoration: none;
      transition: all var(--transition);
    }
    .card__action:hover {
      border-color: var(--honey-500);
      background: color-mix(in srgb, var(--honey-500) 6%, transparent);
    }
    .card__action i { font-size: 0.8rem; }
  `]
})
export class ContentCardComponent {
  @Input({ required: true }) title!: string;
  @Input() coverUrl?: string;
  @Input() category?: string;
  @Input() categoryIcon?: string;
  @Input() authorName?: string;
  @Input() metadata?: { icon?: string; label: string; value: string }[];
  @Input() rating?: number;
  @Input() showRatingValue?: boolean;
  @Input() actionLabel?: string;
  @Input() actionIcon?: string;
  @Input() routerLink?: string | any[];
  @Input() actionRouterLink?: string | any[];
  @Output() actionClick = new EventEmitter<void>();

  gradient = computed(() => {
    const src = this.title || 'default';
    const hue = hashToHue(src);
    const sat = 55 + (Math.abs(src.charCodeAt(0) || 0) % 20);
    const light1 = 58 + (Math.abs(src.charCodeAt(src.length - 1) || 0) % 12);
    const light2 = Math.max(light1 - 22, 15);
    const hue2 = (hue + 25 + (src.length % 15)) % 360;
    return `linear-gradient(135deg, hsl(${hue}, ${sat}%, ${light1}%) 0%, hsl(${hue2}, ${sat + 8}%, ${light2}%) 100%)`;
  });

  initials = computed(() => {
    if (!this.authorName) return '?';
    const parts = this.authorName.trim().split(/\s+/);
    return parts.slice(0, 2).map(p => p.charAt(0)).join('');
  });
}
