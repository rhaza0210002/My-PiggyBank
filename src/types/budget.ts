export interface RowData {
  categoryId?: string;
  category: string;
  values: (number | string)[];
}

export interface DataGroup {
  id: number;
  title: string;
  key: string;
  rows: RowData[];
}
