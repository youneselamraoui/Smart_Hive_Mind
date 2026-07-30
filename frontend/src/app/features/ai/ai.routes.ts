import { Routes } from '@angular/router';

const aiRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./ai-assistant-page.component').then(m => m.AiAssistantPageComponent),
    title: 'Assistant IA',
  },
  {
    path: 'generate-content',
    loadComponent: () => import('./generate-content.component').then(m => m.GenerateContentComponent),
    title: 'Générer du contenu',
  },
  {
    path: 'analyze-text',
    loadComponent: () => import('./analyze-text.component').then(m => m.AnalyzeTextComponent),
    title: 'Analyser un texte',
  },
  {
    path: 'assist-writing',
    loadComponent: () => import('./assist-writing.component').then(m => m.AssistWritingComponent),
    title: 'Assistant rédaction',
  },
];

export default aiRoutes;
