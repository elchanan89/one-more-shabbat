import { Component, input, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { getSelectedIds, ShabbatEvent } from '../../../../core/models/shabbat.model';

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
