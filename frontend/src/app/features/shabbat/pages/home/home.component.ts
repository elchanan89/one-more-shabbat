import { Component, computed, effect, inject, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { getSelectedIds, ShabbatEvent } from '../../../../core/models/shabbat.model';
import { ShabbatService } from '../../../../core/services/shabbat.service';
import { ThemeService } from '../../../../core/services/theme.service';
import { AudioService } from '../../../../core/services/audio.service';
import { FamilyEventsService } from '../../../../core/services/family-events.service';
import { WhatsappShareService } from '../../../../core/services/whatsapp-share.service';
import { ShabbatCardComponent } from '../../components/shabbat-card/shabbat-card.component';
import { ShabbatOptionsComponent } from '../../dialogs/shabbat-options/shabbat-options.component';
import { HistoryDialogComponent } from '../../dialogs/history/history-dialog.component';
import { FamilyEventsDialogComponent } from '../../dialogs/family-events/family-events-dialog.component';
import { WeeklyEventsDialogComponent } from '../../dialogs/weekly-events/weekly-events-dialog.component';
import { ShareKind, ShareWhatsappDialogComponent } from '../../dialogs/share-whatsapp/share-whatsapp-dialog.component';

const PAGE_SIZE = 5;

@Component({
  selector: 'app-home',
  imports: [
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    ShabbatCardComponent,
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit {
  private service = inject(ShabbatService);
  theme = inject(ThemeService);
  audio = inject(AudioService);
  private familyService = inject(FamilyEventsService);
  private whatsapp = inject(WhatsappShareService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  private musicHintShown = false;

  constructor() {
    this.audio.init();
    // The song starts on the visitor's first tap — surface a clear, labeled
    // mute action the moment sound begins (once per visit).
    effect(() => {
      if (this.audio.state() !== 'playing' || this.musicHintShown) return;
      this.musicHintShown = true;
      this.snackBar
        .open('🎵 מתנגנת מוזיקה', 'השתק', { duration: 5000 })
        .onAction()
        .subscribe(() => this.audio.toggle());
    });
  }

  familyCounts = signal<Record<string, number>>({});
  private allEvents = signal<ShabbatEvent[]>([]);
  private pageStart = signal(0);
  private visibleCount = signal(PAGE_SIZE);
  loading = signal(true);
  error = signal<string | null>(null);

  visibleEvents = computed(() =>
    this.allEvents().slice(this.pageStart(), this.pageStart() + this.visibleCount())
  );
  hasMore = computed(() =>
    this.pageStart() + this.visibleCount() < this.allEvents().length
  );
  totalCount = computed(() => this.allEvents().length);

  ngOnInit(): void {
    this.loadEvents();
  }

  loadEvents(): void {
    this.loading.set(true);
    this.error.set(null);
    this.service.getAll().subscribe({
      next: data => {
        this.allEvents.set(data);
        this.pageStart.set(this.findTodayIndex(data));
        this.visibleCount.set(PAGE_SIZE);
        this.loading.set(false);
        this.loadFamilyCounts(data);
        this.maybeShowWeeklyEvents();
      },
      error: () => {
        this.error.set('לא ניתן לטעון נתונים — ודא שהשרת פועל.');
        this.loading.set(false);
      },
    });
  }

  private findTodayIndex(events: ShabbatEvent[]): number {
    const todayStr = new Date().toISOString().split('T')[0];
    const idx = events.findIndex(e => e.gregorianDate >= todayStr);
    return idx === -1 ? Math.max(0, events.length - PAGE_SIZE) : idx;
  }

  loadMore(): void {
    this.visibleCount.update(n => n + PAGE_SIZE);
  }

  isEmpty(event: ShabbatEvent): boolean {
    return getSelectedIds(event).length === 0 && !event.shabbatOptions?.length;
  }

  onCardClick(event: ShabbatEvent): void {
    const ref = this.dialog.open(ShabbatOptionsComponent, {
      data: { event },
      width: '480px',
      maxWidth: '95vw',
    });
    ref.afterClosed().subscribe(
      (result: { patch: Partial<ShabbatEvent>; addedText?: string } | null) => {
        if (!result?.patch) return;
        this.onSaveOptions(event.id, result.patch);
        this.offerShare(event.id, result);
      }
    );
  }

  /**
   * Prompt to announce the change in the family group. Only real news gets a
   * prompt: removing an option, saving an empty input, or resetting the
   * choice are all no-ops here.
   */
  private offerShare(
    eventId: string,
    result: { patch: Partial<ShabbatEvent>; addedText?: string }
  ): void {
    if (!this.whatsapp.isMobileView()) return;

    // Read back the merged event — onSaveOptions has already applied the patch.
    const ev = this.allEvents().find(e => e.id === eventId);
    if (!ev) return;

    let kind: ShareKind;
    let message: string;
    if (result.addedText) {
      kind = 'offer';
      message = this.whatsapp.buildOfferMessage(ev, result.addedText);
    } else if (result.patch.selectedOptionIds?.length) {
      kind = 'choice';
      message = this.whatsapp.buildChoiceMessage(ev);
    } else {
      return;
    }

    // The dialog opens WhatsApp itself, from inside the click.
    this.dialog.open(ShareWhatsappDialogComponent, {
      data: { kind, message },
      width: '420px',
      maxWidth: '95vw',
    });
  }

  onSaveOptions(eventId: string, patch: Partial<ShabbatEvent>): void {
    this.allEvents.update(list =>
      list.map(e => e.id === eventId ? { ...e, ...patch } : e)
    );
    this.service.update(eventId, patch).subscribe({
      error: () => this.snackBar.open('שגיאה בשמירה', 'סגור', { duration: 2500 }),
    });
  }

  private loadFamilyCounts(events: ShabbatEvent[]): void {
    if (!events.length) return;
    this.familyService.getCounts(events.map(e => e.gregorianDate)).subscribe({
      next: counts => this.familyCounts.set(counts),
      error: () => {}, // counts are decorative; the dialog still works without them
    });
  }

  /**
   * Announce this week's family events on every load. The week is owned by
   * the most recent Shabbat (Saturday) on or before today; opens only when
   * that week actually has events.
   */
  private maybeShowWeeklyEvents(): void {
    const d = new Date();
    d.setDate(d.getDate() - ((d.getDay() + 1) % 7)); // back to Saturday (getDay: Sat=6)
    const ownerDate = [
      d.getFullYear(),
      String(d.getMonth() + 1).padStart(2, '0'),
      String(d.getDate()).padStart(2, '0'),
    ].join('-');

    this.familyService.getWeek(ownerDate).subscribe({
      next: events => {
        // Never stack over a dialog the user already opened (slow responses)
        if (!events.length || this.dialog.openDialogs.length > 0) return;
        const parashaHe = this.allEvents().find(e => e.gregorianDate === ownerDate)?.parashaHe;
        this.dialog.open(WeeklyEventsDialogComponent, {
          data: { events, parashaHe },
          width: '480px',
          maxWidth: '95vw',
        });
      },
      error: () => {}, // announcement is decorative; never block the page on it
    });
  }

  openFamilyEvents(event: ShabbatEvent): void {
    const ref = this.dialog.open(FamilyEventsDialogComponent, {
      data: { event },
      width: '500px',
      maxWidth: '95vw',
    });
    ref.afterClosed().subscribe((result: { changed?: boolean } | null) => {
      if (result?.changed) this.loadFamilyCounts(this.allEvents());
    });
  }

  openHistory(): void {
    this.dialog.open(HistoryDialogComponent, {
      width: '520px',
      maxWidth: '95vw',
    });
  }

  daysUntil(dateStr: string): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Math.ceil((new Date(dateStr + 'T00:00:00').getTime() - today.getTime()) / 86_400_000);
  }

  formatDateHe(dateStr: string): string {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('he-IL', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }
}
