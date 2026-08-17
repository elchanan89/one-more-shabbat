import { Injectable } from '@angular/core';
import { DEFAULT_OPTION, getSelectedIds, getShabbatTitle, resolveOptionTexts, ShabbatEvent } from '../models/shabbat.model';

/** Footer that marks the message as coming from the app, not a forward. */
const SIGNATURE = '🕯️ נשלח מ״עוד שבת״';

/** Matches the phone breakpoint used by styles.scss and the dialogs. */
const MOBILE_QUERY = '(max-width: 599px)';

/**
 * Builds the family-group announcements and hands them to WhatsApp.
 *
 * Sending is always user-driven: wa.me opens the chat picker with the message
 * pre-filled and the person taps their group. WhatsApp exposes no way to target
 * a group from a link, and its official API cannot post to groups at all.
 */
@Injectable({ providedIn: 'root' })
export class WhatsappShareService {
  /** New option added by a family member. */
  buildOfferMessage(ev: ShabbatEvent, addedText: string): string {
    const all = resolveOptionTexts(ev, allOptionIds(ev));
    return sign([
      `*🕯️ שבת ${parashaOf(ev)}*`,
      `_${ev.hebrewDate}_`,
      '',
      '➕ הצעה חדשה:',
      `*${addedText}*`,
      '',
      'כל ההצעות עד עכשיו:',
      ...all.map(text => `• ${text}`),
    ]);
  }

  /** Parents' choice — may be several options. */
  buildChoiceMessage(ev: ShabbatEvent): string {
    const chosen = resolveOptionTexts(ev, getSelectedIds(ev));
    return sign([
      `*✅ הוחלט! שבת ${parashaOf(ev)}*`,
      `_${ev.hebrewDate}_`,
      '',
      'ההורים בחרו:',
      ...chosen.map(text => `✓ *${text}*`),
    ]);
  }

  /**
   * Sharing is offered on the phone view only: on a computer wa.me lands on
   * WhatsApp Web, which nobody in the family has set up.
   */
  isMobileView(): boolean {
    return window.matchMedia(MOBILE_QUERY).matches;
  }

  share(message: string): void {
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  }
}

function sign(lines: string[]): string {
  return [...lines, '', SIGNATURE].join('\n');
}

function parashaOf(ev: ShabbatEvent): string {
  return getShabbatTitle(ev);
}

function allOptionIds(ev: ShabbatEvent): string[] {
  return [DEFAULT_OPTION.id, ...(ev.shabbatOptions ?? []).map(o => o.id)];
}
