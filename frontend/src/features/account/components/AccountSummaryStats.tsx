import React from "react";
import {
  Box,
  Flex,
  HStack,
  Icon,
  SimpleGrid,
  Text,
  useColorModeValue,
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Hash, Calendar } from "lucide-react";
import useLedgerStore from "@/components/shared/store";
import { formatNumberAsCurrency } from "@/components/shared/utils";
import FinancialTooltip from "@/components/shared/FinancialTooltip";
import { useAccountSummary } from "../hooks";

const MotionBox = motion(Box);
const MotionSimpleGrid = motion(SimpleGrid);

interface AccountSummaryStatsProps {
  accountId: string;
}

const formatActiveSince = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
};

const AccountSummaryStats: React.FC<AccountSummaryStatsProps> = ({
  accountId,
}) => {
  const ledgerId = useLedgerStore((s) => s.ledgerId);
  const currencySymbol = useLedgerStore((s) => s.currencySymbol);

  const cardBg = useColorModeValue("primaryBg", "cardDarkBg");
  const sectionBorderColor = useColorModeValue("gray.100", "gray.700");
  const columnHeaderColor = useColorModeValue("gray.400", "gray.500");
  const positiveColor = useColorModeValue("green.500", "green.300");
  const expenseValueColor = useColorModeValue("red.500", "red.400");
  const primaryTextColor = useColorModeValue("gray.800", "gray.100");
  const secondaryTextColor = useColorModeValue("gray.500", "gray.400");

  const incomeAccentColor = useColorModeValue("teal.400", "teal.300");
  const expenseAccentColor = useColorModeValue("red.400", "red.300");
  const countAccentColor = useColorModeValue("blue.400", "blue.300");
  const dateAccentColor = useColorModeValue("gray.400", "gray.500");

  const { data } = useAccountSummary(ledgerId || "", accountId);

  if (!data || data.transaction_count === 0) return null;

  const cards = [
    {
      icon: TrendingUp,
      label: "Total Income",
      tooltipTerm: "total_income",
      value: formatNumberAsCurrency(data.total_credit, currencySymbol || "$"),
      accentColor: incomeAccentColor,
      valueColor: positiveColor,
    },
    {
      icon: TrendingDown,
      label: "Total Expenses",
      tooltipTerm: "total_expenses",
      value: formatNumberAsCurrency(data.total_debit, currencySymbol || "$"),
      accentColor: expenseAccentColor,
      valueColor: expenseValueColor,
    },
    {
      icon: Hash,
      label: "Transactions",
      tooltipTerm: null,
      value: data.transaction_count.toLocaleString(),
      accentColor: countAccentColor,
      valueColor: primaryTextColor,
    },
    {
      icon: Calendar,
      label: "Active Since",
      tooltipTerm: null,
      value: data.first_transaction_date
        ? formatActiveSince(data.first_transaction_date)
        : "—",
      accentColor: dateAccentColor,
      valueColor: secondaryTextColor,
    },
  ];

  return (
    <MotionSimpleGrid
      columns={{ base: 2, md: 4 }}
      spacing={{ base: 3, md: 4 }}
      mb={{ base: 4, md: 5 }}
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: 0.08 } },
      }}
    >
      {cards.map(({ icon, label, tooltipTerm, value, accentColor, valueColor }) => (
        <MotionBox
          key={label}
          variants={{
            hidden: { opacity: 0, y: 10 },
            visible: {
              opacity: 1,
              y: 0,
              transition: { duration: 0.35, ease: "easeOut" },
            },
          }}
        >
          <Box
            bg={cardBg}
            p={{ base: 3, md: 4 }}
            borderRadius="xl"
            border="1px solid"
            borderColor={sectionBorderColor}
            overflow="hidden"
            position="relative"
            transition="border-color 0.2s ease"
            _hover={{ borderColor: accentColor }}
            h="full"
          >
            {/* Accent line at top */}
            <Box
              position="absolute"
              top={0}
              left={0}
              right={0}
              h="2px"
              bg={accentColor}
              opacity={0.7}
            />

            <Flex align="center" gap={1.5} mb={2}>
              <Flex
                w={5}
                h={5}
                borderRadius="md"
                bg={accentColor}
                opacity={0.12}
                position="absolute"
              />
              <Flex
                w={5}
                h={5}
                borderRadius="md"
                align="center"
                justify="center"
              >
                <Icon as={icon} boxSize={3} color={accentColor} />
              </Flex>
              <Text
                fontSize="2xs"
                fontWeight="semibold"
                textTransform="uppercase"
                letterSpacing="wider"
                color={columnHeaderColor}
              >
                {label}
                {tooltipTerm && <FinancialTooltip term={tooltipTerm} />}
              </Text>
            </Flex>

            <HStack spacing={0} align="baseline">
              <Text
                fontSize={{ base: "md", md: "lg" }}
                fontWeight="bold"
                color={valueColor}
                lineHeight="short"
                letterSpacing="-0.01em"
              >
                {value}
              </Text>
            </HStack>
          </Box>
        </MotionBox>
      ))}
    </MotionSimpleGrid>
  );
};

export default React.memo(AccountSummaryStats);
