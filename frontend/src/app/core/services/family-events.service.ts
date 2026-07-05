import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  FamilyEventInput,
  FamilyEventOccurrence,
  FamilyEventRecord,
} from '../models/family-event.model';

@Injectable({ providedIn: 'root' })
export class FamilyEventsService {
  private http = inject(HttpClient);
  private apiUrl = '/api/family-events';

  /** Events occurring during the week owned by the given Shabbat date. */
  getWeek(shabbatDate: string): Observable<FamilyEventOccurrence[]> {
    return this.http.get<FamilyEventOccurrence[]>(`${this.apiUrl}/week/${shabbatDate}`);
  }

  /** Event counts per Shabbat date. */
  getCounts(dates: string[]): Observable<Record<string, number>> {
    return this.http.get<Record<string, number>>(`${this.apiUrl}/counts`, {
      params: { dates: dates.join(',') },
    });
  }

  create(input: FamilyEventInput): Observable<FamilyEventRecord> {
    return this.http.post<FamilyEventRecord>(this.apiUrl, input);
  }

  update(id: string, input: FamilyEventInput): Observable<FamilyEventRecord> {
    return this.http.put<FamilyEventRecord>(`${this.apiUrl}/${id}`, input);
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
