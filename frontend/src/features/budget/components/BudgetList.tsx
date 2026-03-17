import React, { useState } from "react";
import {
  Box,
  Text,
  VStack,
  Spinner,
  Center,
  useDisclosure,
  useToast,
  useColorModeValue,
} from "@chakra-ui/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { toastDefaults } from "@/components/shared/utils";
import { AxiosError } from "axios";
import BudgetSummaryCard from "./BudgetSummaryCard";
import BudgetItem, { BudgetItemData } from "./BudgetItem";
import BudgetModal from "./BudgetModal";

interface BudgetData {
  period: string;
  period_label: string;
  total_budgeted: number;
  total_spent: number;
  budgets: BudgetItemData[];
}

interface BudgetListProps {
  ledgerId: string;
  period: string;
  currencySymbol: string;
}

const BudgetList: React.FC<BudgetListProps> = ({ ledgerId, period, currencySymbol }) => {
  const toast = useToast();
  const queryClient = useQueryClient();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [editingBudget, setEditingBudget] = useState<BudgetItemData | undefined>();

  const emptyColor = useColorModeValue("gray.500", "gray.400");

  const { data, isLoading, isError } = useQuery<BudgetData>({
    queryKey: ["budgets", ledgerId, period],
    queryFn: async () => {
      const response = await api.get(`/ledger/${ledgerId}/budgets?period=${period}`);
      return response.data;
    },
    enabled: !!ledgerId,
  });

  const deleteMutation = useMutation({
    mutationFn: async (budgetId: number) => {
      await api.delete(`/ledger/${ledgerId}/budgets/${budgetId}`);
    },
    onSuccess: () => {
      toast({ description: "Budget deleted.", status: "success", ...toastDefaults });
      queryClient.invalidateQueries({ queryKey: ["budgets", ledgerId] });
    },
    onError: (error: AxiosError<{ detail: string }>) => {
      if (error.response?.status !== 401) {
        toast({
          description: error.response?.data?.detail || "Failed to delete budget.",
          status: "error",
          ...toastDefaults,
        });
      }
    },
  });

  const handleEdit = (budget: BudgetItemData) => {
    setEditingBudget(budget);
    onOpen();
  };

  const handleModalClose = () => {
    setEditingBudget(undefined);
    onClose();
  };

  if (isLoading) {
    return (
      <Center py={12}>
        <Spinner size="md" color="brand.500" />
      </Center>
    );
  }

  if (isError) {
    return (
      <Center py={12}>
        <Text color="red.400" fontSize="sm">Failed to load budgets.</Text>
      </Center>
    );
  }

  return (
    <>
      <VStack spacing={4} align="stretch">
        {data && (
          <BudgetSummaryCard
            periodLabel={data.period_label}
            totalBudgeted={data.total_budgeted}
            totalSpent={data.total_spent}
            currencySymbol={currencySymbol}
          />
        )}

        {data?.budgets.length === 0 ? (
          <Center py={12}>
            <Box textAlign="center">
              <Text color={emptyColor} fontSize="sm">
                No budgets set for this period.
              </Text>
              <Text color={emptyColor} fontSize="sm" mt={1}>
                Use the Add button above to get started.
              </Text>
            </Box>
          </Center>
        ) : (
          data?.budgets.map((b) => (
            <BudgetItem
              key={b.budget_id}
              budget={b}
              currencySymbol={currencySymbol}
              onEdit={handleEdit}
              onDelete={(id) => deleteMutation.mutate(id)}
            />
          ))
        )}
      </VStack>

      <BudgetModal
        isOpen={isOpen}
        onClose={handleModalClose}
        ledgerId={ledgerId}
        period={period}
        mode="edit"
        budget={editingBudget}
      />
    </>
  );
};

export default BudgetList;
