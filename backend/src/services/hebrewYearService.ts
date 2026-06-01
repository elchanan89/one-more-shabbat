import { HDate, HebrewCalendar, flags } from '@hebcal/core';
import { v4 as uuidv4 } from 'uuid';
import { ShabbatEvent } from '../models/shabbat.model';
import * as shabbatService from './shabbatService';
import { getHebrewInfo } from './hebrewCalendarService';

// Month constants (Nisan=1 … Elul=6, Tishrei=7 … Adar=12)
const TISHREI = 7;

function toDateStr(d: Date): string {
  // Use local date components — HDate.greg() returns midnight local time,
  // so toISOString() (UTC) would give the previous day in UTC+ timezones.
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function getAllSaturdays(from: Date, to: Date): Date[] {
  const results: Date[] = [];
  const cur = new Date(from);
  const dayOffset = (6 - cur.getDay() + 7) % 7; // days until next Saturday
  cur.setDate(cur.getDate() + dayOffset);
  while (cur < to) {
    results.push(new Date(cur));
    cur.setDate(cur.getDate() + 7);
  }
  return results;
}

export function initCurrentHebrewYear(): void {
  const hdate = new HDate(new Date());
  const year = hdate.getFullYear();

  const startGreg = new HDate(1, TISHREI, year).greg();
  const endGreg = new HDate(1, TISHREI, year + 1).greg();

  const saturdays = getAllSaturdays(startGreg, endGreg);

  const existing = shabbatService.getAll();
  const existingDates = new Set(existing.map(e => e.gregorianDate));

  const now = new Date().toISOString();
  const toInsert: ShabbatEvent[] = [];

  for (const sat of saturdays) {
    const dateStr = toDateStr(sat);
    if (existingDates.has(dateStr)) continue;

    let hebrewDate = '';
    let parasha = '';
    let parashaHe = '';

    try {
      const info = getHebrewInfo(dateStr);
      hebrewDate = info.hebrewDate;
      parasha = info.parasha;
      parashaHe = info.parashaHe;
    } catch {
      hebrewDate = new HDate(sat).toString();
    }

    toInsert.push({
      id: uuidv4(),
      gregorianDate: dateStr,
      hebrewDate,
      parasha,
      parashaHe,
      createdAt: now,
      updatedAt: now,
    });
  }

  if (toInsert.length > 0) {
    shabbatService.bulkInsert(toInsert);
    console.log(`[init] Added ${toInsert.length} Shabbatot for Hebrew year ${year}`);
  } else {
    console.log(`[init] Hebrew year ${year} already complete (${existing.length} entries)`);
  }
}

/**
 * Re-derive parasha/hebrewDate for existing Shabbatot from @hebcal/core, so any
 * change to the calendar logic (e.g. Israel vs Diaspora schedule) propagates even
 * to data already persisted on a volume. Selections (selectedOptionId,
 * shabbatOptions) are left untouched.
 */
export function refreshParashaMetadata(): void {
  const all = shabbatService.getAll();
  const now = new Date().toISOString();
  let healed = 0;

  for (const ev of all) {
    try {
      const info = getHebrewInfo(ev.gregorianDate);
      if (
        info.parasha !== ev.parasha ||
        info.parashaHe !== ev.parashaHe ||
        info.hebrewDate !== ev.hebrewDate
      ) {
        ev.parasha = info.parasha;
        ev.parashaHe = info.parashaHe;
        ev.hebrewDate = info.hebrewDate;
        ev.updatedAt = now;
        healed++;
      }
    } catch {
      // leave this entry as-is if the calendar lookup fails
    }
  }

  if (healed > 0) {
    shabbatService.saveAll(all);
    console.log(`[heal] Refreshed parasha metadata for ${healed} Shabbatot`);
  }
}
