import * as fs from 'fs';
import * as path from 'path';
import * as shabbatService from './shabbatService';
import { DATA_DIR, SEED_DIR, ensureDataDir } from '../config';
import { ShabbatEvent } from '../models/shabbat.model';

export interface HistoryRecord {
  id: string;
  gregorianDate: string;
  description: string;
}

const DATA_FILE = path.join(DATA_DIR, 'history.json');
const SEED_FILE = path.join(SEED_DIR, 'history.json');
const DEFAULT_OPTION_TEXT = 'נשארים בבית';
const NOT_SELECTED_TEXT = 'לא נבחר';

function readData(): HistoryRecord[] {
  if (!fs.existsSync(DATA_FILE)) {
    ensureDataDir();
    // Seed from the committed seed file on first run (or after a fresh volume mount).
    const initial = fs.existsSync(SEED_FILE) ? fs.readFileSync(SEED_FILE, 'utf-8') : '[]';
    fs.writeFileSync(DATA_FILE, initial, 'utf-8');
    return JSON.parse(initial) as HistoryRecord[];
  }
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8')) as HistoryRecord[];
}

function writeData(data: HistoryRecord[]): void {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

export function getAll(): HistoryRecord[] {
  return readData().sort((a, b) => b.gregorianDate.localeCompare(a.gregorianDate));
}

/** Overwrite a record's free-text description; not tied to shabbatOptions/selectedOptionIds. */
export function update(id: string, description: string): HistoryRecord | null {
  const history = readData();
  const idx = history.findIndex(r => r.id === id);
  if (idx === -1) return null;
  history[idx] = { ...history[idx], description };
  writeData(history);
  return history[idx];
}

/** Chosen option ids, handling legacy single-select data. */
function selectedIds(ev: ShabbatEvent): string[] {
  if (Array.isArray(ev.selectedOptionIds)) return ev.selectedOptionIds;
  if (ev.selectedOptionId) return [ev.selectedOptionId];
  return [];
}

/** Resolve option ids to their display texts (default option + family-added). */
function optionTextsFor(ev: ShabbatEvent, ids: string[]): string[] {
  const opts = [{ id: '__default__', text: DEFAULT_OPTION_TEXT }, ...(ev.shabbatOptions ?? [])];
  return ids
    .map(id => opts.find(o => o.id === id)?.text)
    .filter((t): t is string => !!t);
}

/**
 * Archive every Shabbat whose date has already passed into the history list —
 * with a chosen option's text, or the "לא נבחר" placeholder if none was ever
 * picked. Deduped by date so it is safe to run on each startup — newly-passed
 * Shabbatot get appended over time.
 */
export function archivePassedShabbatot(): void {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const history = readData();
  const existingDates = new Set(history.map(r => r.gregorianDate));

  let added = 0;
  for (const ev of shabbatService.getAll()) {
    if (ev.gregorianDate >= todayStr) continue;        // not past yet
    if (existingDates.has(ev.gregorianDate)) continue;  // already archived

    const ids = selectedIds(ev);
    const description = ids.length === 0
      ? NOT_SELECTED_TEXT
      : optionTextsFor(ev, ids).join(', ') || DEFAULT_OPTION_TEXT;

    history.push({
      id: `hist_${ev.gregorianDate}`,
      gregorianDate: ev.gregorianDate,
      description,
    });
    existingDates.add(ev.gregorianDate);
    added++;
  }

  if (added > 0) {
    writeData(history);
    console.log(`[archive] Added ${added} passed Shabbatot to history`);
  }
}
