import { Component, inject, signal, viewChild, ElementRef, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
  sources?: string[];
}

@Component({
  selector: 'app-ai-assistant-page',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="page">
      <div class="page-head">
        <div>
          <h1>Assistant IA</h1>
          <p>Posez des questions, générez du contenu, analysez des textes et améliorez vos rédactions</p>
        </div>
      </div>

      <div class="layout">
        <div class="tools-row">
          <a class="tool-card" routerLink="/app/ai/generate-content">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M12 3v18M3 12h18"/><circle cx="12" cy="12" r="9"/></svg>
            <span class="tl">Générer du contenu</span>
            <span class="td">Articles, rapports, descriptions</span>
          </a>
          <a class="tool-card" routerLink="/app/ai/analyze-text">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
            <span class="tl">Analyser un texte</span>
            <span class="td">Détection de plagiat et similarité</span>
          </a>
          <a class="tool-card" routerLink="/app/ai/assist-writing">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
            <span class="tl">Assistant rédaction</span>
            <span class="td">Améliorez vos brouillons avec l'IA</span>
          </a>
        </div>

        <div class="chat-card">
          <div class="chat-head">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
              <circle cx="6" cy="6" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="12" cy="18" r="2.5"/>
              <line x1="8" y1="7.5" x2="16" y2="7.5"/><line x1="14" y1="16" x2="10" y2="8"/><line x1="10" y1="16" x2="14" y2="8"/>
            </svg>
            <span>Posez une question sur les publications, la blockchain ou la plateforme</span>
          </div>

          <div class="msgs" #msgsRef>
            @if (messages().length === 0) {
              <div class="welcome">
                <p>Bonjour ! Je suis votre assistant IA. Posez-moi une question pour commencer.</p>
              </div>
            }
            @for (msg of messages(); track $index) {
              <div class="msg" [class.msg-user]="msg.role === 'user'" [class.msg-ai]="msg.role === 'assistant'">
                <div class="bubble">{{ msg.text }}</div>
                @if (msg.role === 'assistant' && msg.sources?.length) {
                  <div class="sources">
                    @for (s of msg.sources; track $index) { <span class="source">{{ s }}</span> }
                  </div>
                }
              </div>
            }
            @if (loading()) {
              <div class="msg msg-ai"><div class="bubble dots"><span></span><span></span><span></span></div></div>
            }
            @if (error()) {
              <div class="err">{{ error() }}</div>
            }
          </div>

          <div class="input-bar">
            <input [(ngModel)]="question" placeholder="Posez votre question…" (keydown.enter)="send()" [disabled]="loading()" />
            <button class="send-btn" (click)="send()" [disabled]="!question.trim() || loading()">
              @if (!loading()) {
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .page-head { margin-bottom: 28px; }
    .page-head h1 { font-size: var(--text-2xl); margin: 0 0 2px; }
    .page-head p { margin: 0; font-size: var(--text-sm); color: var(--ink-700); }

    .layout { max-width: 780px; }

    .tools-row { display: flex; gap: 16px; margin-bottom: 28px; }
    .tool-card { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 24px 16px; background: var(--color-surface); border: 1px solid var(--line-200); border-radius: var(--radius-md); text-decoration: none; color: var(--ink-900); transition: all var(--transition); text-align: center; }
    .tool-card:hover { border-color: var(--agentic-500); box-shadow: 0 4px 16px rgba(91,79,224,0.1); }
    .tool-card svg { width: 28px; height: 28px; color: var(--agentic-500); }
    .tool-card .tl { font-weight: 600; font-size: var(--text-sm); }
    .tool-card .td { font-size: var(--text-xs); color: var(--ink-700); line-height: 1.3; }
    @media (max-width: 640px) { .tools-row { flex-direction: column; } }

    .chat-card { background: var(--color-surface); border: 1px solid var(--line-200); border-radius: var(--radius-md); overflow: hidden; display: flex; flex-direction: column; }
    .chat-head { display: flex; align-items: center; gap: 10px; padding: 14px 18px; background: var(--ink-900); color: var(--paper-50); font-weight: 600; font-size: var(--text-sm); }
    .chat-head svg { width: 18px; height: 18px; opacity: 0.6; flex-shrink: 0; }
    .chat-head span { flex: 1; font-weight: 400; font-size: var(--text-xs); opacity: 0.8; }

    .msgs { height: 320px; overflow-y: auto; padding: 16px 18px; display: flex; flex-direction: column; gap: 12px; scroll-behavior: smooth; }
    .welcome { display: flex; flex-direction: column; align-items: center; text-align: center; padding: 48px 20px; }
    .welcome p { font-size: var(--text-sm); color: var(--ink-700); margin: 0; max-width: 300px; }

    .msg { display: flex; flex-direction: column; }
    .msg-user { align-items: flex-end; }
    .msg-ai { align-items: flex-start; }
    .bubble { max-width: 85%; padding: 10px 14px; font-size: var(--text-sm); line-height: 1.5; white-space: pre-wrap; word-break: break-word; }
    .msg-user .bubble { background: var(--paper-100); color: var(--ink-900); border-radius: 14px 14px 4px 14px; }
    .msg-ai .bubble { border-left: 2px solid var(--agentic-500); padding-left: 14px; color: var(--ink-900); }

    .sources { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 4px; padding-left: 16px; }
    .source { font-family: var(--font-mono); font-size: 0.6rem; color: var(--ink-700); padding: 1px 8px; background: var(--line-200); border-radius: 4px; }

    .dots { display: flex; gap: 4px; align-items: center; }
    .dots span { width: 8px; height: 8px; border-radius: 50%; background: var(--ink-700); animation: db 1.2s infinite; }
    .dots span:nth-child(2) { animation-delay: 0.2s; }
    .dots span:nth-child(3) { animation-delay: 0.4s; }
    @keyframes db { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-6px)} }

    .err { padding: 10px 14px; background: rgba(196,67,46,0.08); border-radius: var(--radius-sm); font-size: var(--text-sm); color: var(--alert-500); margin: 0 18px 12px; }

    .input-bar { display: flex; gap: 8px; padding: 12px 18px; border-top: 1px solid var(--line-200); background: var(--color-surface); }
    .input-bar input { flex: 1; padding: 10px 14px; border: 1px solid var(--line-200); border-radius: var(--radius-sm); font-family: var(--font-body); font-size: var(--text-sm); outline: none; background: var(--color-surface); color: var(--ink-900); transition: border-color var(--transition); }
    .input-bar input:focus { border-color: var(--agentic-500); }
    .input-bar input:disabled { opacity: 0.5; }
    .send-btn { width: 38px; height: 38px; border-radius: var(--radius-sm); border: none; background: var(--agentic-500); color: white; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: background var(--transition); flex-shrink: 0; }
    .send-btn:hover:not(:disabled) { background: var(--agentic-600); }
    .send-btn:disabled { opacity: 0.4; cursor: not-allowed; }
    .send-btn svg { width: 14px; height: 14px; }
  `]
})
export class AiAssistantPageComponent implements OnDestroy {
  private http = inject(HttpClient);
  private destroy$ = new Subject<void>();

  loading = signal(false);
  error = signal<string | null>(null);
  question = '';
  messages = signal<ChatMessage[]>([]);
  msgsRef = viewChild<ElementRef>('msgsRef');

  ngOnDestroy() { this.destroy$.next(); this.destroy$.complete(); }

  send() {
    const q = this.question.trim();
    if (!q || this.loading()) return;
    this.messages.update(m => [...m, { role: 'user', text: q }]);
    this.loading.set(true);
    this.error.set(null);
    this.question = '';
    this.http.post<{ reponse: string; sources?: string[] }>('/api/ai/ask', { question: q })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: r => {
          this.messages.update(m => [...m, { role: 'assistant', text: r.reponse || '(réponse vide)', sources: r.sources }]);
          this.loading.set(false);
        },
        error: e => {
          this.loading.set(false);
          this.error.set(e.error?.error || 'Service IA indisponible.');
        },
      });
  }
}
