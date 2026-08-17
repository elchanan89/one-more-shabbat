import { Component, input, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { getSelectedIds, getShabbatTitle, ShabbatEvent } from '../../../../core/models/shabbat.model';

/** Per-festival emoji for the card icon; falls back to a generic one. */
const HOLIDAY_EMOJI: Record<string, string> = {
  'Rosh Hashana':   '🍎',
  'Yom Kippur':     '🕊️',
  'Sukkot':         '🌿',
  'Shmini Atzeret': '🌧️',
  'Simchat Torah':  '📜',
  'Pesach':         '🍷',
  'Shavuot':        '🌾',
};

@Component({
  selector: 'app-shabbat-card',
  imports: [MatIconModule],
  templateUrl: './shabbat-card.component.html',
  styleUrl: './shabbat-card.component.scss',
})
export class ShabbatCardComponent {
  event = input.required<ShabbatEvent>();
  isEmpty = input(false);
  familyCount = input(0);
  cardClick = output<ShabbatEvent>();
  familyClick = output<ShabbatEvent>();

  /** Festival Shabbatot carry no weekly parasha — they get their own title and styling. */
  get isHoliday(): boolean {
    return !!this.event().holidayHe && !this.event().parashaHe;
  }

  get title(): string {
    return getShabbatTitle(this.event());
  }

  get holidayEmoji(): string {
    // "Chol HaMoed Sukkot" shares Sukkot's emoji
    const base = (this.event().holiday ?? '').replace(/^Chol HaMoed\s+/, '');
    return HOLIDAY_EMOJI[base] ?? '🕎';
  }

  get selectedIds(): string[] {
    return getSelectedIds(this.event());
  }

  get selectedText(): string {
    const ids = this.selectedIds;
    if (!ids.length) return '';
    const opts = [{ id: '__default__', text: 'נשארים בבית' }, ...(this.event().shabbatOptions ?? [])];
    return ids
      .map(id => opts.find(o => o.id === id)?.text)
      .filter((t): t is string => !!t)
      .join(' + ');
  }

  onCardClick(): void {
    this.cardClick.emit(this.event());
  }

  onFamilyClick(e: Event): void {
    e.stopPropagation();
    this.familyClick.emit(this.event());
  }
}
