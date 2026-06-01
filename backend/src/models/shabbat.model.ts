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
  selectedOptionId?: string | null;
  createdAt: string;
  updatedAt: string;
}
