import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ConfirmDialogService {
  private _visible = signal(false);
  readonly visible = this._visible.asReadonly();
  private _message = signal('');
  readonly message = this._message.asReadonly();
  private resolve?: (value: boolean) => void;

  confirm(message: string): Promise<boolean> {
    this._message.set(message);
    this._visible.set(true);
    return new Promise(res => { this.resolve = res; });
  }

  accept() {
    this._visible.set(false);
    this.resolve?.(true);
  }

  cancel() {
    this._visible.set(false);
    this.resolve?.(false);
  }
}
