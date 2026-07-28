import { Component, inject, signal, viewChild, ElementRef, effect } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
  sources?: string[];
}

@Component({
  selector: 'app-ai-assistant-widget',
  standalone: true,
  imports: [FormsModule],
  template: `
    <button class="fab" (click)="toggle()" [class.open]="open()" aria-label="Assistant IA">
      @if (open()) {
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      } @else {
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
          <circle cx="6" cy="6" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="12" cy="18" r="2.5"/>
          <line x1="8" y1="7.5" x2="16" y2="7.5"/><line x1="14" y1="16" x2="10" y2="8"/><line x1="10" y1="16" x2="14" y2="8"/>
        </svg>
      }
    </button>

    @if (open()) {
      <div class="panel">
        <div class="panel-header">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
            <circle cx="6" cy="6" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="12" cy="18" r="2.5"/>
            <line x1="8" y1="7.5" x2="16" y2="7.5"/><line x1="14" y1="16" x2="10" y2="8"/><line x1="10" y1="16" x2="14" y2="8"/>
          </svg>
          <span>Assistant IA</span>
          <button class="close-btn" (click)="toggle()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
        </div>

        <div class="msgs" #msgsRef>
          @if (messages().length === 0) {
            <div class="welcome">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" opacity="0.3" width="40" height="40">
                <circle cx="6" cy="6" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="12" cy="18" r="2.5"/>
                <line x1="8" y1="7.5" x2="16" y2="7.5"/><line x1="14" y1="16" x2="10" y2="8"/><line x1="10" y1="16" x2="14" y2="8"/>
              </svg>
              <p>Posez une question sur les publications, la blockchain ou la plateforme.</p>
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
    }
  `,
  styles: [`
    :host { display: contents; }

    .fab { position: fixed; bottom: 32px; right: 32px; z-index: 950; width: 56px; height: 56px; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; background: var(--agentic-500); color: white; box-shadow: 0 4px 20px rgba(91,79,224,0.4); transition: all 250ms cubic-bezier(0.34,1.56,0.64,1); clip-path: polygon(50% 0%, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%); }
    .fab:hover { transform: scale(1.1); }
    .fab.open { clip-path: polygon(50% 0%, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%); background: var(--ink-900); box-shadow: 0 4px 20px rgba(16,19,31,0.3); }
    .fab :deep(svg) { width: 22px; height: 22px; }

    .panel { position: fixed; bottom: 100px; right: 32px; z-index: 949; width: 380px; max-height: 560px; background: var(--color-surface); border-radius: var(--radius-md); box-shadow: 0 12px 48px rgba(0,0,0,0.15); border: 1px solid var(--line-200); display: flex; flex-direction: column; overflow: hidden; }
    .panel-header { display: flex; align-items: center; gap: 10px; padding: 14px 16px; background: var(--ink-900); color: var(--paper-50); font-weight: 600; font-size: var(--text-sm); }
    .panel-header :deep(svg) { width: 18px; height: 18px; opacity: 0.6; }
    .panel-header span { flex: 1; }
    .close-btn { background: none; border: none; color: rgba(246,245,242,0.6); cursor: pointer; padding: 4px; border-radius: 4px; display: flex; }
    .close-btn:hover { background: rgba(246,245,242,0.1); color: var(--paper-50); }
    .close-btn :deep(svg) { width: 16px; height: 16px; }

    .msgs { flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 12px; scroll-behavior: smooth; }
    .welcome { display: flex; flex-direction: column; align-items: center; text-align: center; padding: 40px 20px; gap: 8px; }
    .welcome p { font-size: var(--text-sm); color: var(--ink-700); margin: 0; }

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

    .err { padding: 10px 14px; background: rgba(196,67,46,0.08); border: 1px solid rgba(196,67,46,0.15); border-radius: var(--radius-sm); font-size: var(--text-sm); color: var(--alert-500); }

    .input-bar { display: flex; gap: 8px; padding: 12px 16px; border-top: 1px solid var(--line-200); background: var(--color-surface); }
    .input-bar input { flex: 1; padding: 8px 12px; border: 1px solid var(--line-200); border-radius: var(--radius-sm); font-family: var(--font-body); font-size: var(--text-sm); outline: none; background: var(--color-surface); color: var(--ink-900); transition: border-color var(--transition); }
    .input-bar input:focus { border-color: var(--agentic-500); }
    .input-bar input:disabled { opacity: 0.5; }
    .send-btn { width: 36px; height: 36px; border-radius: var(--radius-sm); border: none; background: var(--agentic-500); color: white; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: background var(--transition); flex-shrink: 0; }
    .send-btn:hover:not(:disabled) { background: var(--agentic-600); }
    .send-btn:disabled { opacity: 0.4; cursor: not-allowed; }
    .send-btn :deep(svg) { width: 14px; height: 14px; }

    @media (max-width: 767px) { .fab { right: 16px; bottom: 24px; } .panel { right: 12px; left: 12px; width: auto; bottom: 88px; max-height: 60vh; } }
  `]
})
export class AiAssistantWidgetComponent {
  private http = inject(HttpClient);
  open = signal(false);
  loading = signal(false);
  error = signal<string | null>(null);
  question = '';
  messages = signal<ChatMessage[]>([]);
  msgsRef = viewChild<ElementRef>('msgsRef');

  toggle() { this.open.update(v => !v); this.error.set(null); }

  send() {
    const q = this.question.trim();
    if (!q || this.loading()) return;
    this.messages.update(m => [...m, { role: 'user', text: q }]);
    this.loading.set(true);
    this.error.set(null);
    this.question = '';
    this.http.post<{ reponse: string; sources?: string[] }>('/api/ai/ask', { question: q }).subscribe({
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
