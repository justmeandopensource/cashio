export type CategoryType = "income" | "expense";

export interface Category {
  category_id: string;
  name: string;
  type: CategoryType;
  is_group?: boolean;
  parent_category_id?: string | null;
}

export interface CategoryCreate {
  name: string;
  type: string;
  is_group?: boolean;
  parent_category_id?: string | null;
}
