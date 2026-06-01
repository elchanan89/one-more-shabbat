import * as fs from 'fs';
import * as path from 'path';
import * as shabbatService from './shabbatService';

export interface HistoryRecord {
  id: string;
  gregorianDate: string;
  description: string;
}

const DATA_FILE = path.join(__dirname, '../../data/history.json');
const DEFAULT_OPTION_TEXT = 'נשארים בבית';

function readData(): HistoryRecord[] {
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2), 'utf-8');
    return [];
  }
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8')) as HistoryRecord[];
}

function writeData(data: HistoryRecord[]): void {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

export function getAll(): HistoryRecord[] {
  return readData().sort((a, b) => b.gregorianDate.localeCompare(a.gregorianDate));
}

/**
 * Archive every Shabbat whose date has already passed and that has a chosen
 * option, into the history list. Deduped by date so it is safe to run on each
 * startup — newly-passed Shabbatot get appended over time.
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
    if (!ev.selectedOptionId) continue;                 // no choice made
    if (existingDates.has(ev.gregorianDate)) continue;  // already archived

    const description =
      ev.selectedOptionId === '__default__'
        ? DEFAULT_OPTION_TEXT
        : ev.shabbatOptions?.find(o => o.id === ev.selectedOptionId)?.text ?? DEFAULT_OPTION_TEXT;

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
