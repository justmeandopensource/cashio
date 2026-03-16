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
import { Landmark, TrendingUp, Gem, BarChart2 } from "lucide-react";
import { splitCurrencyForDisplay } from "@/features/mutual-funds/utils";
import { ALLOCATION_COLORS } from "./AssetAllocationChart";

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
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const labelColor = useColorModeValue("gray.400", "gray.500");
  const primaryText = useColorModeValue("gray.800", "gray.100");
  const secondaryText = useColorModeValue("gray.500", "gray.400");
  const dividerColor = useColorModeValue("gray.100", "gray.700");
  const trackBg = useColorModeValue("gray.100", "gray.700");
  const positiveColor = useColorModeValue("green.500", "green.300");
  const negativeColor = useColorModeValue("red.500", "red.300");
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
    <Box
      bg={cardBg}
      border="1px solid"
      borderColor={borderColor}
      borderRadius="md"
      boxShadow="sm"
      p={{ base: 3, md: 4 }}
      h="full"
    >
      {/* Card header */}
      <Flex align="center" gap={1.5} mb={4}>
        <Icon as={BarChart2} boxSize={3} color={labelColor} />
        <Text
          fontSize="2xs"
          fontWeight="semibold"
          textTransform="uppercase"
          letterSpacing="wider"
          color={labelColor}
        >
          Portfolio Composition
        </Text>
      </Flex>

      <VStack align="stretch" spacing={0} divider={<Box h="1px" bg={dividerColor} />}>
        {rows.map(({ label, value, percentage, icon, colorIdx }) => {
          const { main, decimals } = splitCurrencyForDisplay(value, sym);
          const barColor = ALLOCATION_COLORS[colorIdx];

          return (
            <Box key={label} py={3}>
              {/* Top row: icon + label + amount */}
              <Flex align="center" justify="space-between" mb={2}>
                <Flex align="center" gap={2}>
                  <Flex
                    w={6}
                    h={6}
                    borderRadius="md"
                    bg={barColor + "26"}
                    align="center"
                    justify="center"
                    flexShrink={0}
                  >
                    <Icon as={icon} boxSize={3} color={barColor} />
                  </Flex>
                  <Text fontSize="sm" fontWeight="medium" color={primaryText}>
                    {label}
                  </Text>
                </Flex>
                <HStack spacing={0} align="baseline">
                  <Text fontSize="sm" fontWeight="semibold" color={primaryText}>
                    {main}
                  </Text>
                  <Text fontSize="2xs" color={primaryText} opacity={0.7}>
                    {decimals}
                  </Text>
                </HStack>
              </Flex>

              {/* Progress bar */}
              <Box w="full" h="4px" bg={trackBg} borderRadius="full" overflow="hidden" mb={1}>
                <Box
                  h="full"
                  w={`${Math.min(percentage, 100)}%`}
                  bg={barColor}
                  borderRadius="full"
                  transition="width 0.4s ease"
                />
              </Box>

              {/* Percentage */}
              <Text fontSize="2xs" color={secondaryText}>
                {percentage.toFixed(1)}% of total assets
              </Text>
            </Box>
          );
        })}
      </VStack>

      {/* MF gain footer */}
      {mf > 0 && (
        <Box
          mt={4}
          pt={3}
          borderTop="1px solid"
          borderColor={dividerColor}
        >
          <Flex align="center" justify="space-between">
            <Text fontSize="xs" color={secondaryText}>
              Mutual funds unrealised gain
            </Text>
            <HStack spacing={0} align="baseline">
              <Text
                fontSize="sm"
                fontWeight="semibold"
                color={gain >= 0 ? positiveColor : negativeColor}
              >
                {gain >= 0 ? "+" : ""}
                {splitCurrencyForDisplay(gain, sym).main}
              </Text>
              <Text
                fontSize="2xs"
                color={gain >= 0 ? positiveColor : negativeColor}
                opacity={0.7}
              >
                {splitCurrencyForDisplay(gain, sym).decimals}
              </Text>
            </HStack>
          </Flex>
        </Box>
      )}
    </Box>
  );
};

export default PortfolioComposition;
