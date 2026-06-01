import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { HebrewInfo, ShabbatEvent } from '../models/shabbat.model';

@Injectable({ providedIn: 'root' })
export class ShabbatService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/api/shabbatot';

  getAll(): Observable<ShabbatEvent[]> {
    return this.http.get<ShabbatEvent[]>(this.apiUrl);
  }

  getOne(id: string): Observable<ShabbatEvent> {
    return this.http.get<ShabbatEvent>(`${this.apiUrl}/${id}`);
  }

  create(data: Partial<ShabbatEvent>): Observable<ShabbatEvent> {
    return this.http.post<ShabbatEvent>(this.apiUrl, data);
  }

  update(id: string, data: Partial<ShabbatEvent>): Observable<ShabbatEvent> {
    return this.http.put<ShabbatEvent>(`${this.apiUrl}/${id}`, data);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getHebrewInfo(date: string): Observable<HebrewInfo> {
    return this.http.get<HebrewInfo>(`${this.apiUrl}/hebrew-info`, { params: { date } });
  }
}
