import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { FamilyEventOccurrence } from '../../../../core/models/family-event.model';

export interface WeeklyEventsDialogData {
  events: FamilyEventOccurrence[];
  parashaHe?: string;
}

/**
 * Read-only "this week's family events" announcement, opened on every site
 * load when the current week (owned by the most recent Shabbat) has events.
 */
@Component({
  selector: 'app-weekly-events-dialog',
  imports: [MatButtonModule, MatIconModule, MatDialogModule],
  templateUrl: './weekly-events-dialog.component.html',
  styleUrl: './weekly-events-dialog.component.scss',
})
export class WeeklyEventsDialogComponent {
  private dialogRef = inject(MatDialogRef<WeeklyEventsDialogComponent>);
  readonly data = inject<WeeklyEventsDialogData>(MAT_DIALOG_DATA);

  isAnniversary(ev: { type: string }): boolean {
    return ev.type.includes('נישוא');
  }

  formatOccurs(dateStr: string): string {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('he-IL', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  }

  close(): void {
    this.dialogRef.close();
  }
}
