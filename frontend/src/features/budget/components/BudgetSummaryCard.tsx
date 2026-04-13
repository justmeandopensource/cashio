import {
  Box,
  Flex,
  Text,
  useColorModeValue,
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import React from "react";
import { formatNumberAsCurrency } from "@/components/shared/utils";
import FinancialTooltip from "@/components/shared/FinancialTooltip";
import BudgetProgressBar from "./BudgetProgressBar";
import { getBudgetStatusColor } from "../utils";

const MotionBox = motion.create(Box);

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
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.100", "gray.700");
  const labelColor = useColorModeValue("gray.400", "gray.500");
  const valueColor = useColorModeValue("gray.900", "gray.50");
  const remaining = Number(totalBudgeted) - Number(totalSpent);
  const remainingColor = getBudgetStatusColor(totalSpent, totalBudgeted);
  const accentGradient = useColorModeValue(
    "linear(to-r, brand.400, brand.500)",
    "linear(to-r, brand.300, brand.400)"
  );

  return (
    <MotionBox
      bg={cardBg}
      border="1px solid"
      borderColor={borderColor}
      borderRadius="xl"
      overflow="hidden"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      {/* Top accent */}
      <Box h="2px" bgGradient={accentGradient} />

      <Box p={{ base: 4, md: 5 }}>
        <Text
          fontSize="xs"
          fontWeight="bold"
          color={labelColor}
          textTransform="uppercase"
          letterSpacing="0.06em"
          mb={4}
        >
          {periodLabel} Overview
        </Text>

        <Flex gap={{ base: 4, md: 8 }} mb={4} wrap="wrap">
          <Box minW="0">
            <Text fontSize="xs" color={labelColor} mb={0.5} letterSpacing="0.02em">
              Budgeted
              <FinancialTooltip term="budgeted" />
            </Text>
            <Text
              fontSize={{ base: "lg", md: "xl" }}
              fontWeight="bold"
              color={valueColor}
              letterSpacing="-0.02em"
            >
              {formatNumberAsCurrency(totalBudgeted, currencySymbol)}
            </Text>
          </Box>
          <Box minW="0">
            <Text fontSize="xs" color={labelColor} mb={0.5} letterSpacing="0.02em">
              Spent
              <FinancialTooltip term="actual_spend" />
            </Text>
            <Text
              fontSize={{ base: "lg", md: "xl" }}
              fontWeight="bold"
              color={valueColor}
              letterSpacing="-0.02em"
            >
              {formatNumberAsCurrency(totalSpent, currencySymbol)}
            </Text>
          </Box>
          <Box minW="0">
            <Text fontSize="xs" color={labelColor} mb={0.5} letterSpacing="0.02em">
              Remaining
              <FinancialTooltip term="remaining" />
            </Text>
            <Text
              fontSize={{ base: "lg", md: "xl" }}
              fontWeight="bold"
              color={remainingColor}
              letterSpacing="-0.02em"
            >
              {formatNumberAsCurrency(remaining, currencySymbol)}
            </Text>
          </Box>
        </Flex>

        <BudgetProgressBar spent={totalSpent} limit={totalBudgeted} showLabels size="md" />
      </Box>
    </MotionBox>
  );
};

export default BudgetSummaryCard;
