export interface UserProfileRow {
  id: string;
  email: string;
  pseudo: string | null;
  created_at: string;
  updated_at: string;
}

export interface TransactionCategoryRow {
  id: string;
  label: string;
  cat_group_key: number;
}

export interface CategoryGroupRow {
  id: number;
  label: string;
  libelle: string;
  created_at: string;
}

export interface TransactionLabelRow {
  id: string;
  label: string;
  key: string;
  id_cat: string;
}

export interface TransactionRow {
  id: string;
  user_id: string;
  booked_on: string;
  label: string;
  amount: number;
  category_id: string | null;
  category_key: string | null;
  type: 'VIREMENT_ENTRANT' | 'VIREMENT_SORTANT' | 'AUTRE';
  dedupe_key: string;
  created_at: string;
}
