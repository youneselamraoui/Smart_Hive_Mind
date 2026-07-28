import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export interface Notification {
  _id: string;
  type: string;
  message: string;
  lien: string;
  lu: boolean;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private _count = signal(0);
  readonly count = this._count.asReadonly();
  private _items = signal<Notification[]>([]);
  readonly items = this._items.asReadonly();

  constructor(private http: HttpClient) {}

  load() {
    this.http.get<Notification[]>('/api/notifications').subscribe(items => this._items.set(items));
    this.http.get<{ count: number }>('/api/notifications/non-lus').subscribe(r => this._count.set(r.count));
  }

  marquerLu(id: string) {
    this.http.put(`/api/notifications/${id}/lu`, {}).subscribe(() => {
      this._items.update(items => items.map(i => i._id === id ? { ...i, lu: true } : i));
      this._count.update(c => Math.max(0, c - 1));
    });
  }

  refreshCount() {
    this.http.get<{ count: number }>('/api/notifications/non-lus').subscribe(r => this._count.set(r.count));
  }

  markAllRead() {
    this.http.put('/api/notifications/tout-lu', {}).subscribe(() => this.load());
  }
}
