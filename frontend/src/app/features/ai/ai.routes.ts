import { Routes } from '@angular/router';

const aiRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./ai-assistant-widget.component').then(m => m.AiAssistantWidgetComponent),
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
];

export default aiRoutes;
