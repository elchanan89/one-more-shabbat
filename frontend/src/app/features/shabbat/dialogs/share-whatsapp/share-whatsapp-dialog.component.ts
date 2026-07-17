import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { WhatsappShareService } from '../../../../core/services/whatsapp-share.service';

export type ShareKind = 'offer' | 'choice';

export interface ShareWhatsappDialogData {
  kind: ShareKind;
  /** The message that will be pre-filled in WhatsApp — shown as a preview. */
  message: string;
}

/**
 * Asks whether to announce a change in the family WhatsApp group.
 *
 * Opens WhatsApp from inside the click handler rather than letting the caller
 * do it on afterClosed(): the close animation would break the user-gesture
 * chain and iOS Safari blocks the popup.
 */
@Component({
  selector: 'app-share-whatsapp-dialog',
  imports: [MatButtonModule, MatIconModule, MatDialogModule],
  templateUrl: './share-whatsapp-dialog.component.html',
  styleUrl: './share-whatsapp-dialog.component.scss',
})
export class ShareWhatsappDialogComponent {
  private dialogRef = inject(MatDialogRef<ShareWhatsappDialogComponent, boolean>);
  private whatsapp = inject(WhatsappShareService);
  readonly data = inject<ShareWhatsappDialogData>(MAT_DIALOG_DATA);

  get isOffer(): boolean {
    return this.data.kind === 'offer';
  }

  share(): void {
    this.whatsapp.share(this.data.message);
    this.dialogRef.close(true);
  }

  cancel(): void {
    this.dialogRef.close(false);
  }
}
