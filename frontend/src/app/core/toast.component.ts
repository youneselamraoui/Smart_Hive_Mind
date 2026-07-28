import { Component, inject } from '@angular/core';
import { ToastService } from './toast.service';
import { fadeInUp } from './animations';

@Component({
  selector: 'app-toast',
  standalone: true,
  template: `
    <div class="toast-container">
      @for (t of toastService.toasts(); track t.id) {
        <div class="toast" [class]="'toast-' + t.type" @fadeInUp>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            @if (t.type === 'success') {
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
            } @else if (t.type === 'error') {
              <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
            } @else {
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
            }
          </svg>
          <span>{{ t.message }}</span>
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed; bottom: 24px; right: 24px; z-index: 9999;
      display: flex; flex-direction: column; gap: 8px; max-width: 360px;
    }
    .toast {
      display: flex; align-items: center; gap: 10px;
      padding: 12px 18px; border-radius: var(--radius-sm);
      font-size: 0.85rem; font-weight: 500; box-shadow: var(--shadow-lg);
      pointer-events: auto;
    }
    .toast-success { background: rgba(31,158,109,0.12); color: var(--verify-500); border: 1px solid rgba(31,158,109,0.3); }
    .toast-error { background: rgba(196,67,46,0.12); color: var(--alert-500); border: 1px solid rgba(196,67,46,0.3); }
    .toast-info { background: rgba(91,79,224,0.12); color: var(--agentic-500); border: 1px solid rgba(91,79,224,0.3); }
    .toast svg { flex-shrink: 0; }
    @media (max-width: 767px) {
      .toast-container { left: 16px; right: 16px; bottom: 80px; max-width: none; }
    }
  `]
})
export class ToastComponent {
  protected readonly toastService = inject(ToastService);
}
