import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-hex-seal',
  standalone: true,
  template: `
    <div class="hex-seal" [class]="'hex--' + status" [style.width.px]="size" [style.height.px]="size">
      <svg class="hex-shape" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <polygon class="hex-border"
          points="50 4 90 27 90 73 50 96 10 73 10 27"
          stroke="currentColor" stroke-width="2.5"
          [attr.fill]="'var(--hex-fill, transparent)'" />
      </svg>
      <span class="hex-icon">
        @if (status === 'valide' || status === 'ancre') {
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        } @else if (status === 'en_attente') {
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        } @else {
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
        }
      </span>
      @if (hash) {
        <span class="hex-hash">{{ truncatedHash }}</span>
      }
    </div>
  `,
  styles: [`
    :host { display: inline-flex; }
    .hex-seal {
      position: relative;
      display: inline-flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      transition: transform 300ms cubic-bezier(0.34, 1.56, 0.64, 1), filter 300ms ease;
      cursor: default;
      flex-shrink: 0;
    }
    .hex-seal:hover {
      transform: rotate(3deg);
      filter: drop-shadow(0 4px 12px rgba(91,79,224,0.30));
    }
    .hex-shape {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
    }
    .hex--ancre .hex-border,
    .hex--valide .hex-border { color: var(--verify-500, #1F9E6D); }
    .hex--en_attente .hex-border { color: var(--honey-500, #5B4FE0); }
    .hex--echec .hex-border { color: var(--alert-500, #C4432E); }
    .hex-icon {
      position: relative;
      z-index: 1;
      width: 36%;
      height: 36%;
    }
    .hex-icon :deep(svg) { width: 100%; height: 100%; }
    .hex--ancre .hex-icon,
    .hex--valide .hex-icon { color: var(--verify-500, #1F9E6D); }
    .hex--en_attente .hex-icon { color: var(--honey-500, #5B4FE0); }
    .hex--echec .hex-icon { color: var(--alert-500, #C4432E); }
    .hex-hash {
      position: absolute;
      bottom: 14%;
      font-family: var(--font-mono, 'IBM Plex Mono', monospace);
      font-size: 0.55em;
      letter-spacing: 0.02em;
      color: var(--ink-700, #2A2F45);
      background: var(--paper-50, #F6F5F2);
      padding: 1px 6px;
      border-radius: 4px;
      line-height: 1.4;
      white-space: nowrap;
    }
    .hex--echec .hex-hash { color: var(--alert-500, #C4432E); }
  `]
})
export class HexSealComponent {
  @Input() status: 'ancre' | 'en_attente' | 'echec' | 'valide' = 'valide';
  @Input() hash?: string;
  @Input() size: number = 64;

  get truncatedHash(): string {
    const h = this.hash;
    if (!h || h.length <= 12) return h || '';
    return h.slice(0, 6) + '…' + h.slice(-4);
  }
}
