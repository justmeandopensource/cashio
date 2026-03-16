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
import { TrendingUp, Building, ShieldAlert } from "lucide-react";
import { splitCurrencyForDisplay } from "@/features/mutual-funds/utils";

interface NetWorthSummaryProps {
  netWorth: number | string;
  totalAssets: number | string;
  totalLiabilities: number | string;
  currencySymbol: string;
}

const NetWorthSummary: React.FC<NetWorthSummaryProps> = ({
  netWorth,
  totalAssets,
  totalLiabilities,
  currencySymbol,
}) => {
  const cardBg = useColorModeValue("primaryBg", "cardDarkBg");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const labelColor = useColorModeValue("gray.400", "gray.500");
  const positiveColor = useColorModeValue("green.500", "green.300");
  const negativeColor = useColorModeValue("red.500", "red.300");
  const sym = currencySymbol || "₹";

  const nw = Number(netWorth);
  const ta = Number(totalAssets);
  const tl = Number(totalLiabilities);

  const cards = [
    {
      icon: TrendingUp,
      label: "Net Worth",
      value: nw,
      accentColor: nw >= 0 ? "green.400" : "red.400",
      valueColor: nw >= 0 ? positiveColor : negativeColor,
    },
    {
      icon: Building,
      label: "Total Assets",
      value: ta,
      accentColor: "teal.400",
      valueColor: positiveColor,
    },
    {
      icon: ShieldAlert,
      label: "Total Liabilities",
      value: tl,
      accentColor: "orange.400",
      valueColor: tl <= 0 ? positiveColor : negativeColor,
    },
  ];

  return (
    <SimpleGrid columns={{ base: 1, sm: 3 }} spacing={{ base: 3, md: 4 }}>
      {cards.map(({ icon, label, value, accentColor, valueColor }) => {
        const { main, decimals } = splitCurrencyForDisplay(value, sym);
        return (
          <Box
            key={label}
            bg={cardBg}
            p={{ base: 3, md: 4 }}
            borderRadius="md"
            boxShadow="sm"
            border="1px solid"
            borderColor={borderColor}
            borderTopWidth="3px"
            borderTopColor={accentColor}
          >
            <Flex align="center" gap={1.5} mb={1}>
              <Icon as={icon} boxSize={3} color={labelColor} />
              <Text
                fontSize="2xs"
                fontWeight="semibold"
                textTransform="uppercase"
                letterSpacing="wider"
                color={labelColor}
              >
                {label}
              </Text>
            </Flex>
            <HStack spacing={0} align="baseline">
              <Text
                fontSize={{ base: "md", md: "xl" }}
                fontWeight="bold"
                color={valueColor}
                lineHeight="short"
              >
                {main}
              </Text>
              <Text fontSize="xs" color={valueColor} opacity={0.7}>
                {decimals}
              </Text>
            </HStack>
          </Box>
        );
      })}
    </SimpleGrid>
  );
};

export default NetWorthSummary;
