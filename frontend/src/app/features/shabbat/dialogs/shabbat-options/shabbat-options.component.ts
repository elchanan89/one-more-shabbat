import { Component, inject, signal, computed } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ShabbatEvent, ShabbatOption } from '../../../../core/models/shabbat.model';

const DEFAULT_OPTION: ShabbatOption = { id: '__default__', text: 'נשארים בבית' };

type Mode = 'family' | 'parents';

export interface ShabbatOptionsData {
  event: ShabbatEvent;
}

@Component({
  selector: 'app-shabbat-options',
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: './shabbat-options.component.html',
  styleUrl: './shabbat-options.component.scss',
})
export class ShabbatOptionsComponent {
  private dialogRef = inject(MatDialogRef<ShabbatOptionsComponent>);
  data = inject<ShabbatOptionsData>(MAT_DIALOG_DATA);

  mode = signal<Mode>('family');
  newOptionText = signal('');
  localOptions = signal<ShabbatOption[]>([...(this.data.event.shabbatOptions ?? [])]);
  localSelectedId = signal(this.data.event.selectedOptionId ?? '');

  get event(): ShabbatEvent { return this.data.event; }

  allOptions = computed((): ShabbatOption[] => [
    DEFAULT_OPTION,
    ...this.localOptions(),
  ]);

  hasSelection = computed(() => !!this.data.event.selectedOptionId);

  setMode(m: Mode): void {
    this.mode.set(m);
  }

  onInputChange(e: Event): void {
    this.newOptionText.set((e.target as HTMLInputElement).value);
  }

  removeOption(id: string): void {
    this.localOptions.update(opts => opts.filter(o => o.id !== id));
  }

  save(): void {
    if (this.mode() === 'family') {
      const text = this.newOptionText().trim();
      const updatedOptions = text
        ? [...this.localOptions(), { id: `opt_${Date.now()}`, text }]
        : this.localOptions();
      this.dialogRef.close({ patch: { shabbatOptions: updatedOptions } });
    } else {
      this.dialogRef.close({
        patch: { selectedOptionId: this.localSelectedId() || undefined },
      });
    }
  }

  resetSelection(): void {
    if (!confirm('לאפס את הבחירה הנוכחית? הכרטיסייה תחזור למצב ריק.')) return;
    this.dialogRef.close({ patch: { selectedOptionId: null, shabbatOptions: [] } });
  }

  cancel(): void {
    this.dialogRef.close(null);
  }
}
