import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class IdeeService {
  private http = inject(HttpClient);
  private base = '/api/entrepreneuriat/idees';

  ancrerIdee(id: string): Observable<any> {
    return this.http.post<any>(this.base + '/' + id + '/ancrer', {});
  }
}
