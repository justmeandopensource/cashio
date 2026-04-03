import React from "react";
import {
  Box,
  Flex,
  HStack,
  Icon,
  Skeleton,
  Text,
  useColorModeValue,
  VStack,
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeftRight,
  ArrowRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getTransactions } from "@/features/transactions/api";
import { formatAmount } from "@/components/shared/utils";
import { queryKeys } from "@/lib/queryKeys";
import type { Ledger } from "@/types";
import type { Transaction } from "@/types/transaction";

const MotionBox = motion(Box);

interface HomeRecentTransactionsProps {
  defaultLedgerId: number;
  ledgers: Ledger[];
}

const HomeRecentTransactions: React.FC<HomeRecentTransactionsProps> = ({
  defaultLedgerId,
  ledgers,
}) => {
  const navigate = useNavigate();

  const defaultLedger = ledgers.find(
    (l) => String(l.ledger_id) === String(defaultLedgerId)
  );
  const sym = defaultLedger?.currency_symbol || "$";

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.transactions.list(String(defaultLedgerId), undefined, 1, {
      per_page: "7",
    }),
    queryFn: ({ signal }) =>
      getTransactions(defaultLedgerId, { page: 1, per_page: 7 }, signal),
    staleTime: 5 * 60 * 1000,
  });

  const cardBg = useColorModeValue("white", "cardDarkBg");
  const borderColor = useColorModeValue("gray.100", "gray.600");
  const labelColor = useColorModeValue("gray.400", "gray.500");
  const textColor = useColorModeValue("gray.800", "gray.100");
  const subtextColor = useColorModeValue("gray.500", "gray.400");
  const dateColor = useColorModeValue("gray.400", "gray.500");
  const hoverBg = useColorModeValue("gray.50", "gray.700");
  const dividerColor = useColorModeValue("gray.100", "gray.600");
  const viewAllColor = useColorModeValue("brand.600", "brand.300");
  const viewAllHoverBg = useColorModeValue("brand.50", "rgba(56,178,172,0.1)");
  const splitColor = useColorModeValue("purple.500", "purple.300");
  const transferColor = useColorModeValue("blue.500", "blue.300");

  if (isLoading) {
    return (
      <Box>
        <Skeleton borderRadius="xl" h="300px" />
      </Box>
    );
  }

  if (!data || data.transactions.length === 0) return null;

  const formatTxDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  return (
    <MotionBox
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Section header */}
      <HStack spacing={1.5} mb={3}>
        <Icon as={ArrowLeftRight} boxSize={3.5} color={labelColor} />
        <Text
          fontSize="xs"
          fontWeight="600"
          textTransform="uppercase"
          letterSpacing="wider"
          color={labelColor}
        >
          Recent Transactions
        </Text>
      </HStack>

      <Box
        bg={cardBg}
        borderRadius="xl"
        border="1px solid"
        borderColor={borderColor}
        overflow="hidden"
      >
        <VStack spacing={0} align="stretch" divider={
          <Box borderBottom="1px solid" borderColor={dividerColor} />
        }>
          {data.transactions.map((tx: Transaction) => {
            const amount = formatAmount(tx.credit, tx.debit, sym);
            return (
              <Flex
                key={tx.transaction_id}
                px={3}
                py={2}
                align="center"
                gap={2.5}
                cursor="pointer"
                _hover={{ bg: hoverBg }}
                transition="background 0.1s ease"
                onClick={() =>
                  navigate(
                    `/ledger?tab=transactions&search_text=${encodeURIComponent(
                      tx.notes || tx.category_name || ""
                    )}`
                  )
                }
              >
                {/* Date */}
                <Text
                  fontSize="2xs"
                  fontWeight="600"
                  color={dateColor}
                  w="40px"
                  flexShrink={0}
                >
                  {formatTxDate(tx.date)}
                </Text>

                {/* Category + account */}
                <Box flex={1} minW={0}>
                  <HStack spacing={1}>
                    <Text
                      fontSize="xs"
                      fontWeight="600"
                      color={textColor}
                      noOfLines={1}
                    >
                      {tx.category_name || (tx.is_transfer ? "Fund Transfer" : "Uncategorized")}
                    </Text>
                    {tx.is_split && !tx.is_transfer && (
                      <Box w="5px" h="5px" borderRadius="sm" bg={splitColor} flexShrink={0} title="Split" />
                    )}
                    {tx.is_transfer && (
                      <Box w="5px" h="5px" borderRadius="sm" bg={transferColor} flexShrink={0} title="Transfer" />
                    )}
                  </HStack>
                  {tx.account_name && (
                    <Text fontSize="2xs" color={subtextColor} noOfLines={1} mt={0.5}>
                      {tx.account_name}
                      {tx.store ? ` · ${tx.store}` : ""}
                    </Text>
                  )}
                </Box>

                {/* Amount */}
                <Text
                  fontSize="xs"
                  fontWeight="700"
                  color={amount.color}
                  flexShrink={0}
                  letterSpacing="-0.01em"
                >
                  {amount.prefix}{amount.value}
                </Text>
              </Flex>
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
          onClick={() => navigate("/ledger?tab=transactions")}
        >
          <Text fontSize="2xs" fontWeight="600">
            View all transactions
          </Text>
          <Icon as={ArrowRight} boxSize={3} />
        </Flex>
      </Box>
    </MotionBox>
  );
};

export default HomeRecentTransactions;
