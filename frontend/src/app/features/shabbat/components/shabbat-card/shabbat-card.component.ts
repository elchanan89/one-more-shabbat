import { Component, input, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { ShabbatEvent } from '../../../../core/models/shabbat.model';

@Component({
  selector: 'app-shabbat-card',
  imports: [MatIconModule],
  templateUrl: './shabbat-card.component.html',
  styleUrl: './shabbat-card.component.scss',
})
export class ShabbatCardComponent {
  event = input.required<ShabbatEvent>();
  isEmpty = input(false);
  cardClick = output<ShabbatEvent>();

  get selectedText(): string {
    const id = this.event().selectedOptionId;
    if (!id) return '';
    const opts = [{ id: '__default__', text: 'נשארים בבית' }, ...(this.event().shabbatOptions ?? [])];
    return opts.find(o => o.id === id)?.text ?? '';
  }

  onCardClick(): void {
    this.cardClick.emit(this.event());
  }
}
