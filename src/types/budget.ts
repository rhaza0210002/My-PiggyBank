export interface RowData {
  category: string;
  values: (number | string)[];
}

export interface DataGroup {
  title: string;
  key: string;
  rows: RowData[];
  accent: string;
}
