import * as fs from 'fs';
import * as path from 'path';
import { HDate, gematriya } from '@hebcal/core';
import { v4 as uuidv4 } from 'uuid';
import { DATA_DIR, SEED_DIR, ensureDataDir } from '../config';

export interface FamilyEvent {
  id: string;
  month: string;
  emoji: string;
  name: string;
  type: string;
  date: string; // Hebrew date string, e.g. כ"ו באלול תשל"ה
  greg: string; // dd.mm.yyyy, reference only (may be empty)
}

export interface FamilyEventInput {
  name: string;
  type: string;
  hebDay: number;    // 1–30
  hebMonth: string;  // month name, e.g. אלול / אדר א׳
  greg?: string;     // optional dd.mm.yyyy
}

export interface FamilyEventOccurrence extends FamilyEvent {
  occursOn: string;     // YYYY-MM-DD within the requested week
  hebDay: number;       // for edit prefill
  hebMonthName: string; // for edit prefill
  years?: number;       // Hebrew years since the original event
}

type MonthKey = number | 'ADAR' | 'ADAR_I' | 'ADAR_II';

interface ParsedEvent extends FamilyEvent {
  hebDay: number;
  monthKey: MonthKey;
}

const DATA_FILE = path.join(DATA_DIR, 'family-events.json');
const SEED_FILE = path.join(SEED_DIR, 'family-events.json');

// @hebcal/core month numbers: Nisan=1 … Adar=12 (Adar I in leap), Adar II=13
const MONTH_NAMES: Record<string, number> = {
  'ניסן': 1,
  'אייר': 2,
  'סיון': 3, 'סיוון': 3,
  'תמוז': 4,
  'אב': 5,
  'אלול': 6,
  'תשרי': 7,
  'חשון': 8, 'חשוון': 8, 'מרחשון': 8, 'מרחשוון': 8,
  'כסלו': 9,
  'טבת': 10,
  'שבט': 11,
  'אדר': 12,
};

/** Canonical month display names + emoji, keyed by base month. */
const MONTH_EMOJI: Record<string, string> = {
  'תשרי': '🕊️', 'חשוון': '🍂', 'כסלו': '❄️', 'טבת': '🧣',
  'שבט': '🌬️', 'אדר': '🌸', 'ניסן': '🌱', 'אייר': '🌾',
  'סיוון': '☀️', 'תמוז': '🍉', 'אב': '🌻', 'אלול': '📚',
};

/** Valid values for FamilyEventInput.hebMonth. */
export const MONTH_OPTIONS = [
  'תשרי', 'חשוון', 'כסלו', 'טבת', 'שבט',
  'אדר', 'אדר א׳', 'אדר ב׳',
  'ניסן', 'אייר', 'סיוון', 'תמוז', 'אב', 'אלול',
];

const GEMATRIA: Record<string, number> = {
  'א': 1, 'ב': 2, 'ג': 3, 'ד': 4, 'ה': 5, 'ו': 6, 'ז': 7, 'ח': 8, 'ט': 9,
  'י': 10, 'כ': 20, 'ל': 30,
};

function gematriaValue(token: string): number {
  let sum = 0;
  for (const ch of token) {
    const v = GEMATRIA[ch];
    if (v === undefined) return 0;
    sum += v;
  }
  return sum;
}

/** Parse "כ\"ו באלול תשל\"ה" → { hebDay: 26, monthKey: 6 }. Year is ignored. */
function parseHebrewDate(dateStr: string): { hebDay: number; monthKey: MonthKey } | null {
  const clean = dateStr.replace(/["'׳״`]/g, '');
  const tokens = clean.split(/\s+/).filter(Boolean);
  if (tokens.length < 2) return null;

  const hebDay = gematriaValue(tokens[0]);
  if (hebDay < 1 || hebDay > 30) return null;

  for (let i = 1; i < tokens.length; i++) {
    const t = tokens[i];
    // Month may carry a ב prefix: באלול → אלול (no month name starts with ב)
    const bare = MONTH_NAMES[t] !== undefined ? t : (t.startsWith('ב') ? t.slice(1) : t);
    if (MONTH_NAMES[bare] === undefined) continue;

    if (bare === 'אדר') {
      const next = tokens[i + 1];
      if (next === 'א') return { hebDay, monthKey: 'ADAR_I' };
      if (next === 'ב') return { hebDay, monthKey: 'ADAR_II' };
      return { hebDay, monthKey: 'ADAR' };
    }
    return { hebDay, monthKey: MONTH_NAMES[bare] };
  }
  return null;
}

function monthKeyToName(key: MonthKey): string {
  if (key === 'ADAR') return 'אדר';
  if (key === 'ADAR_I') return 'אדר א׳';
  if (key === 'ADAR_II') return 'אדר ב׳';
  const entry = MONTH_OPTIONS.find(name => MONTH_NAMES[name] === key);
  return entry ?? '';
}

function monthMatches(key: MonthKey, hd: HDate): boolean {
  const m = hd.getMonth();
  const leap = hd.isLeapYear();
  switch (key) {
    case 'ADAR':    return leap ? m === 13 : m === 12; // plain Adar → Adar II in leap years
    case 'ADAR_I':  return m === 12;
    case 'ADAR_II': return leap ? m === 13 : m === 12;
    default:        return m === key;
  }
}

/** dd.mm.yyyy → Date at noon (DST-safe), or null */
function parseGreg(greg: string): Date | null {
  const m = greg.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (!m) return null;
  const d = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]), 12);
  return isNaN(d.getTime()) ? null : d;
}

