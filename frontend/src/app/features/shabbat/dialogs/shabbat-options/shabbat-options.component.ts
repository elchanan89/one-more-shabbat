import { Component, inject, signal, computed } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { DEFAULT_OPTION, getSelectedIds, getShabbatTitle, ShabbatEvent, ShabbatOption } from '../../../../core/models/shabbat.model';

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
  localSelectedIds = signal<string[]>([...getSelectedIds(this.data.event)]);

  get event(): ShabbatEvent { return this.data.event; }

  get title(): string { return getShabbatTitle(this.data.event); }

  allOptions = computed((): ShabbatOption[] => [
    DEFAULT_OPTION,
    ...this.localOptions(),
  ]);

  hasSelection = computed(() => getSelectedIds(this.data.event).length > 0);

  isSelected(id: string): boolean {
    return this.localSelectedIds().includes(id);
  }

  toggleOption(id: string): void {
    this.localSelectedIds.update(ids =>
      ids.includes(id) ? ids.filter(x => x !== id) : [...ids, id]
    );
  }

  setMode(m: Mode): void {
    this.mode.set(m);
  }

  onInputChange(e: Event): void {
    this.newOptionText.set((e.target as HTMLInputElement).value);
  }

  removeOption(id: string): void {
    this.localOptions.update(opts => opts.filter(o => o.id !== id));
    this.localSelectedIds.update(ids => ids.filter(x => x !== id));
  }

  save(): void {
    if (this.mode() === 'family') {
      const text = this.newOptionText().trim();
      const updatedOptions = text
        ? [...this.localOptions(), { id: `opt_${Date.now()}`, text }]
        : this.localOptions();
      this.dialogRef.close({
        patch: { shabbatOptions: updatedOptions },
        addedText: text || undefined,
      });
    } else {
      // Persist multi-select; clear the legacy field so it doesn't shadow it.
      this.dialogRef.close({
        patch: { selectedOptionIds: this.localSelectedIds(), selectedOptionId: null },
      });
    }
  }

  resetSelection(): void {
    if (!confirm('לאפס את הבחירה הנוכחית? ההצעות יישארו.')) return;
    // Clear only the parents' choice — keep the family-added options.
    this.dialogRef.close({ patch: { selectedOptionIds: [], selectedOptionId: null } });
  }

  cancel(): void {
    this.dialogRef.close(null);
  }
}
