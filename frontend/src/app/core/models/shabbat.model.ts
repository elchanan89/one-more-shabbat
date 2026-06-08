export interface ShabbatOption {
  id: string;
  text: string;
}

export interface ShabbatEvent {
  id: string;
  parasha: string;
  parashaHe?: string;
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

/** Normalized list of chosen option ids (handles legacy single-select data). */
export function getSelectedIds(ev: Pick<ShabbatEvent, 'selectedOptionIds' | 'selectedOptionId'>): string[] {
  if (Array.isArray(ev.selectedOptionIds)) return ev.selectedOptionIds;
  if (ev.selectedOptionId) return [ev.selectedOptionId];
  return [];
}

export interface HebrewInfo {
  hebrewDate: string;
  parasha: string;
  parashaHe: string;
}

export interface HistoryRecord {
  id: string;
  gregorianDate: string;
  description: string;
}
