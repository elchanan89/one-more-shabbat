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
  selectedOptionIds?: string[];
  /** @deprecated legacy single-select — read-only fallback for old data. */
  selectedOptionId?: string | null;
  createdAt: string;
  updatedAt: string;
}
