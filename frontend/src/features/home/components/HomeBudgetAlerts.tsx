import React from "react";
import {
  Box,
  Flex,
  HStack,
  Icon,
  Progress,
  Skeleton,
  Text,
  useColorModeValue,
  VStack,
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, ArrowRight, Target } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getBudgets } from "@/features/budget/api";
import { formatNumberAsCurrency } from "@/components/shared/utils";
import { queryKeys } from "@/lib/queryKeys";
import type { Ledger } from "@/types";
import type { BudgetItemData } from "@/features/budget/components/BudgetItem";

const MotionBox = motion.create(Box);

interface HomeBudgetAlertsProps {
  defaultLedgerId: number;
  ledgers: Ledger[];
}

const HomeBudgetAlerts: React.FC<HomeBudgetAlertsProps> = ({
  defaultLedgerId,
  ledgers,
}) => {
  const navigate = useNavigate();

  const defaultLedger = ledgers.find(
    (l) => String(l.ledger_id) === String(defaultLedgerId)
  );
  const sym = defaultLedger?.currency_symbol || "$";

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.budgets.forLedger(defaultLedgerId, "monthly"),
    queryFn: () => getBudgets(defaultLedgerId, "monthly"),
    staleTime: 5 * 60 * 1000,
  });

  const cardBg = useColorModeValue("white", "cardDarkBg");
  const borderColor = useColorModeValue("gray.100", "gray.600");
  const labelColor = useColorModeValue("gray.400", "gray.500");
  const textColor = useColorModeValue("gray.800", "gray.100");
  const subtextColor = useColorModeValue("gray.500", "gray.400");
  const dividerColor = useColorModeValue("gray.100", "gray.600");
  const hoverBg = useColorModeValue("gray.50", "gray.700");
  const viewAllColor = useColorModeValue("brand.600", "brand.300");
  const viewAllHoverBg = useColorModeValue("brand.50", "rgba(56,178,172,0.1)");
  const overColor = useColorModeValue("red.500", "red.300");
  const warningColor = useColorModeValue("orange.500", "orange.300");
  const safeColor = useColorModeValue("green.500", "green.300");
  const emptyIconBg = useColorModeValue("gray.50", "gray.700");
  const emptyTextColor = useColorModeValue("gray.400", "gray.500");
  const alertBadgeBg = useColorModeValue("red.50", "rgba(245,101,101,0.12)");
  const progressBg = useColorModeValue("gray.100", "gray.600");

  if (isLoading) {
    return (
      <Box>
        <Skeleton borderRadius="xl" h="120px" />
      </Box>
    );
  }

  // Sort budgets: over budget first, then at-risk (>=80%), then by % used desc
  const budgets = data?.budgets ?? [];
  const sorted = [...budgets].sort((a, b) => {
    const pctA = a.amount > 0 ? a.actual_spend / a.amount : 0;
    const pctB = b.amount > 0 ? b.actual_spend / b.amount : 0;
    return pctB - pctA;
  });

  const atRisk = sorted.filter(
    (b) => b.amount > 0 && b.actual_spend / b.amount >= 0.8
  );
  const display = atRisk.length > 0 ? atRisk.slice(0, 5) : sorted.slice(0, 5);

  const getStatusColor = (b: BudgetItemData) => {
    if (b.amount <= 0) return safeColor;
    const pct = b.actual_spend / b.amount;
    if (pct >= 1) return overColor;
    if (pct >= 0.8) return warningColor;
    return safeColor;
  };

  const getProgressColorScheme = (b: BudgetItemData) => {
    if (b.amount <= 0) return "green";
    const pct = b.actual_spend / b.amount;
    if (pct >= 1) return "red";
    if (pct >= 0.8) return "orange";
    return "green";
  };

  return (
    <MotionBox
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.05 }}
    >
      {/* Section header */}
      <HStack spacing={1.5} mb={3}>
        <Icon as={Target} boxSize={3.5} color={labelColor} />
        <Text
          fontSize="xs"
          fontWeight="600"
          textTransform="uppercase"
          letterSpacing="wider"
          color={labelColor}
        >
          Budget Status
        </Text>
        {atRisk.length > 0 && (
          <HStack
            spacing={1}
            px={1.5}
            py={0.5}
            borderRadius="full"
            bg={alertBadgeBg}
          >
            <Icon as={AlertTriangle} boxSize={2.5} color={overColor} />
            <Text fontSize="2xs" fontWeight="700" color={overColor}>
              {atRisk.length}
            </Text>
          </HStack>
        )}
      </HStack>

      <Box
        bg={cardBg}
        borderRadius="xl"
        border="1px solid"
        borderColor={borderColor}
        overflow="hidden"
      >
        {budgets.length === 0 ? (
          /* Empty state */
          <Flex
            direction="column"
            align="center"
            py={6}
            px={4}
            gap={2}
          >
            <Box
              w={10}
              h={10}
              borderRadius="lg"
              bg={emptyIconBg}
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <Icon as={Target} boxSize={5} color={emptyTextColor} />
            </Box>
            <Text fontSize="xs" fontWeight="600" color={emptyTextColor}>
              No budgets configured
            </Text>
            <Text
              fontSize="2xs"
              color={emptyTextColor}
              textAlign="center"
              maxW="200px"
            >
              Set up monthly budgets to track your spending limits.
            </Text>
            <Box
              as="button"
              mt={1}
              px={3}
              py={1}
              borderRadius="md"
              fontSize="2xs"
              fontWeight="600"
              color={viewAllColor}
              _hover={{ bg: viewAllHoverBg }}
              transition="background 0.15s ease"
              onClick={() => navigate("/budget")}
            >
              Set up budgets
            </Box>
          </Flex>
        ) : (
          <>
            <VStack
              spacing={0}
              align="stretch"
              divider={
                <Box borderBottom="1px solid" borderColor={dividerColor} />
              }
            >
              {display.map((b) => {
                const pct =
                  b.amount > 0
                    ? Math.min((b.actual_spend / b.amount) * 100, 100)
                    : 0;
                const statusColor = getStatusColor(b);
                const remaining = b.amount - b.actual_spend;
                return (
                  <Box
                    key={b.budget_id}
                    px={3}
                    py={2}
                    cursor="pointer"
                    _hover={{ bg: hoverBg }}
                    transition="background 0.1s ease"
                    onClick={() => navigate("/budget")}
                  >
                    <Flex justify="space-between" align="center" mb={1}>
                      <Text
                        fontSize="xs"
                        fontWeight="600"
                        color={textColor}
                        noOfLines={1}
                        flex={1}
                        minW={0}
                      >
                        {b.category_name}
                      </Text>
                      <Text
                        fontSize="2xs"
                        fontWeight="700"
                        color={statusColor}
                        flexShrink={0}
                        ml={2}
                      >
                        {remaining >= 0
                          ? `${formatNumberAsCurrency(remaining, sym)} left`
                          : `${formatNumberAsCurrency(Math.abs(remaining), sym)} over`}
                      </Text>
                    </Flex>
                    <Progress
                      value={pct}
                      size="xs"
                      borderRadius="full"
                      colorScheme={getProgressColorScheme(b)}
                      bg={progressBg}
                    />
                    <Flex justify="space-between" mt={0.5}>
                      <Text fontSize="2xs" color={subtextColor}>
                        {formatNumberAsCurrency(b.actual_spend, sym)}
                      </Text>
                      <Text fontSize="2xs" color={subtextColor}>
                        {formatNumberAsCurrency(b.amount, sym)}
                      </Text>
                    </Flex>
                  </Box>
                );
              })}
            </VStack>

            {/* View all link */}
            <Flex
              px={3}
              py={2}
              align="center"
              justify="center"
              gap={1.5}
              borderTop="1px solid"
              borderColor={dividerColor}
              cursor="pointer"
              color={viewAllColor}
              _hover={{ bg: viewAllHoverBg }}
              transition="background 0.15s ease"
              onClick={() => navigate("/budget")}
            >
              <Text fontSize="2xs" fontWeight="600">
                View all budgets
              </Text>
              <Icon as={ArrowRight} boxSize={3} />
            </Flex>
          </>
        )}
      </Box>
    </MotionBox>
  );
};

export default HomeBudgetAlerts;
