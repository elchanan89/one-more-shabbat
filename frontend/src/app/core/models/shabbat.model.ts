export interface ShabbatOption {
  id: string;
  text: string;
}

/** Always-available option, offered alongside the stored ones but never persisted. */
export const DEFAULT_OPTION: ShabbatOption = { id: '__default__', text: 'נשארים בבית' };

export interface ShabbatEvent {
  id: string;
  parasha: string;
  parashaHe?: string;
  /** Festival name, present only on Shabbatot that have no weekly parasha. */
  holiday?: string;
  holidayHe?: string;
  gregorianDate: string;
  hebrewDate: string;
  shabbatOptions?: ShabbatOption[];
  /** Parents' chosen options (multi-select). Authoritative once set. */
  selectedOptionIds?: string[];
  /** @deprecated legacy single-select — read-only fallback for old data. */
  selectedOptionId?: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Display title for a Shabbat: the weekly parasha, or — on the festival
 * Shabbatot that have none (Rosh Hashana, Sukkot I, Pesach …) — the festival name.
 */
export function getShabbatTitle(
  ev: Pick<ShabbatEvent, 'parasha' | 'parashaHe' | 'holiday' | 'holidayHe'>
): string {
  return ev.parashaHe || ev.holidayHe || ev.parasha || ev.holiday || '';
}

/** Normalized list of chosen option ids (handles legacy single-select data). */
export function getSelectedIds(ev: Pick<ShabbatEvent, 'selectedOptionIds' | 'selectedOptionId'>): string[] {
  if (Array.isArray(ev.selectedOptionIds)) return ev.selectedOptionIds;
  if (ev.selectedOptionId) return [ev.selectedOptionId];
  return [];
}

/** Option texts for the given ids, in id order. Unknown ids are dropped. */
export function resolveOptionTexts(ev: Pick<ShabbatEvent, 'shabbatOptions'>, ids: string[]): string[] {
  const all = [DEFAULT_OPTION, ...(ev.shabbatOptions ?? [])];
  return ids
    .map(id => all.find(o => o.id === id)?.text)
    .filter((text): text is string => !!text);
}

export interface HebrewInfo {
  hebrewDate: string;
  parasha: string;
  parashaHe: string;
  holiday: string;
  holidayHe: string;
}

export interface HistoryRecord {
  id: string;
  gregorianDate: string;
  description: string;
}
