import { Component, OnInit, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ShabbatEvent } from '../../../../core/models/shabbat.model';
import {
  FamilyEventInput,
  FamilyEventOccurrence,
  HEBREW_DAYS,
  HEBREW_MONTHS,
} from '../../../../core/models/family-event.model';
import { FamilyEventsService } from '../../../../core/services/family-events.service';

@Component({
  selector: 'app-family-events-dialog',
  imports: [MatButtonModule, MatIconModule, MatDialogModule, MatProgressSpinnerModule],
  templateUrl: './family-events-dialog.component.html',
  styleUrl: './family-events-dialog.component.scss',
})
export class FamilyEventsDialogComponent implements OnInit {
  private service = inject(FamilyEventsService);
  private dialogRef = inject(MatDialogRef<FamilyEventsDialogComponent>);
  private snackBar = inject(MatSnackBar);
  readonly data = inject<{ event: ShabbatEvent }>(MAT_DIALOG_DATA);

  readonly months = HEBREW_MONTHS;
  readonly days = HEBREW_DAYS;
  readonly typeChips = ['יום הולדת', 'יום נישואים'];

  loading = signal(true);
  saving = signal(false);
  events = signal<FamilyEventOccurrence[]>([]);
  pendingDeleteId = signal('');

  // Inline form state; editingId === '' means "adding new"
  formOpen = signal(false);
  editingId = signal('');
  fName = signal('');
  fType = signal('יום הולדת');
  fDay = signal(1);
  fMonth = signal('תשרי');
  fGreg = signal('');

  private changed = false;

  get event(): ShabbatEvent {
    return this.data.event;
  }

  ngOnInit(): void {
    this.loadWeek();
  }

  private loadWeek(after?: (list: FamilyEventOccurrence[]) => void): void {
    this.loading.set(true);
    this.service.getWeek(this.event.gregorianDate).subscribe({
      next: list => {
        this.events.set(list);
        this.loading.set(false);
        after?.(list);
      },
      error: () => {
        this.events.set([]);
        this.loading.set(false);
        after?.([]);
      },
    });
  }

  /** Day+month of this Shabbat's Hebrew date (e.g. "י\"ט תמוז"), for form prefill. */
  private shabbatHebDate(): { day: number; month: string } | null {
    const norm = (s: string) => s.replace(/["'׳״]/g, '');
    const tokens = (this.event.hebrewDate ?? '').trim().split(/\s+/);
    if (tokens.length < 2) return null;

    const dayIdx = HEBREW_DAYS.findIndex(d => norm(d) === norm(tokens[0]));
    if (dayIdx === -1) return null;

    // Backend uses short spellings (חשון, סיון); the form list uses the full ones
    const spell: Record<string, string> = { 'חשון': 'חשוון', 'סיון': 'סיוון' };
    const monthRaw = norm(tokens.slice(1).join(' '));
    const month = HEBREW_MONTHS.find(m => norm(m) === (spell[monthRaw] ?? monthRaw));
    return month ? { day: dayIdx + 1, month } : null;
  }

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

  // ── Inline form ──────────────────────────────

  openAdd(): void {
    const prefill = this.shabbatHebDate();
    this.editingId.set('');
    this.fName.set('');
    this.fType.set('יום הולדת');
    this.fDay.set(prefill?.day ?? 1);
    this.fMonth.set(prefill?.month ?? 'תשרי');
    this.fGreg.set('');
    this.formOpen.set(true);
  }

  openEdit(ev: FamilyEventOccurrence): void {
    this.editingId.set(ev.id);
    this.fName.set(ev.name);
    this.fType.set(ev.type);
    this.fDay.set(ev.hebDay);
    this.fMonth.set(ev.hebMonthName || 'תשרי');
    this.fGreg.set(ev.greg || '');
    this.formOpen.set(true);
  }

  cancelForm(): void {
    this.formOpen.set(false);
  }

  onNameInput(e: Event): void {
    this.fName.set((e.target as HTMLInputElement).value);
  }

  // ── Event type: chips quick-fill, free text overrides ──

  isChipType(t: string): boolean {
    return this.typeChips.includes(t);
  }

  customTypeValue(): string {
    return this.isChipType(this.fType()) ? '' : this.fType();
  }

  onTypeInput(e: Event): void {
    this.fType.set((e.target as HTMLInputElement).value);
  }

  onDayChange(e: Event): void {
    this.fDay.set(Number((e.target as HTMLSelectElement).value));
  }

  onMonthChange(e: Event): void {
    this.fMonth.set((e.target as HTMLSelectElement).value);
  }

  onGregInput(e: Event): void {
    this.fGreg.set((e.target as HTMLInputElement).value);
  }

  canSave(): boolean {
    return this.fName().trim().length > 0 && this.fType().trim().length > 0 && !this.saving();
  }

  saveForm(): void {
    if (!this.canSave()) return;
    const input: FamilyEventInput = {
      name: this.fName().trim(),
      type: this.fType(),
      hebDay: this.fDay(),
      hebMonth: this.fMonth(),
      greg: this.fGreg().trim(),
    };

    this.saving.set(true);
    const id = this.editingId();
    const req = id ? this.service.update(id, input) : this.service.create(input);
    req.subscribe({
      next: saved => {
        this.saving.set(false);
        this.formOpen.set(false);
        this.changed = true;
        this.loadWeek(list => {
          const inWeek = list.some(e => e.id === saved.id);
          this.snackBar.open(
            inWeek
              ? 'האירוע נשמר ✓'
              : `נשמר ✓ — ${saved.date} שייך לשבוע אחר ויופיע שם`,
            undefined,
            { duration: inWeek ? 2000 : 4000 },
          );
        });
      },
      error: err => {
        this.saving.set(false);
        this.snackBar.open(err?.error?.error || 'שגיאה בשמירה', 'סגור', { duration: 3000 });
      },
    });
  }

  // ── Delete with inline confirmation ──────────

  requestDelete(ev: FamilyEventOccurrence): void {
    this.pendingDeleteId.set(ev.id);
  }

  cancelDelete(): void {
    this.pendingDeleteId.set('');
  }

  confirmDelete(): void {
    const id = this.pendingDeleteId();
    if (!id) return;
    this.pendingDeleteId.set('');
    this.service.remove(id).subscribe({
      next: () => {
        this.changed = true;
        this.snackBar.open('האירוע נמחק', undefined, { duration: 2000 });
        this.loadWeek();
      },
      error: () => this.snackBar.open('שגיאה במחיקה', 'סגור', { duration: 3000 }),
    });
  }

  close(): void {
    this.dialogRef.close({ changed: this.changed });
  }
}
