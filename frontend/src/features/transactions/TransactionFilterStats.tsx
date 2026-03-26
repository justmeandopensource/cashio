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
import { TrendingUp, TrendingDown, Hash, Scale } from "lucide-react";
import useLedgerStore from "@/components/shared/store";
import { formatNumberAsCurrency } from "@/components/shared/utils";

const MotionBox = motion(Box);
const MotionSimpleGrid = motion(SimpleGrid);

interface TransactionFilterStatsProps {
  totalTransactions: number;
  totalCredit: number;
  totalDebit: number;
  netAmount: number;
}

const TransactionFilterStats: React.FC<TransactionFilterStatsProps> = ({
  totalTransactions,
  totalCredit,
  totalDebit,
  netAmount,
}) => {
  const currencySymbol = useLedgerStore((s) => s.currencySymbol);

  const cardBg = useColorModeValue("primaryBg", "cardDarkBg");
  const sectionBorderColor = useColorModeValue("gray.100", "gray.700");
  const columnHeaderColor = useColorModeValue("gray.400", "gray.500");
  const positiveColor = useColorModeValue("green.500", "green.300");
  const expenseValueColor = useColorModeValue("red.500", "red.400");
  const primaryTextColor = useColorModeValue("gray.800", "gray.100");

  const countAccentColor = useColorModeValue("blue.400", "blue.300");
  const incomeAccentColor = useColorModeValue("teal.400", "teal.300");
  const expenseAccentColor = useColorModeValue("red.400", "red.300");
  const netPositiveAccent = useColorModeValue("green.400", "green.300");
  const netNegativeAccent = useColorModeValue("orange.400", "orange.300");

  const netAccentColor = netAmount >= 0 ? netPositiveAccent : netNegativeAccent;
  const netValueColor = netAmount >= 0 ? positiveColor : expenseValueColor;

  const symbol = currencySymbol || "$";

  const cards = [
    {
      icon: Hash,
      label: "Transactions",
      value: totalTransactions.toLocaleString(),
      accentColor: countAccentColor,
      valueColor: primaryTextColor,
    },
    {
      icon: TrendingUp,
      label: "Total Income",
      value: formatNumberAsCurrency(totalCredit, symbol),
      accentColor: incomeAccentColor,
      valueColor: positiveColor,
    },
    {
      icon: TrendingDown,
      label: "Total Expenses",
      value: formatNumberAsCurrency(totalDebit, symbol),
      accentColor: expenseAccentColor,
      valueColor: expenseValueColor,
    },
    {
      icon: Scale,
      label: "Net Amount",
      value: `${netAmount >= 0 ? "+" : "-"}${formatNumberAsCurrency(Math.abs(netAmount), symbol)}`,
      accentColor: netAccentColor,
      valueColor: netValueColor,
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
      {cards.map(({ icon, label, value, accentColor, valueColor }) => (
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

export default React.memo(TransactionFilterStats);
