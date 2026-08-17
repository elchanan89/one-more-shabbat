export interface ShabbatOption {
  id: string;
  text: string;
}

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
  selectedOptionIds?: string[];
  /** @deprecated legacy single-select — read-only fallback for old data. */
  selectedOptionId?: string | null;
  createdAt: string;
  updatedAt: string;
}
