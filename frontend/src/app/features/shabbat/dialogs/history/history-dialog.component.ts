import { Component, inject, signal, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { HistoryRecord } from '../../../../core/models/shabbat.model';

@Component({
  selector: 'app-history-dialog',
  imports: [MatDialogModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './history-dialog.component.html',
  styleUrl: './history-dialog.component.scss',
})
export class HistoryDialogComponent implements OnInit {
  private http = inject(HttpClient);
  private dialogRef = inject(MatDialogRef<HistoryDialogComponent>);

  records = signal<HistoryRecord[]>([]);
  loading = signal(true);
  editingId = signal<string | null>(null);
  editText = signal('');

  ngOnInit(): void {
    this.http.get<HistoryRecord[]>('/api/history').subscribe({
      next: data => { this.records.set(data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('he-IL', {
      day: 'numeric', month: 'long', year: 'numeric',
    });
  }

  startEdit(record: HistoryRecord): void {
    this.editingId.set(record.id);
    this.editText.set(record.description);
  }

  cancelEdit(): void {
    this.editingId.set(null);
  }

  onEditInput(e: Event): void {
    this.editText.set((e.target as HTMLTextAreaElement).value);
  }

  saveEdit(record: HistoryRecord): void {
    const description = this.editText().trim();
    if (!description) return;
    this.http.put<HistoryRecord>(`/api/history/${record.id}`, { description }).subscribe({
      next: updated => {
        this.records.update(list => list.map(r => (r.id === updated.id ? updated : r)));
        this.editingId.set(null);
      },
    });
  }

  close(): void {
    this.dialogRef.close();
  }
}
