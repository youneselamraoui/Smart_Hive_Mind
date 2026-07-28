import { Component, signal } from '@angular/core';
import { PrestationListComponent } from './prestation-list.component';
import { BountyListComponent } from './bounty-list.component';
import { TacheCrowdsourcingBoardComponent } from './tache-crowdsourcing-board.component';
import { OffreListComponent } from './offre-list.component';
import { BourseListComponent } from './bourse-list.component';

@Component({
  selector: 'app-marketplace',
  standalone: true,
  imports: [PrestationListComponent, BountyListComponent, TacheCrowdsourcingBoardComponent, OffreListComponent, BourseListComponent],
  template: `
    <div class="page">
      <div class="page-head">
        <h1>Marketplace</h1>
        <p>Prestations, bounties, offres et opportunités</p>
      </div>

      <div class="tabs">
        @for (tab of tabs; track tab.key; let i = $index) {
          <button class="tab" [class.tab--active]="activeTab() === tab.key" (click)="activeTab.set(tab.key)">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" [innerHTML]="tab.icon"></svg>
            {{ tab.label }}
          </button>
        }
        <div class="tab-indicator" [style.transform]="'translateX(' + activeIndex() * 100 + '%)'"></div>
      </div>

      <div class="tab-content">
        @if (activeTab() === 'prestations') { <app-prestation-list /> }
        @if (activeTab() === 'bounties') { <app-bounty-list /> }
        @if (activeTab() === 'crowdsourcing') { <app-tache-crowdsourcing-board /> }
        @if (activeTab() === 'offres') { <app-offre-list /> }
        @if (activeTab() === 'bourses') { <app-bourse-list /> }
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .page { position: relative; }
    .page-head { margin-bottom: 24px; }
    .page-head h1 { font-size: var(--text-2xl); margin: 0 0 2px; }
    .page-head p { margin: 0; font-size: var(--text-sm); color: var(--ink-700); }

    .tabs { display: flex; position: relative; border-bottom: 1px solid var(--line-200); margin-bottom: 24px; overflow-x: auto; }
    .tab { display: flex; align-items: center; gap: 6px; padding: 10px 20px; background: none; border: none; font-size: var(--text-sm); font-family: var(--font-body); color: var(--ink-700); cursor: pointer; white-space: nowrap; transition: color var(--transition); position: relative; z-index: 1; }
    .tab svg { width: 16px; height: 16px; flex-shrink: 0; }
    .tab:hover { color: var(--ink-900); }
    .tab--active { color: var(--ink-900); font-weight: 600; }
    .tab-indicator { position: absolute; bottom: -1px; left: 0; width: 20%; height: 2px; background: var(--honey-500); transition: transform 0.3s ease-out; z-index: 2; }
    .tab-content { position: relative; }
  `]
})
export class MarketplaceComponent {
  activeTab = signal('prestations');
  tabs = [
    { key: 'prestations', label: 'Prestations', icon: '<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>' },
    { key: 'bounties', label: 'Bounties', icon: '<line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>' },
    { key: 'crowdsourcing', label: 'Crowdsourcing', icon: '<rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="9" x2="15" y2="15"/><line x1="15" y1="9" x2="9" y2="15"/>' },
    { key: 'offres', label: 'Offres', icon: '<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>' },
    { key: 'bourses', label: 'Bourses', icon: '<circle cx="12" cy="8" r="5"/><path d="M3 21h18"/><path d="M12 13v8"/>' },
  ];

  activeIndex = () => this.tabs.findIndex(t => t.key === this.activeTab());
}
