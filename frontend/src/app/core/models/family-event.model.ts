export interface FamilyEventOccurrence {
  id: string;
  month: string;
  emoji: string;
  name: string;
  type: string;   // "יום הולדת" / "יום נישואים"
  date: string;   // original Hebrew date string
  greg: string;   // original Gregorian date (reference, may be empty)
  occursOn: string;     // YYYY-MM-DD — the actual date within the Shabbat week
  hebDay: number;       // Hebrew day of month (for edit prefill)
  hebMonthName: string; // Hebrew month name (for edit prefill)
  years?: number;       // Hebrew years since the original event
}

/** A stored event as returned by create/update. */
export interface FamilyEventRecord {
  id: string;
  month: string;
  emoji: string;
  name: string;
  type: string;
  date: string;
  greg: string;
}

export interface FamilyEventInput {
  name: string;
  type: string;
  hebDay: number;
  hebMonth: string;
  greg?: string;
}

/** Month choices for the add/edit form (matches backend MONTH_OPTIONS). */
export const HEBREW_MONTHS = [
  'תשרי', 'חשוון', 'כסלו', 'טבת', 'שבט',
  'אדר', 'אדר א׳', 'אדר ב׳',
  'ניסן', 'אייר', 'סיוון', 'תמוז', 'אב', 'אלול',
];

/** Hebrew day labels 1–30 (index 0 = day 1). */
export const HEBREW_DAYS = [
  'א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ז׳', 'ח׳', 'ט׳', 'י׳',
  'י"א', 'י"ב', 'י"ג', 'י"ד', 'ט"ו', 'ט"ז', 'י"ז', 'י"ח', 'י"ט', 'כ׳',
  'כ"א', 'כ"ב', 'כ"ג', 'כ"ד', 'כ"ה', 'כ"ו', 'כ"ז', 'כ"ח', 'כ"ט', 'ל׳',
];
