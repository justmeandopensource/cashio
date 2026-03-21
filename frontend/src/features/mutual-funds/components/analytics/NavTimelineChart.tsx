import { FC, useMemo } from "react";
import { Box, Text, Flex, useColorModeValue, useBreakpointValue } from "@chakra-ui/react";
import { ResponsiveLine, CustomLayerProps, Point } from "@nivo/line";
import { NavTimelinePoint } from "./useFundAnalyticsData";

const TYPE_COLORS: Record<string, string> = {
  buy: "#38A169",
  sell: "#E53E3E",
  switch_in: "#3182CE",
  switch_out: "#DD6B20",
  current: "#805AD5",
};

const TYPE_LABELS: Record<string, string> = {
  buy: "Buy",
  sell: "Sell",
  switch_in: "Switch In",
  switch_out: "Switch Out",
  current: "Current NAV",
};

const formatDateLabel = (dateStr: string): string => {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en", { month: "short", year: "2-digit" });
};

interface NavTimelineChartProps {
  data: NavTimelinePoint[];
  currencySymbol: string;
}

const NavTimelineChart: FC<NavTimelineChartProps> = ({ data, currencySymbol }) => {
  const maxTicks = useBreakpointValue({ base: 5, md: 10 }) || 5;
  const textColor = useColorModeValue("#4A5568", "#A0AEC0");
  const gridColor = useColorModeValue("#E2E8F0", "#2D3748");
  const tooltipBg = useColorModeValue("#FFFFFF", "#1A202C");
  const tooltipBorder = useColorModeValue("#E2E8F0", "#4A5568");

  const lineData = useMemo(() => {
    if (data.length === 0) return [];
    return [
      {
        id: "NAV",
        data: data.map((p) => ({ x: p.x, y: p.y })),
      },
    ];
  }, [data]);

  // Compute normalized point sizes (8-20px)
  const pointSizes = useMemo(() => {
    const amounts = data.map((p) => p.amount).filter((a) => a > 0);
    if (amounts.length === 0) return data.map(() => 8);
    const min = Math.min(...amounts);
    const max = Math.max(...amounts);
    const range = max - min || 1;
    return data.map((p) => {
      if (p.amount <= 0) return 6;
      return 8 + ((p.amount - min) / range) * 12;
    });
  }, [data]);

  const tickValues = useMemo(() => {
    const xValues = data.map((p) => p.x);
    if (xValues.length <= maxTicks) return undefined; // show all
    const step = Math.ceil(xValues.length / maxTicks);
    const ticks = xValues.filter((_, i) => i % step === 0);
    // Always include the last value
    if (ticks[ticks.length - 1] !== xValues[xValues.length - 1]) {
      ticks.push(xValues[xValues.length - 1]);
    }
    return ticks;
  }, [data, maxTicks]);

  const CustomPoints: FC<CustomLayerProps> = ({ points }) => {
    return (
      <>
        {points.map((point, i) => {
          const originalData = data[i];
          if (!originalData) return null;
          const color = TYPE_COLORS[originalData.type] || "#805AD5";
          const size = pointSizes[i] || 8;
          return (
            <circle
              key={point.id}
              cx={point.x}
              cy={point.y}
              r={size / 2}
              fill={color}
              stroke="white"
              strokeWidth={1.5}
              style={{ cursor: "pointer" }}
            />
          );
        })}
      </>
    );
  };

  const renderTooltip = useMemo(() => {
    return ({ point }: { point: Point }) => {
      const dateStr = String(point.data.x);
      const original = data.find((d) => d.x === dateStr) || null;
      return (
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
            {dateStr}
          </Text>
          <Text>
            NAV: {currencySymbol}
            {Number(point.data.y).toFixed(4)}
          </Text>
          {original && original.type !== "current" && (
            <>
              <Text color={TYPE_COLORS[original.type]}>
                {TYPE_LABELS[original.type]}
              </Text>
              <Text>Units: {original.units.toFixed(3)}</Text>
              <Text>
                Amount: {currencySymbol}
                {original.amount.toFixed(2)}
              </Text>
            </>
          )}
          {original && original.type === "current" && (
            <Text color={TYPE_COLORS.current}>Current NAV</Text>
          )}
        </Box>
      );
    };
  }, [data, currencySymbol, tooltipBg, tooltipBorder]);

  if (data.length === 0) {
    return (
      <Box textAlign="center" py={8}>
        <Text color="gray.500">No transaction data available</Text>
      </Box>
    );
  }

  return (
    <Box>
      <Box h={{ base: "250px", md: "300px" }}>
        <ResponsiveLine
          data={lineData}
          margin={{ top: 20, right: 20, bottom: 50, left: 60 }}
          xScale={{ type: "point" }}
          yScale={{ type: "linear", min: "auto", max: "auto", stacked: false }}
          curve="monotoneX"
          axisBottom={{
            tickRotation: -45,
            tickSize: 5,
            tickPadding: 5,
            format: formatDateLabel,
            tickValues,
          }}
          axisLeft={{
            tickSize: 5,
            tickPadding: 5,
            format: (v) => `${currencySymbol}${Number(v).toFixed(4)}`,
          }}
          enablePoints={false}
          layers={[
            "grid",
            "markers",
            "axes",
            "areas",
            "crosshair",
            "lines",
            CustomPoints,
            "mesh",
            "legends",
          ]}
          useMesh={true}
          tooltip={renderTooltip}
          theme={{
            axis: {
              ticks: { text: { fill: textColor, fontSize: 11 } },
            },
            grid: { line: { stroke: gridColor, strokeWidth: 1 } },
            crosshair: { line: { stroke: textColor, strokeWidth: 1, strokeOpacity: 0.35 } },
          }}
          colors={["#38B2AC"]}
          lineWidth={2}
        />
      </Box>
      {/* Legend */}
      <Flex gap={4} justify="center" mt={2} wrap="wrap">
        {Object.entries(TYPE_LABELS).map(([key, label]) => (
          <Flex key={key} align="center" gap={1}>
            <Box w={3} h={3} borderRadius="full" bg={TYPE_COLORS[key]} />
            <Text fontSize="xs" color={textColor}>
              {label}
            </Text>
          </Flex>
        ))}
      </Flex>
    </Box>
  );
};

export default NavTimelineChart;
