import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-paginator',
  standalone: true,
  template: `
    <div class="paginator">
      <button (click)="changePage(currentPage() - 1)" [disabled]="currentPage() <= 1">Précédent</button>
      <span>Page {{ currentPage() }} / {{ totalPages() }}</span>
      <button (click)="changePage(currentPage() + 1)" [disabled]="currentPage() >= totalPages()">Suivant</button>
    </div>
  `,
  styles: [`
    .paginator { display: flex; align-items: center; justify-content: center; gap: 16px; margin-top: 24px; padding: 12px 0; }
    .paginator button { padding: 6px 16px; border: 1.5px solid var(--color-border); border-radius: var(--radius-sm); background: var(--color-surface); color: var(--color-text); font-size: 0.82rem; cursor: pointer; }
    .paginator button:disabled { opacity: 0.4; cursor: not-allowed; }
    .paginator button:hover:not(:disabled) { border-color: var(--color-primary-blue); color: var(--color-primary-blue); }
    .paginator span { font-size: 0.82rem; color: var(--color-text-secondary); }
  `]
})
export class PaginatorComponent {
  currentPage = input.required<number>();
  totalPages = input.required<number>();
  pageChange = output<number>();

  changePage(page: number) {
    if (page >= 1 && page <= this.totalPages()) {
      this.pageChange.emit(page);
    }
  }
}
