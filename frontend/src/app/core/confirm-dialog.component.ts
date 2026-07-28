import { Component, inject } from '@angular/core';
import { ConfirmDialogService } from './confirm-dialog.service';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  template: `
    @if (service.visible()) {
      <div class="overlay" (click)="service.cancel()">
        <div class="dialog" (click)="$event.stopPropagation()">
          <p>{{ service.message() }}</p>
          <div class="actions">
            <button class="btn-cancel" (click)="service.cancel()">Annuler</button>
            <button class="btn-confirm" (click)="service.accept()">Confirmer</button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; z-index: 10000; }
    .dialog { background: var(--color-surface); border-radius: var(--radius-md); padding: 28px; max-width: 400px; width: 90%; box-shadow: var(--shadow-lg); }
    .dialog p { margin: 0 0 20px; font-size: 0.95rem; color: var(--color-text); }
    .actions { display: flex; gap: 12px; justify-content: flex-end; }
    .btn-cancel { padding: 8px 20px; border: 1.5px solid var(--color-border); border-radius: var(--radius-sm); background: none; color: var(--color-text-secondary); font-size: 0.85rem; cursor: pointer; }
    .btn-confirm { padding: 8px 20px; border: none; border-radius: var(--radius-sm); background: var(--alert-500); color: #fff; font-size: 0.85rem; cursor: pointer; }
    .btn-confirm:hover { background: color-mix(in srgb, var(--alert-500) 85%, black); }
  `]
})
export class ConfirmDialogComponent {
  protected readonly service = inject(ConfirmDialogService);
}
