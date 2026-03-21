import { FC } from "react";
import {
  Box,
  Text,
  Flex,
  HStack,
  VStack,
  SimpleGrid,
  Icon,
  useColorModeValue,
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import {
  Wallet,
  TrendingUp,
  Activity,
  BadgeCheck,
  Percent,
  Clock,
} from "lucide-react";
import {
  splitCurrencyForDisplay,
  splitPercentageForDisplay,
} from "../../utils";
import { SummaryMetrics } from "./useFundAnalyticsData";

const MotionSimpleGrid = motion(SimpleGrid);
const MotionBox = motion(Box);

interface FundAnalyticsSummaryCardsProps {
  metrics: SummaryMetrics;
  currencySymbol: string;
}

const formatHoldingPeriod = (days: number | null): string => {
  if (!days || days <= 0) return "--";
  const years = Math.floor(days / 365);
  const months = Math.floor((days % 365) / 30);
  if (years > 0 && months > 0) return `${years}y ${months}m`;
  if (years > 0) return `${years}y`;
  if (months > 0) return `${months}m`;
  return `${days}d`;
};

const FundAnalyticsSummaryCards: FC<FundAnalyticsSummaryCardsProps> = ({
  metrics,
  currencySymbol,
}) => {
  const cardBg = useColorModeValue("primaryBg", "cardDarkBg");
  const cardBorderColor = useColorModeValue("gray.100", "gray.700");
  const labelIconColor = useColorModeValue("gray.400", "gray.500");
  const tertiaryTextColor = useColorModeValue("gray.600", "gray.400");
  const positiveColor = useColorModeValue("green.500", "green.300");
  const negativeColor = useColorModeValue("red.500", "red.300");

  const investedAccent = useColorModeValue("blue.400", "blue.300");
  const valueAccent = useColorModeValue("teal.400", "teal.300");
  const unrealizedAccent = useColorModeValue(
    metrics.unrealizedPnl >= 0 ? "green.400" : "red.400",
    metrics.unrealizedPnl >= 0 ? "green.300" : "red.300",
  );
  const realizedAccent = useColorModeValue(
    metrics.realizedGain >= 0 ? "green.400" : "red.400",
    metrics.realizedGain >= 0 ? "green.300" : "red.300",
  );
  const xirrAccent = useColorModeValue("purple.400", "purple.300");
  const holdingAccent = useColorModeValue("orange.400", "orange.300");

  const pnlPositiveBadgeBg = useColorModeValue("green.50", "green.900");
  const pnlNegativeBadgeBg = useColorModeValue("red.50", "red.900");

  const cards = [
    {
      icon: Wallet,
      label: "Total Invested",
      accent: investedAccent,
      valueMain: splitCurrencyForDisplay(metrics.totalInvested, currencySymbol).main,
      valueDecimals: splitCurrencyForDisplay(metrics.totalInvested, currencySymbol).decimals,
      color: tertiaryTextColor,
    },
    {
      icon: TrendingUp,
      label: "Current Value",
      accent: valueAccent,
      valueMain: splitCurrencyForDisplay(metrics.currentValue, currencySymbol).main,
      valueDecimals: splitCurrencyForDisplay(metrics.currentValue, currencySymbol).decimals,
      color: useColorModeValue("brand.600", "brand.400"),
    },
    {
      icon: Activity,
      label: "Unrealized P&L",
      accent: unrealizedAccent,
      valueMain:
        (metrics.unrealizedPnl >= 0 ? "+" : "\u2212") +
        splitCurrencyForDisplay(Math.abs(metrics.unrealizedPnl), currencySymbol).main,
      valueDecimals: splitCurrencyForDisplay(Math.abs(metrics.unrealizedPnl), currencySymbol).decimals,
      color: metrics.unrealizedPnl >= 0 ? positiveColor : negativeColor,
      extra: (
        <Flex
          mt={1}
          display="inline-flex"
          align="baseline"
          gap={0}
          px={2}
          py={0.5}
          borderRadius="full"
          bg={metrics.unrealizedPnl >= 0 ? pnlPositiveBadgeBg : pnlNegativeBadgeBg}
        >
          <Text fontSize="2xs" fontWeight="bold" color={metrics.unrealizedPnl >= 0 ? positiveColor : negativeColor}>
            {splitPercentageForDisplay(metrics.unrealizedPnlPercent).main}
          </Text>
          <Text fontSize="2xs" color={metrics.unrealizedPnl >= 0 ? positiveColor : negativeColor} opacity={0.8}>
            {splitPercentageForDisplay(metrics.unrealizedPnlPercent).decimals}
          </Text>
        </Flex>
      ),
    },
    {
      icon: BadgeCheck,
      label: "Realized Gains",
      accent: realizedAccent,
      valueMain:
        (metrics.realizedGain >= 0 ? "+" : "\u2212") +
        splitCurrencyForDisplay(Math.abs(metrics.realizedGain), currencySymbol).main,
      valueDecimals: splitCurrencyForDisplay(Math.abs(metrics.realizedGain), currencySymbol).decimals,
      color: metrics.realizedGain >= 0 ? positiveColor : negativeColor,
    },
    {
      icon: Percent,
      label: "XIRR",
      accent: xirrAccent,
      valueMain:
        metrics.xirr != null
          ? splitPercentageForDisplay(metrics.xirr).main
          : "--",
      valueDecimals:
        metrics.xirr != null
          ? splitPercentageForDisplay(metrics.xirr).decimals
          : "",
      color:
        metrics.xirr != null
          ? metrics.xirr >= 0
            ? positiveColor
            : negativeColor
          : tertiaryTextColor,
    },
    {
      icon: Clock,
      label: "Holding Period",
      accent: holdingAccent,
      valueMain: formatHoldingPeriod(metrics.holdingPeriodDays),
      valueDecimals: "",
      color: tertiaryTextColor,
    },
  ];

  return (
    <MotionSimpleGrid
      columns={{ base: 2, sm: 3 }}
      spacing={{ base: 3, md: 4 }}
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: 0.06 } },
      }}
    >
      {cards.map(({ icon, label, accent, valueMain, valueDecimals, color, extra }) => (
        <MotionBox
          key={label}
          variants={{
            hidden: { opacity: 0, y: 10 },
            visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
          }}
          h="100%"
        >
          <Box
            p={4}
            borderRadius="xl"
            bg={cardBg}
            border="1px solid"
            borderColor={cardBorderColor}
            overflow="hidden"
            position="relative"
            transition="border-color 0.2s ease"
            _hover={{ borderColor: accent }}
            h="100%"
          >
            <Box
              position="absolute"
              top={0}
              left={0}
              right={0}
              h="2px"
              bg={accent}
              opacity={0.7}
            />
            <Flex align="center" gap={1.5} mb={2}>
              <Flex w={5} h={5} borderRadius="md" bg={accent} opacity={0.12} position="absolute" />
              <Flex w={5} h={5} borderRadius="md" align="center" justify="center">
                <Icon as={icon} boxSize={3} color={accent} />
              </Flex>
              <Text
                fontSize="2xs"
                fontWeight="semibold"
                textTransform="uppercase"
                letterSpacing="wider"
                color={labelIconColor}
              >
                {label}
              </Text>
            </Flex>
            <VStack align="start" spacing={0}>
              <Flex align="baseline" wrap="nowrap">
                <Text
                  fontSize={{ base: "md", md: "lg" }}
                  fontWeight="bold"
                  color={color}
                  lineHeight="short"
                  letterSpacing="-0.01em"
                  whiteSpace="nowrap"
                >
                  {valueMain}
                </Text>
                {valueDecimals && (
                  <Text fontSize="xs" color={color} opacity={0.6} whiteSpace="nowrap">
                    {valueDecimals}
                  </Text>
                )}
              </Flex>
              {extra}
            </VStack>
          </Box>
        </MotionBox>
      ))}
    </MotionSimpleGrid>
  );
};

export default FundAnalyticsSummaryCards;
