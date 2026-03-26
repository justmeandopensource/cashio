import React from "react";
import {
  Box,
  Flex,
  HStack,
  Icon,
  Text,
  useColorModeValue,
  VStack,
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import { Landmark, TrendingUp, Gem, BarChart2 } from "lucide-react";
import { splitCurrencyForDisplay } from "@/features/mutual-funds/utils";
import { ALLOCATION_COLORS } from "../constants";

const MotionBox = motion(Box);

interface CompositionRow {
  label: string;
  value: number;
  percentage: number;
  icon: React.ElementType;
  colorIdx: number;
}

interface PortfolioCompositionProps {
  accountsTotal: number | string;
  mutualFundsTotal: number | string;
  physicalAssetsTotal: number | string;
  totalAssets: number | string;
  mutualFundsUnrealizedGain: number | string;
  currencySymbol: string;
}

const PortfolioComposition: React.FC<PortfolioCompositionProps> = ({
  accountsTotal,
  mutualFundsTotal,
  physicalAssetsTotal,
  totalAssets,
  mutualFundsUnrealizedGain,
  currencySymbol,
}) => {
  const cardBg = useColorModeValue("primaryBg", "cardDarkBg");
  const borderColor = useColorModeValue("gray.100", "gray.600");
  const labelColor = useColorModeValue("gray.400", "gray.500");
  const primaryText = useColorModeValue("gray.800", "gray.100");
  const secondaryText = useColorModeValue("gray.500", "gray.400");
  const dividerColor = useColorModeValue("gray.100", "gray.600");
  const trackBg = useColorModeValue("gray.100", "gray.600");
  const positiveColor = useColorModeValue("green.600", "green.300");
  const negativeColor = useColorModeValue("red.500", "red.300");
  const gainBg = useColorModeValue("green.50", "whiteAlpha.50");
  const lossBg = useColorModeValue("red.50", "whiteAlpha.50");
  const sym = currencySymbol || "₹";

  const ta = Number(totalAssets);
  const ac = Number(accountsTotal);
  const mf = Number(mutualFundsTotal);
  const pa = Number(physicalAssetsTotal);
  const gain = Number(mutualFundsUnrealizedGain);

  const pct = (v: number) => (ta > 0 ? (v / ta) * 100 : 0);

  const rows: CompositionRow[] = [
    { label: "Bank Accounts", value: ac, percentage: pct(ac), icon: Landmark, colorIdx: 0 },
    { label: "Mutual Funds", value: mf, percentage: pct(mf), icon: TrendingUp, colorIdx: 1 },
    { label: "Physical Assets", value: pa, percentage: pct(pa), icon: Gem, colorIdx: 2 },
  ];

  return (
    <MotionBox
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.28, ease: "easeOut" }}
      bg={cardBg}
      border="1px solid"
      borderColor={borderColor}
      borderRadius="xl"
      p={{ base: 4, md: 5 }}
      h="full"
      display="flex"
      flexDirection="column"
    >
      {/* Card header */}
      <Flex align="center" gap={1.5} mb={2}>
        <Icon as={BarChart2} boxSize={3.5} color={labelColor} />
        <Text
          fontSize="xs"
          fontWeight="semibold"
          textTransform="uppercase"
          letterSpacing="wider"
          color={labelColor}
        >
          Portfolio Composition
        </Text>
      </Flex>

      {/* Stacked horizontal bar — visual overview */}
      {ta > 0 && (
        <Flex
          w="full"
          h="6px"
          borderRadius="full"
          overflow="hidden"
          mb={4}
          bg={trackBg}
        >
          {rows.map(({ label, percentage, colorIdx }) => (
            <Box
              key={label}
              h="full"
              w={`${Math.min(percentage, 100)}%`}
              bg={ALLOCATION_COLORS[colorIdx]}
              transition="width 0.5s ease"
            />
          ))}
        </Flex>
      )}

      {/* Composition rows */}
      <VStack align="stretch" spacing={0} flex={1}>
        {rows.map(({ label, value, percentage, icon, colorIdx }, idx) => {
          const { main, decimals } = splitCurrencyForDisplay(value, sym);
          const barColor = ALLOCATION_COLORS[colorIdx];

          return (
            <Box
              key={label}
              py={3}
              borderTop={idx > 0 ? "1px solid" : "none"}
              borderColor={dividerColor}
            >
              {/* Top row: icon + label + amount */}
              <Flex align="center" justify="space-between" mb={1.5}>
                <Flex align="center" gap={2.5}>
                  <Flex
                    w={7}
                    h={7}
                    borderRadius="lg"
                    bg={barColor + "18"}
                    align="center"
                    justify="center"
                    flexShrink={0}
                  >
                    <Icon as={icon} boxSize={3.5} color={barColor} />
                  </Flex>
                  <Box>
                    <Text fontSize="sm" fontWeight="600" color={primaryText} lineHeight="short">
                      {label}
                    </Text>
                    <Text fontSize="2xs" color={secondaryText} fontWeight="500">
                      {percentage.toFixed(1)}% of total
                    </Text>
                  </Box>
                </Flex>
                <HStack spacing={0} align="baseline">
                  <Text fontSize="sm" fontWeight="bold" color={primaryText} letterSpacing="-0.01em">
                    {main}
                  </Text>
                  <Text fontSize="2xs" color={primaryText} opacity={0.5}>
                    {decimals}
                  </Text>
                </HStack>
              </Flex>

              {/* Progress bar */}
              <Box w="full" h="3px" bg={trackBg} borderRadius="full" overflow="hidden">
                <Box
                  h="full"
                  w={`${Math.min(percentage, 100)}%`}
                  bg={barColor}
                  borderRadius="full"
                  transition="width 0.5s ease"
                />
              </Box>
            </Box>
          );
        })}
      </VStack>

      {/* MF gain footer */}
      {mf > 0 && (
        <Box
          mt={3}
          pt={3}
          borderTop="1px solid"
          borderColor={dividerColor}
        >
          <Flex
            align="center"
            justify="space-between"
            bg={gain >= 0 ? gainBg : lossBg}
            borderRadius="lg"
            px={3}
            py={2}
          >
            <Text fontSize="xs" color={secondaryText} fontWeight="500">
              MF unrealised gain
            </Text>
            <HStack spacing={0} align="baseline">
              <Text
                fontSize="sm"
                fontWeight="bold"
                color={gain >= 0 ? positiveColor : negativeColor}
              >
                {gain >= 0 ? "+" : ""}
                {splitCurrencyForDisplay(gain, sym).main}
              </Text>
              <Text
                fontSize="2xs"
                color={gain >= 0 ? positiveColor : negativeColor}
                opacity={0.6}
              >
                {splitCurrencyForDisplay(gain, sym).decimals}
              </Text>
            </HStack>
          </Flex>
        </Box>
      )}
    </MotionBox>
  );
};

export default PortfolioComposition;
