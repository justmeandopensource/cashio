import {
  Box,
  Flex,
  Text,
  useColorModeValue,
} from "@chakra-ui/react";
import React from "react";
import { formatNumberAsCurrency } from "@/components/shared/utils";
import BudgetProgressBar from "./BudgetProgressBar";

interface BudgetSummaryCardProps {
  periodLabel: string;
  totalBudgeted: number;
  totalSpent: number;
  currencySymbol: string;
}

const BudgetSummaryCard: React.FC<BudgetSummaryCardProps> = ({
  periodLabel,
  totalBudgeted,
  totalSpent,
  currencySymbol,
}) => {
  const cardBg = useColorModeValue("primaryBg", "cardDarkBg");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const labelColor = useColorModeValue("gray.500", "gray.400");
  const valueColor = useColorModeValue("gray.900", "gray.50");

  return (
    <Box
      bg={cardBg}
      border="1px solid"
      borderColor={borderColor}
      borderRadius="lg"
      p={{ base: 4, md: 6 }}
    >
      <Text fontSize="sm" fontWeight="semibold" color={labelColor} mb={4}>
        {periodLabel} Overview
      </Text>

      <Flex gap={6} mb={4} wrap="wrap">
        <Box>
          <Text fontSize="xs" color={labelColor} mb={1}>
            Budgeted
          </Text>
          <Text fontSize="xl" fontWeight="bold" color={valueColor}>
            {formatNumberAsCurrency(totalBudgeted, currencySymbol)}
          </Text>
        </Box>
        <Box>
          <Text fontSize="xs" color={labelColor} mb={1}>
            Spent
          </Text>
          <Text fontSize="xl" fontWeight="bold" color={valueColor}>
            {formatNumberAsCurrency(totalSpent, currencySymbol)}
          </Text>
        </Box>
        <Box>
          <Text fontSize="xs" color={labelColor} mb={1}>
            Remaining
          </Text>
          <Text
            fontSize="xl"
            fontWeight="bold"
            color={totalBudgeted - totalSpent < 0 ? "red.400" : "green.400"}
          >
            {formatNumberAsCurrency(totalBudgeted - totalSpent, currencySymbol)}
          </Text>
        </Box>
      </Flex>

      <BudgetProgressBar spent={totalSpent} limit={totalBudgeted} showLabels />
    </Box>
  );
};

export default BudgetSummaryCard;
