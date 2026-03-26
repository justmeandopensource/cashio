import api from "@/lib/api";
import type { Category } from "@/types";

export const getCategories = async (): Promise<Category[]> => {
  const response = await api.get("/category/list");
  return response.data;
};

export const getExpenseLeafCategories = async (): Promise<Category[]> => {
  const response = await api.get("/category/list?type=expense&ignore_group=true");
  return response.data;
};

export interface GroupCategory {
  category_id: string;
  name: string;
}

export const getGroupCategories = async (
  categoryType: string,
): Promise<GroupCategory[]> => {
  const response = await api.get(`/category/group?category_type=${categoryType}`);
  return response.data;
};

export interface CreateCategoryPayload {
  name: string;
  is_group: boolean;
  parent_category_id: string | null;
  type: string;
}

export const createCategory = async (
  data: CreateCategoryPayload,
) => {
  const response = await api.post("/category/create", data);
  return response.data;
};
