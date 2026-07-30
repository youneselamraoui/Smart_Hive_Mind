import { Component, Input, Output, EventEmitter, ViewChild, ElementRef, AfterViewInit } from '@angular/core';

@Component({
  selector: 'app-rich-editor',
  standalone: true,
  template: `
    <div class="rich-editor">
      <div class="editor-toolbar">
        <button type="button" class="toolbar-btn" (click)="exec('bold')" title="Gras (Ctrl+B)">
          <b>B</b>
        </button>
        <button type="button" class="toolbar-btn" (click)="exec('italic')" title="Italique (Ctrl+I)">
          <i>I</i>
        </button>
        <span class="toolbar-sep"></span>
        <button type="button" class="toolbar-btn" (click)="exec('formatBlock', 'h3')" title="Titre">
          H
        </button>
        <span class="toolbar-sep"></span>
        <button type="button" class="toolbar-btn" (click)="exec('insertUnorderedList')" title="Liste à puces">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><circle cx="3" cy="4" r="1.2"/><circle cx="3" cy="8" r="1.2"/><circle cx="3" cy="12" r="1.2"/><rect x="6" y="3.2" width="8" height="1.6" rx="0.5"/><rect x="6" y="7.2" width="8" height="1.6" rx="0.5"/><rect x="6" y="11.2" width="8" height="1.6" rx="0.5"/></svg>
        </button>
        <button type="button" class="toolbar-btn" (click)="exec('insertOrderedList')" title="Liste numérotée">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><text x="0" y="6" font-size="7" font-weight="bold">1.</text><text x="0" y="12" font-size="7" font-weight="bold">2.</text><rect x="9" y="3.2" width="7" height="1.6" rx="0.5"/><rect x="9" y="7.2" width="7" height="1.6" rx="0.5"/></svg>
        </button>
      </div>
      <div
        #editor
        class="editor-content"
        contenteditable
        [innerHTML]="value"
        [attr.placeholder]="placeholder"
        (input)="onInput()"
        (keydown)="onKeydown($event)"
      ></div>
    </div>
  `,
  styles: [`
    .rich-editor {
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      overflow: hidden;
      background: var(--color-surface);
    }
    .editor-toolbar {
      display: flex;
      align-items: center;
      gap: 2px;
      padding: 6px 8px;
      border-bottom: 1px solid var(--color-border);
      background: var(--color-card);
    }
    .toolbar-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 30px;
      border: none;
      border-radius: var(--radius-sm, 4px);
      background: transparent;
      color: var(--color-text);
      cursor: pointer;
      font-size: 0.9rem;
      transition: background 0.15s;
    }
    .toolbar-btn:hover {
      background: var(--color-hover, rgba(0,0,0,0.06));
    }
    .toolbar-btn:active {
      background: var(--color-active, rgba(0,0,0,0.1));
    }
    .toolbar-btn i {
      font-style: italic;
    }
    .toolbar-btn b {
      font-weight: 700;
    }
    .toolbar-sep {
      display: inline-block;
      width: 1px;
      height: 20px;
      background: var(--color-border);
      margin: 0 4px;
    }
    .editor-content {
      min-height: 200px;
      padding: 12px 14px;
      outline: none;
      line-height: 1.6;
      font-size: 0.95rem;
      color: var(--color-text);
    }
    .editor-content:focus {
      box-shadow: inset 0 0 0 2px var(--color-primary-blue, #5B4FE0);
    }
    .editor-content:empty::before {
      content: attr(placeholder);
      color: var(--color-text-secondary, #6E7491);
      pointer-events: none;
    }
  `]
})
export class RichEditorComponent implements AfterViewInit {
  @ViewChild('editor') editor!: ElementRef<HTMLDivElement>;

  @Input() value = '';
  @Input() placeholder = '';
  @Output() valueChange = new EventEmitter<string>();

  ngAfterViewInit() {
    if (!this.value) {
      this.editor.nativeElement.innerHTML = '';
    }
  }

  exec(command: string, value?: string) {
    this.editor.nativeElement.focus();
    document.execCommand(command, false, value);
    this.emitValue();
  }

  onInput() {
    this.emitValue();
  }

  onKeydown(event: KeyboardEvent) {
    if (event.ctrlKey && event.key === 'b') {
      event.preventDefault();
      document.execCommand('bold');
      this.emitValue();
    } else if (event.ctrlKey && event.key === 'i') {
      event.preventDefault();
      document.execCommand('italic');
      this.emitValue();
    }
  }

  private emitValue() {
    this.value = this.editor.nativeElement.innerHTML;
    this.valueChange.emit(this.value);
  }
}
