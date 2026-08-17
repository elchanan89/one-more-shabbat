import { HDate, HebrewCalendar, flags, gematriya } from '@hebcal/core';

export interface HebrewInfo {
  hebrewDate: string;
  parasha: string;
  parashaHe: string;
  /** Festival name, set only when the Shabbat has no weekly parasha (e.g. Sukkot I). */
  holiday: string;
  holidayHe: string;
}

// Month names without nikud, indexed by @hebcal/core month number (Nisan=1 … Tishrei=7 …)
const MONTHS_HE: Record<number, string> = {
  1:  'ניסן',
  2:  'אייר',
  3:  'סיון',
  4:  'תמוז',
  5:  'אב',
  6:  'אלול',
  7:  'תשרי',
  8:  'חשון',
  9:  'כסלו',
  10: 'טבת',
  11: 'שבט',
  12: 'אדר',
  13: "אדר ב'",
};

// Clean Hebrew names keyed by hebcal's stable English basename. hebcal's own
// Hebrew render carries the day number and year ("רֹאשׁ הַשָּׁנָה 5787"), which is
// noise on a card — these are the plain festival names instead.
const HOLIDAYS_HE: Record<string, string> = {
  'Rosh Hashana':   'ראש השנה',
  'Yom Kippur':     'יום כיפור',
  'Sukkot':         'סוכות',
  'Shmini Atzeret': 'שמיני עצרת',
  'Simchat Torah':  'שמחת תורה',
  'Pesach':         'פסח',
  'Shavuot':        'שבועות',
};

function formatHebrewShort(hdate: HDate): string {
  const day = gematriya(hdate.getDate());
  const month = MONTHS_HE[hdate.getMonth()] ?? '';
  return `${day} ${month}`;
}

/**
 * Festival falling on this date, for the Shabbatot that displace the weekly
 * parasha. Chol HaMoed days are labelled as such so they read differently from
 * the yom tov itself.
 */
function findHoliday(hdate: HDate): { holiday: string; holidayHe: string } {
  const events = HebrewCalendar.calendar({ start: hdate, end: hdate, il: true });

  const event = events.find(e => {
    const f = e.getFlags();
    return !!(f & (flags.CHAG | flags.CHOL_HAMOED));
  });
  if (!event) return { holiday: '', holidayHe: '' };

  const base = event.basename();
  const isCholHamoed = !!(event.getFlags() & flags.CHOL_HAMOED);
  // Fall back to hebcal's Hebrew render, minus the trailing year, for anything
  // outside the map (nothing today, but the calendar can grow).
  const baseHe = HOLIDAYS_HE[base] ?? event.render('he').replace(/\s*\d+\s*$/, '');

  return {
    holiday: isCholHamoed ? `Chol HaMoed ${base}` : base,
    holidayHe: isCholHamoed ? `חול המועד ${baseHe}` : baseHe,
  };
}

export function getHebrewInfo(gregorianDateStr: string): HebrewInfo {
  const date = new Date(gregorianDateStr + 'T12:00:00');
  const hdate = new HDate(date);

  const hebrewDate = formatHebrewShort(hdate);

  const events = HebrewCalendar.calendar({
    start: hdate,
    end: hdate,
    sedrot: true,
    noHolidays: true,
    il: true, // Israel reading schedule (differs from Diaspora after Shavuot 2026, etc.)
  });

  const parashaEvent = events.find(e => !!(e.getFlags() & flags.PARSHA_HASHAVUA));

  // A festival Shabbat has no weekly parasha — name it after the festival instead.
  const { holiday, holidayHe } = parashaEvent
    ? { holiday: '', holidayHe: '' }
    : findHoliday(hdate);

  return {
    hebrewDate,
    parasha: parashaEvent ? parashaEvent.render('en') : '',
    parashaHe: parashaEvent ? parashaEvent.render('he') : '',
    holiday,
    holidayHe,
  };
}