function toIso(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

// ── Storage ─────────────────────────────────────

let parsedCache: ParsedEvent[] | null = null;

function readData(): FamilyEvent[] {
  if (!fs.existsSync(DATA_FILE)) {
    ensureDataDir();
    // Seed from the committed file on first run, assigning ids.
    const seed: Omit<FamilyEvent, 'id'>[] = fs.existsSync(SEED_FILE)
      ? JSON.parse(fs.readFileSync(SEED_FILE, 'utf-8'))
      : [];
    const withIds: FamilyEvent[] = seed.map(ev => ({ id: uuidv4(), ...ev }));
    fs.writeFileSync(DATA_FILE, JSON.stringify(withIds, null, 2), 'utf-8');
    return withIds;
  }
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8')) as FamilyEvent[];
}

function writeData(data: FamilyEvent[]): void {
  ensureDataDir();
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  parsedCache = null;
}

function loadParsed(): ParsedEvent[] {
  if (parsedCache) return parsedCache;
  const raw = readData();
  parsedCache = raw.flatMap(ev => {
    const parsed = parseHebrewDate(ev.date);
    if (!parsed) {
      console.warn(`[family-events] Could not parse Hebrew date: "${ev.date}" (${ev.name})`);
      return [];
    }
    return [{ ...ev, hebDay: parsed.hebDay, monthKey: parsed.monthKey }];
  });
  return parsedCache;
}

// ── Queries ─────────────────────────────────────

/**
 * Events for the week owned by the given Shabbat: the Shabbat day itself
 * plus the 6 following weekdays (Sun–Fri). Matching is by Hebrew day+month.
 */
export function getEventsForShabbatWeek(shabbatDateStr: string): FamilyEventOccurrence[] {
  const events = loadParsed();
  const base = new Date(shabbatDateStr + 'T12:00:00');
  if (isNaN(base.getTime())) return [];

  const result: FamilyEventOccurrence[] = [];
  for (let i = 0; i < 7; i++) {
    const day = new Date(base);
    day.setDate(base.getDate() + i);
    const hd = new HDate(day);

    for (const ev of events) {
      if (ev.hebDay !== hd.getDate() || !monthMatches(ev.monthKey, hd)) continue;

      const occurrence: FamilyEventOccurrence = {
        id: ev.id, month: ev.month, emoji: ev.emoji, name: ev.name,
        type: ev.type, date: ev.date, greg: ev.greg,
        occursOn: toIso(day),
        hebDay: ev.hebDay,
        hebMonthName: monthKeyToName(ev.monthKey),
      };
      const birth = ev.greg ? parseGreg(ev.greg) : null;
      if (birth) {
        const years = hd.getFullYear() - new HDate(birth).getFullYear();
        if (years > 0 && years < 130) occurrence.years = years;
      }
      result.push(occurrence);
    }
  }
  return result;
}

/** Map of shabbat date → number of family events in its week. */
export function getCountsForShabbatot(dates: string[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const date of dates) {
    counts[date] = getEventsForShabbatWeek(date).length;
  }
  return counts;
}

// ── Mutations ───────────────────────────────────

function buildFromInput(input: FamilyEventInput): Omit<FamilyEvent, 'id'> {
  const name = (input.name ?? '').trim();
  const type = (input.type ?? '').trim();
  const hebDay = Number(input.hebDay);
  const hebMonth = (input.hebMonth ?? '').trim();

  if (!name) throw new Error('שם האירוע חסר');
  if (!type) throw new Error('סוג האירוע חסר');
  if (!Number.isInteger(hebDay) || hebDay < 1 || hebDay > 30) throw new Error('יום עברי לא תקין');
  if (!MONTH_OPTIONS.includes(hebMonth)) throw new Error('חודש עברי לא תקין');

  const greg = (input.greg ?? '').trim();
  if (greg && !parseGreg(greg)) throw new Error('תאריך לועזי לא תקין (dd.mm.yyyy)');

  const baseMonth = hebMonth.startsWith('אדר') ? 'אדר' : hebMonth;
  const date = `${gematriya(hebDay)} ב${hebMonth}`;
  // Sanity: what we build must parse back
  if (!parseHebrewDate(date)) throw new Error('תאריך עברי לא תקין');

  return {
    month: baseMonth,
    emoji: MONTH_EMOJI[baseMonth] ?? '🎉',
    name, type, date, greg,
  };
}

export function createEvent(input: FamilyEventInput): FamilyEvent {
  const data = readData();
  const event: FamilyEvent = { id: uuidv4(), ...buildFromInput(input) };
  data.push(event);
  writeData(data);
  return event;
}

export function updateEvent(id: string, input: FamilyEventInput): FamilyEvent | null {
  const data = readData();
  const idx = data.findIndex(ev => ev.id === id);
  if (idx === -1) return null;
  data[idx] = { id, ...buildFromInput(input) };
  writeData(data);
  return data[idx];
}

export function deleteEvent(id: string): boolean {
  const data = readData();
  const next = data.filter(ev => ev.id !== id);
  if (next.length === data.length) return false;
  writeData(next);
  return true;
}
