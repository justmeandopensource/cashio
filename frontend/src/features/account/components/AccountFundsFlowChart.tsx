import React, { useMemo } from "react";
import {
  Box,
  Flex,
  Heading,
  Icon,
  Text,
  VStack,
  useColorModeValue,
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import { ResponsiveBar } from "@nivo/bar";
import type { BarDatum, BarTooltipProps } from "@nivo/bar";
import { ArrowLeftRight } from "lucide-react";
import useLedgerStore from "@/components/shared/store";
import { formatNumberAsCurrency } from "@/components/shared/utils";
import { useAccountFundsFlow } from "../hooks";
import type { FundsFlowCounterparty } from "../api";

const MotionBox = motion.create(Box);

interface AccountFundsFlowChartProps {
  accountId: string;
}

interface CounterpartyLookup {
  [month: string]: {
    inflow: FundsFlowCounterparty[];
    outflow: FundsFlowCounterparty[];
  };
}

const formatMonth = (value: string | number) => {
  const str = String(value);
  if (str.includes("-")) {
    const [year, month] = str.split("-");
    return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString(
      "en-US",
      { month: "short", year: "2-digit" }
    );
  }
  return str;
};

const AccountFundsFlowChart: React.FC<AccountFundsFlowChartProps> = ({
  accountId,
}) => {
  const ledgerId = useLedgerStore((s) => s.ledgerId);
  const currencySymbol = useLedgerStore((s) => s.currencySymbol);
  const sym = currencySymbol || "$";

  const cardBg = useColorModeValue("primaryBg", "cardDarkBg");
  const sectionBorderColor = useColorModeValue("gray.100", "gray.700");
  const primaryTextColor = useColorModeValue("gray.800", "gray.100");
  const iconColor = useColorModeValue("brand.500", "brand.300");
  const gridStroke = useColorModeValue("#e2e8f0", "#2d3748");
  const axisTickColor = useColorModeValue("#718096", "#cbd5e0");
  const zeroLineColor = useColorModeValue("#e2e8f0", "#4a5568");
  const tooltipBg = useColorModeValue("#fff", "#2d3748");
  const tooltipBorder = useColorModeValue("#e2e8f0", "#4a5568");
  const tooltipText = useColorModeValue("#2d3748", "#e2e8f0");

  const inflowColor = useColorModeValue("#38B2AC", "#4FD1C5");
  const outflowColor = useColorModeValue("#E53E3E", "#FC8181");

  const { data } = useAccountFundsFlow(ledgerId || "", accountId);

  const { chartData, counterpartyMap } = useMemo(() => {
    if (!data?.months) return { chartData: [] as BarDatum[], counterpartyMap: {} as CounterpartyLookup };

    const cpMap: CounterpartyLookup = {};
    const bars: BarDatum[] = data.months.map((m) => {
      cpMap[m.month] = {
        inflow: m.inflow_counterparties,
        outflow: m.outflow_counterparties,
      };
      return {
        month: m.month,
        "Funds In": m.inflow,
        "Funds Out": -m.outflow,
      };
    });

    return { chartData: bars, counterpartyMap: cpMap };
  }, [data]);

  if (!data || !data.has_data) {
    return null;
  }

  const nivoTheme = {
    axis: { ticks: { text: { fill: axisTickColor, fontSize: 11 } } },
    grid: { line: { stroke: gridStroke, strokeWidth: 1 } },
  };

  const axisLeftFormat = (v: number | string) => {
    const num = Number(v);
    const abs = Math.abs(num);
    if (abs === 0) return "";
    if (abs >= 100000) return `${sym}${(num / 100000).toFixed(1)}L`;
    if (abs >= 1000) return `${sym}${(num / 1000).toFixed(1)}K`;
    return `${sym}${num}`;
  };

  const customTooltip = ({ id, value, indexValue, color }: BarTooltipProps<BarDatum>) => {
    const isInflow = id === "Funds In";
    const month = String(indexValue);
    const cp = counterpartyMap[month];
    const counterparties = isInflow ? cp?.inflow : cp?.outflow;
    const absValue = Math.abs(value as number);

    return (
      <Box
        bg={tooltipBg}
        border="1px solid"
        borderColor={tooltipBorder}
        borderRadius="lg"
        px={3}
        py={2.5}
        boxShadow="lg"
        fontSize="xs"
        minW="180px"
        maxW="280px"
      >
        <Text fontWeight="semibold" color={tooltipText} mb={1.5} fontSize="xs">
          {formatMonth(indexValue)}
        </Text>
        <Flex align="center" gap={2} mb={counterparties?.length ? 1.5 : 0}>
          <Box
            w="8px"
            h="8px"
            borderRadius="full"
            bg={color}
            flexShrink={0}
          />
          <Flex justify="space-between" flex={1} align="baseline">
            <Text color={tooltipText} opacity={0.7} fontSize="xs">
              {String(id)}
            </Text>
            <Text fontWeight="600" color={color} fontSize="xs" ml={3}>
              {formatNumberAsCurrency(absValue, sym)}
            </Text>
          </Flex>
        </Flex>
        {counterparties && counterparties.length > 0 && (
          <VStack
            align="stretch"
            spacing={0.5}
            pt={1.5}
            borderTop="1px solid"
            borderColor={tooltipBorder}
          >
            <Text
              fontSize="2xs"
              color={tooltipText}
              opacity={0.5}
              fontWeight="medium"
              textTransform="uppercase"
              letterSpacing="wider"
              mb={0.5}
            >
              {isInflow ? "From" : "To"}
            </Text>
            {counterparties.map((c) => (
              <Flex
                key={c.account_id}
                justify="space-between"
                gap={2}
                align="baseline"
              >
                <Text fontSize="2xs" color={tooltipText} noOfLines={1}>
                  {c.account_name}
                </Text>
                <Text
                  fontSize="2xs"
                  fontWeight="600"
                  color={tooltipText}
                  flexShrink={0}
                >
                  {formatNumberAsCurrency(c.amount, sym)}
                </Text>
              </Flex>
            ))}
          </VStack>
        )}
      </Box>
    );
  };

  return (
    <MotionBox
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <Box
        bg={cardBg}
        p={{ base: 4, md: 5 }}
        borderRadius="xl"
        border="1px solid"
        borderColor={sectionBorderColor}
        h="full"
      >
        <Flex align="center" gap={2} mb={4}>
          <Icon as={ArrowLeftRight} boxSize={4} color={iconColor} />
          <Heading
            as="h3"
            size="sm"
            color={primaryTextColor}
            letterSpacing="-0.02em"
          >
            Funds Flow
          </Heading>
        </Flex>

        <Box height={{ base: "220px", md: "280px" }} width="full">
          <ResponsiveBar
            data={chartData}
            keys={["Funds In", "Funds Out"]}
            indexBy="month"
            margin={{ top: 10, right: 10, bottom: 10, left: 60 }}
            padding={0.3}
            valueScale={{ type: "linear" }}
            indexScale={{ type: "band", round: true }}
            colors={[inflowColor, outflowColor]}
            borderRadius={2}
            enableLabel={false}
            enableGridY={true}
            enableGridX={false}
            layers={["grid", "bars", "markers", "axes", "legends", "annotations"]}
            motionConfig="gentle"
            markers={[
              {
                axis: "y",
                value: 0,
                lineStyle: {
                  stroke: zeroLineColor,
                  strokeWidth: 1,
                  strokeDasharray: "4 4",
                },
              },
            ]}
            axisBottom={null}
            axisLeft={{
              tickSize: 5,
              tickPadding: 5,
              tickValues: 5,
              format: axisLeftFormat,
            }}
            tooltip={customTooltip}
            theme={nivoTheme}
          />
        </Box>

        <Flex justify="center" gap={4} mt={2}>
          <Flex align="center" gap={1.5}>
            <Box
              w="8px"
              h="8px"
              borderRadius="full"
              bg={inflowColor}
            />
            <Text fontSize="xs" color={primaryTextColor} opacity={0.7}>
              Funds In
            </Text>
          </Flex>
          <Flex align="center" gap={1.5}>
            <Box
              w="8px"
              h="8px"
              borderRadius="full"
              bg={outflowColor}
            />
            <Text fontSize="xs" color={primaryTextColor} opacity={0.7}>
              Funds Out
            </Text>
          </Flex>
        </Flex>
      </Box>
    </MotionBox>
  );
};

export default React.memo(AccountFundsFlowChart);
