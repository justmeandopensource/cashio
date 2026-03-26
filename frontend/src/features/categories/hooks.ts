import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import {
  getCategories,
  getExpenseLeafCategories,
  getGroupCategories,
  createCategory,
  type CreateCategoryPayload,
} from "./api";

export const useCategories = () => {
  return useQuery({
    queryKey: queryKeys.categories.all,
    queryFn: getCategories,
  });
};

export const useExpenseLeafCategories = (enabled: boolean = true) => {
  return useQuery({
    queryKey: queryKeys.categories.expenseLeaf,
    queryFn: getExpenseLeafCategories,
    enabled,
  });
};

export const useGroupCategories = (
  categoryType: string,
  enabled: boolean = true,
) => {
  return useQuery({
    queryKey: queryKeys.categories.grouped(categoryType),
    queryFn: () => getGroupCategories(categoryType),
    enabled,
  });
};

export const useCreateCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCategoryPayload) => createCategory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
    },
  });
};
