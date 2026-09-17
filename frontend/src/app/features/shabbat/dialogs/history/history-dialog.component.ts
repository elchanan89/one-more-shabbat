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
  passwordPromptId = signal<string | null>(null);
  passwordInput = signal('');
  passwordError = signal(false);
  verifying = signal(false);
  private verifiedPassword: string | null = null;

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
    if (this.verifiedPassword) {
      this.openEditor(record);
      return;
    }
    this.passwordPromptId.set(record.id);
    this.passwordInput.set('');
    this.passwordError.set(false);
  }

  private openEditor(record: HistoryRecord): void {
    this.editingId.set(record.id);
    this.editText.set(record.description);
  }

  cancelEdit(): void {
    this.editingId.set(null);
  }

  onEditInput(e: Event): void {
    this.editText.set((e.target as HTMLTextAreaElement).value);
  }

  onPasswordInput(e: Event): void {
    this.passwordInput.set((e.target as HTMLInputElement).value);
    this.passwordError.set(false);
  }

  cancelPassword(): void {
    this.passwordPromptId.set(null);
    this.passwordInput.set('');
    this.passwordError.set(false);
  }

  submitPassword(record: HistoryRecord): void {
    const password = this.passwordInput();
    if (!password || this.verifying()) return;
    this.verifying.set(true);
    this.http.post<{ valid: boolean }>('/api/history/verify-password', { password }).subscribe({
      next: ({ valid }) => {
        this.verifying.set(false);
        if (!valid) { this.passwordError.set(true); return; }
        this.verifiedPassword = password;
        this.passwordPromptId.set(null);
        this.openEditor(record);
      },
      error: () => { this.verifying.set(false); this.passwordError.set(true); },
    });
  }

  saveEdit(record: HistoryRecord): void {
    const description = this.editText().trim();
    if (!description) return;
    this.http.put<HistoryRecord>(`/api/history/${record.id}`, {
      description,
      password: this.verifiedPassword,
    }).subscribe({
      next: updated => {
        this.records.update(list => list.map(r => (r.id === updated.id ? updated : r)));
        this.editingId.set(null);
      },
      error: () => {
        this.verifiedPassword = null;
        this.editingId.set(null);
      },
    });
  }

  close(): void {
    this.dialogRef.close();
  }
}
