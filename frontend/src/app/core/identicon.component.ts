import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-identicon',
  standalone: true,
  template: `
    <svg viewBox="0 0 24 24" [attr.width]="size ?? undefined" [attr.height]="size ?? undefined" fill="none" xmlns="http://www.w3.org/2000/svg">
      @for (cell of cells; track $index) {
        <rect [attr.x]="cell.x" [attr.y]="cell.y" width="5" height="5" rx="1" [attr.fill]="cell.fill" opacity="0.8"/>
      }
    </svg>
  `,
})
export class IdenticonComponent {
  @Input() id = '';
  @Input() name = '';
  @Input() size?: number;

  get cells(): { x: number; y: number; fill: string }[] {
    let hash = 0;
    const str = this.id || this.name;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    const hue = Math.abs(hash % 360);
    const cells: { x: number; y: number; fill: string }[] = [];
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        const ci = r * 4 + (c < 2 ? c : 3 - c);
        const on = ((hash >> (ci % 16)) & 1) === 1;
        if (on) cells.push({ x: c * 5 + 2, y: r * 5 + 2, fill: `hsl(${hue},40%,${50 + (ci % 3) * 12}%)` });
      }
    }
    return cells;
  }
}
