import { HDate, HebrewCalendar, flags, gematriya } from '@hebcal/core';

export interface HebrewInfo {
  hebrewDate: string;
  parasha: string;
  parashaHe: string;
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

function formatHebrewShort(hdate: HDate): string {
  const day = gematriya(hdate.getDate());
  const month = MONTHS_HE[hdate.getMonth()] ?? '';
  return `${day} ${month}`;
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
  });

  const parashaEvent = events.find(e => !!(e.getFlags() & flags.PARSHA_HASHAVUA));

  return {
    hebrewDate,
    parasha: parashaEvent ? parashaEvent.render('en') : '',
    parashaHe: parashaEvent ? parashaEvent.render('he') : '',
  };
}
