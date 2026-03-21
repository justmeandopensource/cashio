import { FC, useMemo } from "react";
import { Box, Text, Flex, useColorModeValue, useBreakpointValue } from "@chakra-ui/react";
import { ResponsiveBar } from "@nivo/bar";
import { TransactionBarDatum } from "./useFundAnalyticsData";

interface TransactionHistoryChartProps {
  data: TransactionBarDatum[];
  currencySymbol: string;
}

const BAR_COLORS: Record<string, string> = {
  buy: "#38A169",
  sell: "#E53E3E",
  switchIn: "#3182CE",
  switchOut: "#DD6B20",
};

const BAR_LABELS: Record<string, string> = {
  buy: "Buy",
  sell: "Sell",
  switchIn: "Switch In",
  switchOut: "Switch Out",
};

const TransactionHistoryChart: FC<TransactionHistoryChartProps> = ({
  data,
  currencySymbol,
}) => {
  const maxTicks = useBreakpointValue({ base: 5, md: 10 }) || 5;
  const textColor = useColorModeValue("#4A5568", "#A0AEC0");
  const gridColor = useColorModeValue("#E2E8F0", "#2D3748");
  const tooltipBg = useColorModeValue("#FFFFFF", "#1A202C");
  const tooltipBorder = useColorModeValue("#E2E8F0", "#4A5568");

  const tickValues = useMemo(() => {
    const dates = data.map((d) => d.date);
    if (dates.length <= maxTicks) return undefined;
    const step = Math.ceil(dates.length / maxTicks);
    const ticks = dates.filter((_, i) => i % step === 0);
    if (ticks[ticks.length - 1] !== dates[dates.length - 1]) {
      ticks.push(dates[dates.length - 1]);
    }
    return ticks;
  }, [data, maxTicks]);

  if (data.length === 0) {
    return (
      <Box textAlign="center" py={8}>
        <Text color="gray.500">No transaction data available</Text>
      </Box>
    );
  }

  return (
    <Box>
      <Box h={{ base: "300px", md: "350px" }}>
        <ResponsiveBar
          data={data}
          keys={["buy", "switchIn", "sell", "switchOut"]}
          indexBy="date"
          margin={{ top: 20, right: 20, bottom: 80, left: 60 }}
          padding={0.3}
          valueScale={{ type: "linear" }}
          indexScale={{ type: "band", round: true }}
          colors={({ id }) => BAR_COLORS[id as string] || "#888"}
          axisBottom={{
            tickRotation: -45,
            tickSize: 5,
            tickPadding: 5,
            format: (v: string) => {
              const d = new Date(v);
              return d.toLocaleDateString("en", { month: "short", year: "2-digit" });
            },
            tickValues,
          }}
          axisLeft={{
            tickSize: 5,
            tickPadding: 5,
            format: (v) => {
              const abs = Math.abs(Number(v));
              if (abs >= 100000) return `${Number(v) < 0 ? "-" : ""}${currencySymbol}${(abs / 100000).toFixed(1)}L`;
              if (abs >= 1000) return `${Number(v) < 0 ? "-" : ""}${currencySymbol}${(abs / 1000).toFixed(1)}K`;
              return `${currencySymbol}${v}`;
            },
          }}
          layers={["grid", "bars", "markers", "axes", "legends", "annotations"]}
          enableLabel={false}
          tooltip={({ id, value, indexValue }) => (
            <Box
              bg={tooltipBg}
              border="1px solid"
              borderColor={tooltipBorder}
              borderRadius="md"
              px={3}
              py={2}
              boxShadow="lg"
              fontSize="xs"
              minW="180px"
              whiteSpace="nowrap"
            >
              <Text fontWeight="bold" mb={1}>
                {indexValue}
              </Text>
              <Text color={BAR_COLORS[id as string]}>
                {BAR_LABELS[id as string]}: {currencySymbol}
                {Math.abs(value ?? 0).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </Text>
            </Box>
          )}
          theme={{
            axis: {
              ticks: { text: { fill: textColor, fontSize: 11 } },
            },
            grid: { line: { stroke: gridColor, strokeWidth: 1 } },
          }}
          markers={[
            {
              axis: "y",
              value: 0,
              lineStyle: { stroke: textColor, strokeWidth: 1, strokeOpacity: 0.5 },
            },
          ]}
        />
      </Box>
      <Flex gap={4} justify="center" mt={2} wrap="wrap">
        {Object.entries(BAR_LABELS).map(([key, label]) => (
          <Flex key={key} align="center" gap={1}>
            <Box w={3} h={3} borderRadius="sm" bg={BAR_COLORS[key]} />
            <Text fontSize="xs" color={textColor}>
              {label}
            </Text>
          </Flex>
        ))}
      </Flex>
    </Box>
  );
};

export default TransactionHistoryChart;
