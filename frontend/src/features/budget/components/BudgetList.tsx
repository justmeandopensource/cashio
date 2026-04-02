import React, { useState } from "react";
import {
  Box,
  Heading,
  Text,
  VStack,
  Skeleton,
  Center,
  useDisclosure,
  useColorModeValue,
  Icon,
} from "@chakra-ui/react";
import { keyframes } from "@emotion/react";
import { Target } from "lucide-react";

const floatAnimation = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
`;
import { notify } from "@/components/shared/notify";
import BudgetSummaryCard from "./BudgetSummaryCard";
import BudgetItem, { BudgetItemData } from "./BudgetItem";
import BudgetModal from "./BudgetModal";
import { useBudgets, useDeleteBudget } from "../hooks";

interface BudgetListProps {
  ledgerId: string;
  period: string;
  currencySymbol: string;
}

const BudgetList: React.FC<BudgetListProps> = ({ ledgerId, period, currencySymbol }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [editingBudget, setEditingBudget] = useState<BudgetItemData | undefined>();

  const emptyIconBg = useColorModeValue("brand.50", "rgba(116, 207, 202, 0.12)");
  const emptyTitleColor = useColorModeValue("gray.800", "gray.100");
  const emptySubColor = useColorModeValue("gray.500", "gray.400");

  const { data, isLoading, isError } = useBudgets(ledgerId, period);

  const deleteBudgetMutation = useDeleteBudget();
  const deleteMutation = {
    mutate: (budgetId: number) => {
      deleteBudgetMutation.mutate(
        { ledgerId, budgetId },
        {
          onSuccess: () => {
            notify({ description: "Budget deleted.", status: "success" });
          },
          onError: (error: any) => {
            if (error.response?.status !== 401) {
              notify({
                description: error.response?.data?.detail || "Failed to delete budget.",
                status: "error",
              });
            }
          },
        },
      );
    },
  };

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
      <VStack spacing={3} align="stretch">
        {/* Summary card skeleton */}
        <Skeleton height="140px" borderRadius="xl" />
        {/* Budget item skeletons */}
        {[0, 1, 2].map((i) => (
          <Box key={i} borderRadius="xl" overflow="hidden">
            <Skeleton height="100px" borderRadius="xl" />
          </Box>
        ))}
      </VStack>
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
      <VStack spacing={3} align="stretch">
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
            <VStack spacing={3} textAlign="center">
              <Box
                w="64px"
                h="64px"
                borderRadius="2xl"
                bg={emptyIconBg}
                display="flex"
                alignItems="center"
                justifyContent="center"
                css={{ animation: `${floatAnimation} 3s ease-in-out infinite` }}
              >
                <Icon as={Target} boxSize={7} color="brand.400" strokeWidth={1.5} />
              </Box>
              <Heading fontSize="lg" fontWeight="bold" color={emptyTitleColor}>
                No Budgets Yet
              </Heading>
              <Text color={emptySubColor} fontSize="sm" maxW="280px" lineHeight="tall">
                Set spending targets for your categories to track where your money goes. Use the Add button above to create your first budget.
              </Text>
            </VStack>
          </Center>
        ) : (
          data?.budgets.map((b, i) => (
            <BudgetItem
              key={b.budget_id}
              budget={b}
              currencySymbol={currencySymbol}
              onEdit={handleEdit}
              onDelete={(id) => deleteMutation.mutate(id)}
              index={i}
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
